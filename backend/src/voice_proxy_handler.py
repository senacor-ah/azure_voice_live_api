# ---------------------------------------------------------------------------------------------
#  Voice Proxy Handler with Session-based Authentication
# ---------------------------------------------------------------------------------------------

"""
WebSocket proxy handler that:
1. Authenticates via oneTimeToken
2. Manages Azure Voice Live connections per user session
3. Enables On-Prem API calls with user context
"""

import asyncio
import base64
import json
import logging
import os
import struct
import wave
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

from azure.ai.voicelive.aio import connect
from azure.ai.voicelive.models import (
    ServerEventType,
    RequestSession,
    Modality,
    InputAudioFormat,
    OutputAudioFormat,
    AzureStandardVoice,
    AzureSemanticVad,
    AvatarConfig,
    ClientEventSessionAvatarConnect,
    FunctionTool,
)
from azure.core.credentials import AzureKeyCredential
from azure.identity import DefaultAzureCredential

from auth_session_manager import AuthSessionManager, SessionInfo
from appointment_workflow import (
    create_appointment_workflow,
    WorkflowContext,
    WorkflowState,
    AppointmentSelection,
)

logger = logging.getLogger(__name__)


class ConversationRecorder:
    """Records conversation audio for later analysis."""
    
    def __init__(self, session_id: str, user_name: str, recordings_dir: str = "recordings"):
        """
        Initialize conversation recorder.
        
        Args:
            session_id: Unique session identifier
            user_name: User's name for filename
            recordings_dir: Directory to save recordings
        """
        self.session_id = session_id
        self.user_name = user_name
        self.recordings_dir = Path(recordings_dir)
        self.recordings_dir.mkdir(exist_ok=True)
        
        # Audio buffers (PCM16 format, 24kHz)
        self.user_audio_chunks: List[bytes] = []
        self.ai_audio_chunks: List[bytes] = []
        
        # Metadata
        self.start_time = datetime.now()
        self.events: List[Dict[str, Any]] = []
        
        logger.info("📹 Recording enabled for session %s", session_id)
    
    def add_user_audio(self, audio_data: bytes) -> None:
        """Add user audio chunk."""
        self.user_audio_chunks.append(audio_data)
    
    def add_ai_audio(self, audio_data: bytes) -> None:
        """Add AI audio chunk."""
        self.ai_audio_chunks.append(audio_data)
    
    def add_event(self, event_type: str, data: Any = None) -> None:
        """Log conversation event with timestamp."""
        self.events.append({
            "timestamp": datetime.now().isoformat(),
            "type": event_type,
            "data": data
        })
    
    def save_recording(self) -> Optional[str]:
        """
        Save conversation as stereo WAV file.
        
        Returns:
            Path to saved file or None if no audio
        """
        logger.debug("Attempting to save recording (user_chunks=%d, ai_chunks=%d)", 
                    len(self.user_audio_chunks), len(self.ai_audio_chunks))
        
        if not self.user_audio_chunks and not self.ai_audio_chunks:
            logger.warning("No audio to save for session %s", self.session_id)
            return None
        
        try:
            # Generate filename
            timestamp = self.start_time.strftime("%Y%m%d_%H%M%S")
            safe_name = "".join(c for c in self.user_name if c.isalnum() or c in (' ', '-', '_')).strip()
            filename = f"{timestamp}_{safe_name}_{self.session_id[:8]}.wav"
            filepath = self.recordings_dir / filename
            
            # Merge audio to stereo WAV
            self._save_stereo_wav(filepath)
            
            # Save metadata
            self._save_metadata(filepath.with_suffix('.json'))
            
            logger.info("💾 Recording saved: %s", filepath)
            return str(filepath)
            
        except Exception as e:
            logger.error("Failed to save recording: %s", e)
            return None
    
    def _save_stereo_wav(self, filepath: Path) -> None:
        """
        Save stereo WAV file with user on left channel, AI on right channel.
        
        Args:
            filepath: Path to save WAV file
        """
        # Combine all chunks
        user_audio = b''.join(self.user_audio_chunks)
        ai_audio = b''.join(self.ai_audio_chunks)
        
        # Determine max length and pad shorter one with silence
        user_samples = len(user_audio) // 2  # 16-bit = 2 bytes per sample
        ai_samples = len(ai_audio) // 2
        max_samples = max(user_samples, ai_samples)
        
        # Pad with silence (0x00 bytes)
        if user_samples < max_samples:
            user_audio += b'\x00' * ((max_samples - user_samples) * 2)
        if ai_samples < max_samples:
            ai_audio += b'\x00' * ((max_samples - ai_samples) * 2)
        
        # Interleave stereo channels (L, R, L, R, ...)
        stereo_data = bytearray()
        for i in range(0, len(user_audio), 2):
            stereo_data.extend(user_audio[i:i+2])  # Left (User)
            stereo_data.extend(ai_audio[i:i+2])    # Right (AI)
        
        # Write WAV file
        with wave.open(str(filepath), 'wb') as wav_file:
            wav_file.setnchannels(2)      # Stereo
            wav_file.setsampwidth(2)      # 16-bit
            wav_file.setframerate(24000)  # 24kHz (Azure Voice Live default)
            wav_file.writeframes(bytes(stereo_data))
    
    def _save_metadata(self, filepath: Path) -> None:
        """
        Save conversation metadata as JSON.
        
        Args:
            filepath: Path to save JSON file
        """
        metadata = {
            "session_id": self.session_id,
            "user_name": self.user_name,
            "start_time": self.start_time.isoformat(),
            "end_time": datetime.now().isoformat(),
            "duration_seconds": (datetime.now() - self.start_time).total_seconds(),
            "user_audio_chunks": len(self.user_audio_chunks),
            "ai_audio_chunks": len(self.ai_audio_chunks),
            "events": self.events
        }
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(metadata, f, indent=2, ensure_ascii=False)


class VoiceProxyHandler:
    """
    Handles authenticated WebSocket connections for Voice Live API.
    
    Architecture:
    1. Client sends oneTimeToken in initial message
    2. Backend exchanges for Bearer Token (stays in backend!)
    3. Creates Azure Voice Live connection for this user
    4. Proxies messages bidirectionally
    5. Can call On-Prem APIs with Bearer Token during session
    6. Optionally records conversations for analysis
    """
    
    def __init__(
        self,
        session_manager: AuthSessionManager,
        azure_endpoint: str,
        azure_api_key: str,
        azure_model: str = "gpt-4o-realtime-preview",
        use_azure_ai_agents: bool = False,
        azure_agent_id: str = "",
        azure_ai_project_name: str = "",
        enable_recording: bool = True,
        recordings_dir: str = "recordings",
        azure_voice_name: str = "de-DE-FlorianMultilingualNeural",
        azure_avatar_enabled: bool = True,
        azure_avatar_character: str = "lisa",
        azure_avatar_style: str = "casual-sitting",
        azure_avatar_video_width: int = 1280,
        azure_avatar_video_height: int = 720,
        azure_avatar_video_bitrate: int = 2000000,
        azure_avatar_ice_urls: Optional[str] = None
    ):
        """
        Initialize the voice proxy handler.
        
        Args:
            session_manager: Auth session manager instance
            azure_endpoint: Azure Voice Live endpoint
            azure_api_key: Azure API key
            azure_model: Model deployment name (e.g., gpt-realtime)
            use_azure_ai_agents: Use Azure AI Foundry Agent
            azure_agent_id: Azure AI Foundry Agent ID (e.g., asst_xxx...)
            azure_ai_project_name: Azure AI Project name for Foundry Agents
            enable_recording: Enable conversation recording
            recordings_dir: Directory for recordings
            azure_voice_name: Azure TTS voice name
            azure_avatar_character: Avatar character (e.g., lisa, james)
            azure_avatar_style: Avatar style (e.g., casual-sitting)
            azure_avatar_video_width: Video width (default: 1280)
            azure_avatar_video_height: Video height (default: 720)
            azure_avatar_video_bitrate: Video bitrate in bps (default: 2000000)
            azure_avatar_ice_urls: Optional comma-separated ICE server URLs
        """
        self.session_manager = session_manager
        self.azure_endpoint = azure_endpoint
        self.azure_api_key = azure_api_key
        self.azure_model = azure_model
        self.use_azure_ai_agents = use_azure_ai_agents
        self.azure_agent_id = azure_agent_id
        self.azure_ai_project_name = azure_ai_project_name
        self.enable_recording = enable_recording
        self.recordings_dir = recordings_dir
        self.azure_voice_name = azure_voice_name
        self.azure_avatar_enabled = azure_avatar_enabled
        self.azure_avatar_character = azure_avatar_character
        self.azure_avatar_style = azure_avatar_style
        self.azure_avatar_video_width = azure_avatar_video_width
        self.azure_avatar_video_height = azure_avatar_video_height
        self.azure_avatar_video_bitrate = azure_avatar_video_bitrate
        self.azure_avatar_ice_urls = azure_avatar_ice_urls
    
    async def handle_connection(self, client_ws) -> None:
        """
        Handle WebSocket connection from client.
        
        Flow:
        1. Receive oneTimeToken from client
        2. Create authenticated session
        3. Connect to Azure Voice Live
        4. Forward messages bidirectionally
        5. Save recording after session ends
        
        Args:
            client_ws: Client WebSocket connection (Flask-Sock or similar)
        """
        session: Optional[SessionInfo] = None
        recorder: Optional[ConversationRecorder] = None
        
        try:
            # 1. AUTHENTICATION: Get oneTimeToken from first message
            session = await self._authenticate_client(client_ws)
            if not session:
                await self._send_error(client_ws, "Authentication failed")
                return
            
            logger.info(
                "Authenticated session %s for user %s",
                session.session_id,
                session.get_user_name()
            )
            
            # 2. OPTIONAL: Initialize conversation recorder
            if self.enable_recording:
                recorder = ConversationRecorder(
                    session_id=session.session_id,
                    user_name=session.get_user_name(),
                    recordings_dir=self.recordings_dir
                )
                recorder.add_event("session_started", {
                    "user_id": session.get_user_id(),
                    "user_name": session.get_user_name()
                })
            
            # 3. OPTIONAL: Load user-specific data from On-Prem
            user_data = await self._load_user_context_data(session)
            
            # 4. CONNECT TO AZURE with user-personalized config (using async with)
            logger.info("Connecting to Azure Voice Live for user %s", session.get_user_name())
            logger.info(f"Endpoint: {self.azure_endpoint}")
            
            # Configure connection based on Agent vs. Model
            connect_params = {
                "endpoint": self.azure_endpoint,
                "connection_options": {
                    "max_msg_size": 10 * 1024 * 1024,
                    "heartbeat": 20,
                    "timeout": 20,
                }
            }
            
            if self.use_azure_ai_agents and self.azure_agent_id:
                # Azure AI Foundry Agent scenario
                # IMPORTANT: Agents require Azure Token Credentials (not API Key!)
                logger.info(f"Using Azure AI Foundry Agent: {self.azure_agent_id}")
                logger.info(f"Project: {self.azure_ai_project_name}")
                logger.info("Authentication: Azure DefaultAzureCredential (Token-based)")
                
                # Use Azure Token Credential for Agent authentication
                connect_params["credential"] = DefaultAzureCredential()
                
                # Build query parameters for Foundry Agent
                query_params = {"agent-id": self.azure_agent_id}
                if self.azure_ai_project_name:
                    query_params["agent-project-name"] = self.azure_ai_project_name
                
                connect_params["query"] = query_params
                # Model is omitted - service uses model associated with Agent
            else:
                # Standard model scenario
                # Use API Key authentication for standard models
                logger.info(f"Using Model: {self.azure_model}")
                logger.info("Authentication: API Key")
                connect_params["credential"] = AzureKeyCredential(self.azure_api_key)
                connect_params["model"] = self.azure_model
            
            async with connect(**connect_params) as azure_conn:
                # Configure session with user-personalized instructions
                await self._configure_azure_session(azure_conn, session, user_data)
                
                # Store connection in session
                session.azure_connection = azure_conn
                
                logger.info("Azure connection established for session %s", session.session_id)
                
                # Send success message to client
                await self._send_message(client_ws, {
                    "type": "proxy.connected",
                    "session_id": session.session_id,
                    "user": {
                        "name": session.get_user_name(),
                        "id": session.get_user_id()
                    }
                })
                
                # 5. BIDIRECTIONAL MESSAGE FORWARDING
                await self._handle_message_forwarding(client_ws, azure_conn, session, recorder)
            
        except Exception as e:
            logger.error("Proxy error: %s", e)
            await self._send_error(client_ws, str(e))
            
        finally:
            logger.info("🏁 FINALLY BLOCK ENTERED for session %s", session.session_id if session else "unknown")
            
            # Save recording before cleanup
            if recorder:
                logger.info("📹 Recorder exists, attempting to save...")
                try:
                    recorder.add_event("session_ended")
                    logger.info("💾 Saving conversation recording...")
                    saved_path = recorder.save_recording()
                    if saved_path:
                        logger.info("🎬 Conversation recording saved: %s", saved_path)
                    else:
                        logger.warning("⚠️ No recording saved (no audio data)")
                except Exception as e:
                    logger.error("❌ Failed to save recording: %s", e, exc_info=True)
            else:
                logger.warning("⚠️ No recorder found in finally block - recording not enabled or not initialized")
            
            # Cleanup session (connection is auto-closed by async with)
            if session:
                self.session_manager.delete_session(session.session_id)
    
    async def _authenticate_client(self, client_ws) -> Optional[SessionInfo]:
        """
        Authenticate client via oneTimeToken.
        
        Expected first message:
        {
            "type": "auth.init",
            "oneTimeToken": "xxx"
        }
        
        Args:
            client_ws: Client WebSocket
            
        Returns:
            SessionInfo or None if authentication failed
        """
        try:
            # Receive first message with oneTimeToken
            first_message = await self._receive_from_client(client_ws)
            if not first_message:
                return None
            
            msg = json.loads(first_message)
            
            if msg.get("type") != "auth.init":
                logger.error("First message must be auth.init, got: %s", msg.get("type"))
                return None
            
            one_time_token = msg.get("oneTimeToken")
            if not one_time_token:
                logger.error("No oneTimeToken in auth.init message")
                return None
            
            # Exchange token for Bearer Token (stays in backend!)
            session = await self.session_manager.create_session_from_one_time_token(
                one_time_token
            )
            
            return session
            
        except Exception as e:
            logger.error("Authentication error: %s", e)
            return None
    
    async def _load_user_context_data(
        self,
        session: SessionInfo
    ) -> Dict[str, Any]:
        """
        Load user-specific data from On-Prem APIs.
        
        This uses the Bearer Token to call On-Prem APIs
        and get user-specific context for personalization.
        
        Args:
            session: Authenticated session with Bearer Token
            
        Returns:
            User context data for personalization
        """
        # 🔧 Development: Return mock data for dummy session
        if session.bearer_token == "dummy-bearer-token-dev-123456":
            logger.info("🔧 Using mock user context data for dummy session")
            return {
                "preferences": {
                    "language": "de",
                    "voice_speed": "normal",
                    "notifications": True,
                    "theme": "dark"
                },
                "history": [
                    {"date": "2024-11-10", "action": "Voice session", "duration": "15m"},
                    {"date": "2024-11-09", "action": "API call", "endpoint": "/customers"},
                    {"date": "2024-11-08", "action": "Voice session", "duration": "8m"}
                ],
                "user_context": session.user_context
            }
        
        try:
            # Example: Load user preferences from On-Prem API
            user_prefs = await self.session_manager.call_onprem_api(
                session_id=session.session_id,
                endpoint="/api/users/preferences",
                method="GET"
            )
            
            # Example: Load user's recent interactions
            recent_history = await self.session_manager.call_onprem_api(
                session_id=session.session_id,
                endpoint="/api/users/history",
                method="GET",
                params={"limit": 5}
            )
            
            return {
                "preferences": user_prefs,
                "history": recent_history,
                "user_context": session.user_context
            }
            
        except Exception as e:
            logger.warning("Failed to load user context data: %s", e)
            return {}
    
    def _build_avatar_config(self) -> Dict[str, Any]:
        """
        Build avatar configuration with explicit video settings.
        
        This follows the Microsoft reference implementation pattern with:
        - Explicit video resolution and bitrate
        - Optional custom ICE servers for NAT traversal
        - Character and style configuration
        
        Returns:
            Avatar configuration dict for AvatarConfig
        """
        logger.info("🎭 Building Avatar Configuration (Microsoft-style):")
        logger.info("   Character: %s", self.azure_avatar_character)
        logger.info("   Style: %s", self.azure_avatar_style)
        logger.info("   Video: %dx%d @ %d bps", 
                   self.azure_avatar_video_width,
                   self.azure_avatar_video_height,
                   self.azure_avatar_video_bitrate)
        
        config = {
            "character": self.azure_avatar_character,
            "customized": False,  # Microsoft uses False for standard avatars
            "video": {
                "resolution": {
                    "width": self.azure_avatar_video_width,
                    "height": self.azure_avatar_video_height
                },
                "bitrate": self.azure_avatar_video_bitrate
            }
        }
        
        # Optional: Add style if specified
        if self.azure_avatar_style:
            config["style"] = self.azure_avatar_style
            logger.info("   Style configured: %s", self.azure_avatar_style)
        
        # Optional: Custom ICE servers for NAT traversal (Microsoft pattern)
        if self.azure_avatar_ice_urls:
            ice_urls = [url.strip() for url in self.azure_avatar_ice_urls.split(",") if url.strip()]
            if ice_urls:
                config["ice_servers"] = [{"urls": ice_urls}]
                logger.info("   Custom ICE servers: %s", ice_urls)
        
        logger.info("   ✅ Avatar config built (Microsoft pattern)")
        return config
    
    async def _configure_azure_session(
        self,
        azure_conn,
        session: SessionInfo,
        user_data: Dict[str, Any]
    ) -> None:
        """
        Configure Azure Voice Live session with user-personalized settings.
        
        Args:
            azure_conn: Azure Voice Live connection (already established)
            session: Authenticated session
            user_data: User-specific data from On-Prem
        """
        try:
            if self.use_azure_ai_agents and self.azure_agent_id:
                # Agent mode: Only configure voice and turn detection
                # Instructions and tools are read-only and come from the Agent definition
                logger.info("Configuring session for Agent mode (instructions/tools are read-only)")
                
                # Build avatar config only if enabled
                avatar_config = None
                if self.azure_avatar_enabled:
                    avatar_config_dict = self._build_avatar_config()
                    avatar_config = AvatarConfig(**avatar_config_dict)
                
                request_session = RequestSession(
                    # Don't set instructions - Agent has its own
                    # Don't set modalities - Agent defines these
                    # Don't set tools - Agent has its own function definitions
                    voice=AzureStandardVoice(
                        name=self.azure_voice_name,
                        type="azure-standard"
                    ),
                    # Enable turn detection for automatic response generation
                    turn_detection=AzureSemanticVad(
                        threshold=0.5,
                        prefix_padding_ms=300,
                        silence_duration_ms=500
                    ),
                    # Avatar configuration (can be None)
                    avatar=avatar_config,
                    # WICHTIG: Tool Choice auf AUTO für Function Calling
                    tool_choice="auto"
                )
            else:
                # Standard model mode: Full configuration
                instructions = self._build_personalized_instructions(session, user_data)
                
                # Build banking tools for Commerzbank use case
                tools = self._build_banking_tools()
                
                # Build avatar config only if enabled
                avatar_config = None
                if self.azure_avatar_enabled:
                    avatar_config_dict = self._build_avatar_config()
                    avatar_config = AvatarConfig(**avatar_config_dict)
                
                request_session = RequestSession(
                    modalities=[Modality.TEXT, Modality.AUDIO],
                    instructions=instructions,
                    tools=tools,
                    tool_choice="auto",
                    input_audio_format=InputAudioFormat.PCM16,
                    output_audio_format=OutputAudioFormat.PCM16,
                    voice=AzureStandardVoice(
                        name=self.azure_voice_name,
                        type="azure-standard"
                    ),
                    temperature=0.7,
                    turn_detection=AzureSemanticVad(
                        threshold=0.5,
                        prefix_padding_ms=300,
                        silence_duration_ms=500
                    ),
                    # Avatar configuration (can be None)
                    avatar=avatar_config
                )
            
            # Update the session
            await azure_conn.session.update(session=request_session)
            
            mode = "Agent" if self.use_azure_ai_agents else "Model"
            logger.info("Azure session configured for user %s (Mode: %s, Turn Detection: ENABLED)", 
                       session.get_user_name(), mode)
            
        except Exception as e:
            logger.error("Failed to configure Azure session: %s", e)
            raise
    
    def _build_personalized_instructions(
        self,
        session: SessionInfo,
        user_data: Dict[str, Any]
    ) -> str:
        """
        Build personalized AI instructions based on user context.
        
        Args:
            session: User session
            user_data: User-specific data
            
        Returns:
            Personalized instruction text
        """
        user_name = session.get_user_name()
        user_prefs = user_data.get("preferences", {})
        
        # If using Azure AI Foundry Agent, instructions are minimal (Agent has own instructions)
        # If using standard model, these are the primary instructions
        if self.use_azure_ai_agents and self.azure_agent_id:
            # Minimal context for Foundry Agent
            instructions = f"""
Speaking with {user_name}.

USER CONTEXT:
- Name: {user_name}
- User ID: {session.get_user_id()}
- Roles: {', '.join(session.user_context.get('roles', []))}

PERSONALIZATION:
{self._format_user_preferences(user_prefs)}
"""
        else:
            # Full instructions for standard model - Senacor Bank Bankberater
            instructions = f"""
Du bist ein freundlicher und kompetenter Bankberater der Senacor Bank, der {user_name} bei Bankgeschäften unterstützt.

DEINE ROLLE:
- Du hilfst bei Überweisungen und anderen Bankgeschäften
- Du bist höflich, professionell und kundenorientiert
- Du sprichst natürlich und auf Deutsch
- Du duzt den Kunden (verwende "du", "dir", "dein" usw.)

KONTEXT ZUM KUNDEN:
- Name: {user_name}
- User ID: {session.get_user_id()}
- Rollen: {', '.join(session.user_context.get('roles', []))}

PERSONALISIERUNG:
{self._format_user_preferences(user_prefs)}

DEIN BANKBERATER-KOLLEGE:
- Dein Kollege für persönliche Beratungstermine ist Michael Weber
- Er ist Senior Bankberater bei der Senacor Bank
- Wenn Kunden einen Termin vereinbaren möchten, vermittle sie zu Michael Weber

WORKFLOW FÜR ÜBERWEISUNGEN:
1. Begrüße den Kunden freundlich
2. Frage nach dem EMPFÄNGERNAMEN
3. Frage nach dem ÜBERWEISUNGSBETRAG in Euro
4. Optional: Frage nach dem Verwendungszweck
5. Wenn du den Namen und Betrag hast, GENERIERE SELBST eine realistische deutsche IBAN
   (Format: DE + 20 Ziffern, z.B. DE89370400440532013000)
6. Verwende dann das Tool "ueberweisung_bestaetigen" mit den Daten
7. Der Kunde kann dann die Überweisung im UI bestätigen oder ablehnen

WORKFLOW FÜR TERMINVEREINBARUNG:
1. Erkenne, wenn der Kunde einen Termin mit seinem Bankberater vereinbaren möchte
   (z.B. "Ich möchte einen Termin", "Kann ich mit meinem Berater sprechen")
2. SAGE dem Kunden: "Lass mich kurz nachschauen, ob dein Berater Michael Weber Zeit hat"
3. Verwende DANN das Tool "termine_abrufen" um verfügbare Termine zu generieren
4. WARTE auf das Ergebnis (du bekommst die Anzahl der gefundenen Termine)
5. SAGE dem Kunden: "Ich habe [Anzahl] Termine gefunden. Einen Moment bitte..."
6. Verwende DANN das Tool "termine_anzeigen" um die Termine im UI anzuzeigen. Aber erst nachdem du ausgesprochen hast!!
7. WARTE auf die Auswahl des Kunden (er wählt im UI) - sage dem Kunden aber nicht das du darauf wartest!
8. WICHTIG: Wenn der Kunde per Sprache einen Termin nennt, der NICHT in der angezeigten Liste ist:
   - SAGE: "Dieser Termin ist leider nicht verfügbar. Bitte wählen Sie einen Termin aus der angezeigten Liste im Interface."
   - Warte weiter auf die Auswahl im UI
9. Nur wenn ein gültiger Termin aus der Liste gewählt wurde:
   - Bestätige: "Perfekt! Dein Termin am [Datum] um [Uhrzeit] Uhr bei Michael Weber ist reserviert."
10. Bei Fehlermeldung (z.B. "Ungültiger Termin"):
    - SAGE: "Es gab ein Problem mit der Terminauswahl. Bitte wählen Sie einen Termin direkt aus der angezeigten Liste."

WICHTIGE REGELN:
- Halte Antworten KURZ (2-3 Sätze)
- Verwende natürliche, gesprochene Sprache
- Spreche den Kunden gelegentlich mit Namen an
- FRAGE NICHT nach der IBAN - denke sie dir aus!
- Die IBAN muss das Format DE + 20 Ziffern haben
- Rufe das Tool auf, sobald du Name und Betrag hast
- Bei Terminwünschen: Erwähne Michael Weber und rufe sofort termine_abrufen auf
"""
        return instructions
    
    def _format_user_preferences(self, prefs: Dict[str, Any]) -> str:
        """Format user preferences for instructions."""
        if not prefs:
            return "- No specific preferences set"
        
        lines = []
        for key, value in prefs.items():
            lines.append(f"- {key}: {value}")
        return "\n".join(lines)
    
    def _build_banking_tools(self) -> List[FunctionTool]:
        """
        Build tools for banking use case (Commerzbank Bankberater).
        
        Returns:
            List of FunctionTool objects for the VoiceLive API
        """
        return [
            FunctionTool(
                type="function",
                name="ueberweisung_bestaetigen",
                description="Zeigt eine Überweisungsbestätigung im UI an, damit der Benutzer die Überweisung bestätigen kann. Verwende dieses Tool NUR, wenn der Benutzer ALLE erforderlichen Informationen (IBAN und Betrag) bereitgestellt hat.",
                parameters={
                    "type": "object",
                    "properties": {
                        "recipient": {
                            "type": "string",
                            "description": "Name des Empfängers der Überweisung"
                        },
                        "iban": {
                            "type": "string",
                            "description": "IBAN des Empfängers im Format DEXX XXXX XXXX XXXX XXXX XX oder DE89370400440532013000"
                        },
                        "amount": {
                            "type": "number",
                            "description": "Betrag in Euro (z.B. 100.50)"
                        },
                        "currency": {
                            "type": "string",
                            "description": "Währung der Überweisung",
                            "default": "EUR"
                        },
                        "purpose": {
                            "type": "string",
                            "description": "Verwendungszweck der Überweisung (optional)"
                        }
                    },
                    "required": ["recipient", "iban", "amount"]
                }
            ),
            FunctionTool(
                type="function",
                name="termine_abrufen",
                description="Ruft verfügbare Termine mit dem Bankberater Michael Weber ab und speichert sie zwischen. Verwende dieses Tool, wenn der Kunde einen Termin vereinbaren möchte.",
                parameters={
                    "type": "object",
                    "properties": {},
                    "required": []
                }
            ),
            FunctionTool(
                type="function",
                name="termine_anzeigen",
                description="Zeigt die abgerufenen Termine im UI an, damit der Kunde einen Termin auswählen kann. Verwende dieses Tool NACHDEM termine_abrufen erfolgreich war.",
                parameters={
                    "type": "object",
                    "properties": {},
                    "required": []
                }
            ),
            FunctionTool(
                type="function",
                name="termin_bestaetigen",
                description="Bestätigt und speichert den vom Kunden ausgewählten Termin. Dieses Tool wird automatisch aufgerufen, nachdem der Kunde im UI einen Termin ausgewählt hat.",
                parameters={
                    "type": "object",
                    "properties": {
                        "termin_id": {
                            "type": "string",
                            "description": "Die ID des ausgewählten Termins"
                        },
                        "datum": {
                            "type": "string",
                            "description": "Datum des Termins im Format YYYY-MM-DD"
                        },
                        "uhrzeit": {
                            "type": "string",
                            "description": "Uhrzeit des Termins im Format HH:MM"
                        }
                    },
                    "required": ["termin_id", "datum", "uhrzeit"]
                }
            )
        ]
    
    def _generate_mock_appointments(self) -> Dict[str, Any]:
        """
        Generate 10 realistic appointment slots with bank advisor Michael Weber.
        Distributed Mon-Fri, 7:00-18:00, over the next 2 weeks.
        
        Returns:
            Dict with advisor info and appointments list
        """
        from datetime import datetime, timedelta
        
        appointments = []
        appointment_times = [
            "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
            "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
            "16:00", "16:30", "17:00", "17:30"
        ]
        
        # Start from tomorrow
        current_date = datetime.now() + timedelta(days=1)
        appointment_id = 1
        
        # Generate 10 appointments over next 2 weeks (weekdays only)
        while len(appointments) < 10:
            # Skip weekends (Monday=0, Sunday=6)
            if current_date.weekday() < 5:  # Mon-Fri
                # Pick a time slot (rotate through available times)
                time_idx = (len(appointments) % len(appointment_times))
                uhrzeit = appointment_times[time_idx]
                
                appointments.append({
                    "id": f"apt_{appointment_id:03d}",
                    "datum": current_date.strftime("%Y-%m-%d"),
                    "uhrzeit": uhrzeit,
                    "verfuegbar": True
                })
                appointment_id += 1
            
            current_date += timedelta(days=1)
        
        return {
            "advisor": {
                "name": "Michael Weber",
                "title": "Senior Bankberater",
                "avatarUrl": "/advisor-avatar.svg"
            },
            "appointments": appointments
        }
    
    async def _handle_message_forwarding(
        self,
        client_ws,
        azure_conn,
        session: SessionInfo,
        recorder: Optional[ConversationRecorder] = None
    ) -> None:
        """
        Handle bidirectional message forwarding between client and Azure.
        
        Args:
            client_ws: Client WebSocket
            azure_conn: Azure Voice Live connection
            session: User session
            recorder: Optional conversation recorder
        """
        client_to_azure_task = asyncio.create_task(
            self._forward_client_to_azure(client_ws, azure_conn, session, recorder),
            name="client_to_azure"
        )
        azure_to_client_task = asyncio.create_task(
            self._forward_azure_to_client(azure_conn, client_ws, session, recorder),
            name="azure_to_client"
        )
        
        try:
            logger.info("⏳ Waiting for message forwarding tasks to complete...")
            # Wait for both tasks to complete (or until one fails)
            # Use gather to raise exceptions immediately
            await asyncio.gather(
                client_to_azure_task,
                azure_to_client_task,
                return_exceptions=False
            )
            logger.info("✅ Both forwarding tasks completed normally")
        except Exception as e:
            logger.info("⚠️ Message forwarding stopped with exception: %s", e)
        finally:
            logger.info("🧹 Cleaning up forwarding tasks...")
            # Cancel any remaining tasks
            for task in [client_to_azure_task, azure_to_client_task]:
                if not task.done():
                    logger.info("  → Cancelling task: %s", task.get_name())
                    task.cancel()
                    try:
                        await task
                    except asyncio.CancelledError:
                        logger.info("  → Task %s cancelled successfully", task.get_name())
                else:
                    logger.info("  → Task %s already done", task.get_name())
            logger.info("✅ Message forwarding cleanup complete, returning to handle_connection")
    
    async def _forward_client_to_azure(
        self,
        client_ws,
        azure_conn,
        session: SessionInfo,
        recorder: Optional[ConversationRecorder] = None
    ) -> None:
        """
        Forward messages from client to Azure.
        
        Args:
            client_ws: Client WebSocket
            azure_conn: Azure connection
            session: User session
            recorder: Optional conversation recorder
        """
        try:
            logger.info("Starting Client → Azure forwarding for session %s", session.session_id)
            message_count = 0
            
            while True:
                message = await self._receive_from_client(client_ws)
                if message is None:
                    logger.info("Client connection closed for session %s (sent %d messages)", 
                               session.session_id, message_count)
                    logger.info("🔚 Breaking client loop - this will trigger recording save")
                    break
                
                message_count += 1
                
                # Parse message
                try:
                    msg = json.loads(message) if isinstance(message, str) else message
                    
                    # Handle special commands
                    if msg.get("type") == "onprem.api.call":
                        # Client requests On-Prem API call
                        await self._handle_onprem_api_request(client_ws, session, msg)
                        continue
                    
                    # Handle function call results from client
                    elif msg.get("type") == "function_call_result":
                        # Client sends function call result (e.g., user confirmed/rejected action)
                        await self._handle_function_call_result(azure_conn, msg, session)
                        continue
                    
                    # Handle WebRTC avatar connection
                    elif msg.get("type") == "session.avatar.connect":
                        logger.info("📹 Received WebRTC offer from client")
                        try:
                            # Extract SDP from client message
                            client_sdp = msg.get("client_sdp", "")
                            
                            if not client_sdp:
                                logger.error("No client_sdp in avatar connect message!")
                                continue
                            
                            logger.info("   📤 Sending avatar connect to Azure with SDP (length: %d)", len(client_sdp))
                            
                            # Create proper SDK event object
                            avatar_connect_event = ClientEventSessionAvatarConnect(
                                client_sdp=client_sdp
                            )
                            
                            # Send using SDK method
                            await azure_conn.send(avatar_connect_event)
                            logger.info("   ✅ WebRTC avatar connect sent to Azure")
                            
                        except Exception as e:
                            logger.error("Failed to send avatar connect: %s", e)
                        continue
                    
                    # Forward to Azure (audio, text, etc.)
                    if msg.get("type") == "input_audio_buffer.append":
                        audio_data = msg.get("audio")
                        if audio_data:
                            # IMPORTANT: append() requires keyword argument!
                            await azure_conn.input_audio_buffer.append(audio=audio_data)
                            
                            # Record user audio (decode from base64)
                            if recorder:
                                try:
                                    audio_bytes = base64.b64decode(audio_data)
                                    recorder.add_user_audio(audio_bytes)
                                except Exception as e:
                                    logger.debug("Failed to record user audio: %s", e)
                    else:
                        # Forward other message types
                        await azure_conn.send(message)
                        
                except json.JSONDecodeError:
                    # Binary audio data - forward directly
                    # IMPORTANT: append() requires keyword argument!
                    await azure_conn.input_audio_buffer.append(audio=message)
                    
        except Exception as e:
            logger.info("Client → Azure forwarding stopped: %s", e)
    
    async def _forward_azure_to_client(
        self,
        azure_conn,
        client_ws,
        session: SessionInfo,
        recorder: Optional[ConversationRecorder] = None
    ) -> None:
        """
        Forward events from Azure to client.
        
        Args:
            azure_conn: Azure connection
            client_ws: Client WebSocket
            session: User session
            recorder: Optional conversation recorder
        """
        try:
            logger.info("Starting Azure → Client forwarding for session %s", session.session_id)
            event_count = 0
            
            async for event in azure_conn:
                event_count += 1
                logger.info("📨 Azure Event #%d: %s", event_count, event.type)
                
                # Log ALL event attributes für komplettes Debugging
                event_str = str(event.type)
                if 'FUNCTION' in event_str or 'OUTPUT' in event_str or event_count < 50:
                    # Log alle Attribute des Events
                    attrs = [attr for attr in dir(event) if not attr.startswith('_')]
                    logger.info("   📋 Event Attributes: %s", attrs)
                    for attr in ['name', 'call_id', 'arguments', 'output', 'status', 'item']:
                        if hasattr(event, attr):
                            value = getattr(event, attr)
                            logger.info("      %s: %s", attr, str(value)[:200])
                
                # Transform SDK events to client format
                client_message = self._transform_azure_event(event, recorder)
                
                # Handle special function calls that need backend processing
                if event.type == ServerEventType.RESPONSE_FUNCTION_CALL_ARGUMENTS_DONE:
                    function_name = getattr(event, 'name', '')
                    call_id = getattr(event, 'call_id', '')
                    
                    if function_name == "termine_abrufen":
                        # START WORKFLOW: Initialize appointment booking workflow
                        logger.info("🚀 Backend: Starting appointment workflow")
                        
                        # Create workflow instance and start
                        workflow = create_appointment_workflow()
                        context = workflow.start_workflow()
                        
                        # Store workflow context in session
                        session.workflow_context = context
                        session.workflow_active = True
                        
                        # Legacy: Also store in appointments_cache for backward compatibility
                        session.appointments_cache = {
                            "advisor": context.advisor.dict(),
                            "appointments": [apt.dict() for apt in context.appointments]
                        }
                        
                        # Send success response to Azure
                        await azure_conn.send({
                            "type": "conversation.item.create",
                            "item": {
                                "type": "function_call_output",
                                "call_id": call_id,
                                "output": json.dumps({
                                    "success": True,
                                    "count": len(context.appointments),
                                    "workflow_state": context.state
                                })
                            }
                        })
                        # Trigger response so agent can speak about the found appointments
                        await azure_conn.response.create()
                        logger.info(f"✅ Workflow started: {context.state}, agent can now speak about results")
                        # Don't send to client - this is backend-only
                        continue
                    
                    elif function_name == "termine_anzeigen":
                        # WORKFLOW: Send appointments to UI (HITL Step 1)
                        logger.info("🔧 Backend: Sending appointments to frontend (Workflow HITL)")
                        
                        # Check workflow state
                        if hasattr(session, 'workflow_context') and session.workflow_context:
                            context = session.workflow_context
                            
                            # Validate workflow state
                            if context.state != WorkflowState.AWAITING_SELECTION:
                                logger.warning(f"⚠️ Invalid workflow state for UI display: {context.state}")
                            
                            # Send appointments to frontend
                            client_message = {
                                "type": "function_call",
                                "name": "termine_anzeigen",
                                "arguments": json.dumps({
                                    "advisor": context.advisor.dict(),
                                    "appointments": [apt.dict() for apt in context.appointments],
                                    "workflow_state": context.state
                                }),
                                "call_id": call_id
                            }
                            logger.info(f"✅ Workflow appointments sent to frontend (state: {context.state})")
                            
                            # Send function_call_output back to Azure
                            await azure_conn.send({
                                "type": "conversation.item.create",
                                "item": {
                                    "type": "function_call_output",
                                    "call_id": call_id,
                                    "output": json.dumps({
                                        "ui_shown": True,
                                        "message": "Termine werden dem Kunden angezeigt",
                                        "workflow_state": context.state
                                    })
                                }
                            })
                            # Trigger response so agent can finish speaking
                            await azure_conn.response.create()
                            logger.info("✅ Function output sent to Azure, agent can now finish speaking")
                        else:
                            logger.error("⚠️ No workflow context found - workflow not started")
                    
                    elif function_name == "termin_bestaetigen":
                        # Auto-confirm appointment booking (this is called after user selection)
                        logger.info("🔧 Backend: Auto-confirming appointment booking")
                        arguments_str = getattr(event, 'arguments', '{}')
                        args = json.loads(arguments_str) if arguments_str else {}
                        
                        termin_id = args.get('termin_id')
                        datum = args.get('datum')
                        uhrzeit = args.get('uhrzeit')
                        
                        logger.info(f"   Termin: {datum} um {uhrzeit} (ID: {termin_id})")
                        
                        # Send success response to Azure
                        await azure_conn.send({
                            "type": "conversation.item.create",
                            "item": {
                                "type": "function_call_output",
                                "call_id": call_id,
                                "output": json.dumps({
                                    "success": True,
                                    "message": f"Termin am {datum} um {uhrzeit} Uhr wurde erfolgreich reserviert"
                                })
                            }
                        })
                        # Trigger response so agent can confirm the booking
                        await azure_conn.response.create()
                        logger.info("✅ Appointment confirmed, agent can now speak confirmation")
                        # Don't send to client - this is backend-only
                        continue
                
                if client_message:
                    await self._send_message(client_ws, client_message)
            
            logger.info("Azure event stream ended for session %s (received %d events)", 
                       session.session_id, event_count)
                    
        except Exception as e:
            logger.info("Azure → Client forwarding stopped: %s", e)
    
    def _transform_azure_event(
        self, 
        event, 
        recorder: Optional[ConversationRecorder] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Transform Azure SDK events to client-friendly format.
        
        Args:
            event: Azure SDK event
            recorder: Optional conversation recorder
            
        Returns:
            Client message dict or None
        """
        if event.type == ServerEventType.RESPONSE_AUDIO_DELTA:
            audio_size = len(event.delta) if event.delta else 0
            logger.debug("🔊 Sending audio delta to client (size: %d bytes)", audio_size)
            
            # Record AI audio
            if recorder and event.delta:
                recorder.add_ai_audio(event.delta)
            
            # Convert binary audio to base64 for JSON serialization
            audio_base64 = base64.b64encode(event.delta).decode('utf-8') if event.delta else ""
            
            return {
                "type": "audio.delta",
                "audio": audio_base64
            }
        elif event.type == ServerEventType.RESPONSE_TEXT_DELTA:
            logger.debug("💬 Sending text delta: %s", event.delta[:50] if event.delta else "")
            return {
                "type": "text.delta",
                "text": event.delta
            }
        elif event.type == ServerEventType.SESSION_UPDATED:
            logger.info("✅ Session updated")
            
            # DEBUG: Log raw session object
            logger.info("   🔍 Session object type: %s", type(event.session))
            logger.info("   🔍 Session attributes: %s", [attr for attr in dir(event.session) if not attr.startswith('_')])
            
            # Extract session details including avatar/WebRTC configuration
            # Convert to dict and ensure JSON serializable
            try:
                session_dict = event.session.as_dict() if hasattr(event.session, 'as_dict') else {}
                logger.info("   🔍 Session dict keys: %s", list(session_dict.keys()) if session_dict else "None")
                
                # Extract avatar config manually to ensure JSON serialization
                avatar_config = None
                if hasattr(event.session, 'avatar') and event.session.avatar:
                    avatar = event.session.avatar
                    avatar_dict = avatar.as_dict() if hasattr(avatar, 'as_dict') else {}
                    
                    # Build clean JSON-serializable dict
                    # Convert ICE servers to plain dicts
                    ice_servers = []
                    for server in avatar_dict.get('ice_servers', []):
                        if isinstance(server, dict):
                            ice_servers.append(server)
                        elif hasattr(server, 'as_dict'):
                            ice_servers.append(server.as_dict())
                        elif hasattr(server, '__dict__'):
                            ice_servers.append(server.__dict__)
                        else:
                            ice_servers.append({'urls': str(server)})
                    
                    avatar_config = {
                        'character': avatar_dict.get('character', ''),
                        'style': avatar_dict.get('style', ''),
                        'ice_servers': ice_servers
                    }
                    
                    # Extract username/credential from ICE servers if not at top level
                    # They're usually IN the ice_server objects
                    if ice_servers and len(ice_servers) > 0:
                        first_server = ice_servers[0]
                        if 'username' in first_server:
                            avatar_config['username'] = first_server.get('username', '')
                        if 'credential' in first_server:
                            avatar_config['credential'] = first_server.get('credential', '')
                    
                    logger.info("   📹 Avatar config extracted: character=%s, style=%s, ice_servers=%d", 
                               avatar_config.get('character'),
                               avatar_config.get('style'),
                               len(avatar_config.get('ice_servers', [])))
                
                result = {
                    "type": "session.updated",
                    "session": {
                        "id": event.session.id,
                        "avatar_enabled": self.azure_avatar_enabled and bool(avatar_config),
                        "avatar": avatar_config
                    }
                }
                logger.info("   📤 Sending to client: %s", json.dumps(result, indent=2)[:5000])
                return result
            except Exception as e:
                logger.error("Failed to extract session data: %s", e)
                return {
                    "type": "session.updated",
                    "session": {
                        "id": event.session.id,
                        "avatar_enabled": False  # Kein Avatar im Fehlerfall
                    }
                }
        elif event.type == ServerEventType.ERROR:
            logger.error("❌ Azure error: %s (code: %s)", event.error.message, event.error.code)
            return {
                "type": "error",
                "error": {
                    "message": event.error.message,
                    "code": event.error.code
                }
            }
        elif event.type == ServerEventType.CONVERSATION_ITEM_CREATED:
            logger.debug("📝 Conversation item created")
            return None
        elif event.type == ServerEventType.RESPONSE_CREATED:
            logger.info("🎙️ Response started")
            # Send to client
            return {
                "type": "response.started",
                "timestamp": datetime.now().isoformat()
            }
        elif event.type == ServerEventType.RESPONSE_DONE:
            # Log response details
            status = getattr(event, 'status', 'unknown')
            logger.info("✅ Response completed (status: %s)", status)
            
            # Log if response has output
            if hasattr(event, 'response') and hasattr(event.response, 'output'):
                output_count = len(event.response.output) if event.response.output else 0
                logger.info("   Response output items: %d", output_count)
                
                # Log each output item type
                if event.response.output:
                    for idx, item in enumerate(event.response.output):
                        item_type = getattr(item, 'type', 'unknown')
                        logger.info("   Output #%d: type=%s", idx, item_type)
            
            # Send to client
            return {
                "type": "response.done",
                "timestamp": datetime.now().isoformat()
            }
        elif event.type == ServerEventType.INPUT_AUDIO_BUFFER_SPEECH_STARTED:
            logger.info("🗣️ Speech started (turn detected)")
            if recorder:
                recorder.add_event("user_speech_started")
            # Send to client
            return {
                "type": "speech.started",
                "timestamp": datetime.now().isoformat()
            }
        elif event.type == ServerEventType.INPUT_AUDIO_BUFFER_SPEECH_STOPPED:
            logger.info("🤫 Speech stopped (turn ended)")
            if recorder:
                recorder.add_event("user_speech_stopped")
            # Send to client - THIS is when response timer should start!
            return {
                "type": "speech.stopped",
                "timestamp": datetime.now().isoformat()
            }
        elif event.type == ServerEventType.RESPONSE_AUDIO_TRANSCRIPT_DONE:
            # Send transcript to client - audio playback is complete!
            transcript = getattr(event, 'transcript', '')
            logger.info("📝 Audio transcript done: %s", transcript)
            if recorder:
                recorder.add_event("ai_response", {"transcript": transcript})
            return {
                "type": "response.audio_transcript.done",
                "transcript": transcript
            }
        elif event.type == ServerEventType.RESPONSE_FUNCTION_CALL_ARGUMENTS_DONE:
            # Function Call vom Agent → Frontend senden für UI-Aktion
            function_name = getattr(event, 'name', '')
            arguments_str = getattr(event, 'arguments', '{}')
            call_id = getattr(event, 'call_id', '')
            
            logger.info("🔧 Function Call: %s (call_id: %s)", function_name, call_id)
            logger.info("   Arguments: %s", arguments_str)
            
            if recorder:
                recorder.add_event("function_call", {
                    "name": function_name,
                    "arguments": arguments_str,
                    "call_id": call_id
                })
            
            # Sende Function Call ans Frontend
            return {
                "type": "function_call",
                "name": function_name,
                "arguments": arguments_str,
                "call_id": call_id
            }
        elif event.type == ServerEventType.CONVERSATION_ITEM_INPUT_AUDIO_TRANSCRIPTION_COMPLETED:
            # User's speech was transcribed - send to client for display
            transcript = getattr(event, 'transcript', '')
            logger.info("📝 User transcript: %s", transcript)
            
            if recorder:
                recorder.add_event("user_transcript", {"transcript": transcript})
            
            # Send to client for chat display
            return {
                "type": "user_transcript",
                "text": transcript,
                "timestamp": datetime.now().isoformat()
            }
        elif hasattr(event, 'type') and str(event.type).endswith('session.avatar.connecting'):
            # WebRTC Avatar SDP Answer from Azure
            logger.info("📹 Received WebRTC answer from Azure")
            server_sdp = getattr(event, 'server_sdp', '')
            if server_sdp:
                logger.info("   📤 Sending WebRTC answer to client (SDP length: %d)", len(server_sdp))
                return {
                    "type": "session.avatar.answer",
                    "server_sdp": server_sdp
                }
            else:
                logger.warn("No server_sdp in avatar connecting event!")
                return None
        elif event.type == ServerEventType.RESPONSE_FUNCTION_CALL_ARGUMENTS_DELTA:
            # Function Call in progress
            function_name = getattr(event, 'name', '')
            logger.info("🔧 Function Call Delta: %s", function_name)
            return None
        else:
            # Log ALL events für Debugging
            event_type_str = str(event.type)
            if 'FUNCTION' in event_type_str or 'TOOL' in event_type_str:
                logger.warning("⚠️ Unhandled FUNCTION event: %s", event.type)
            else:
                logger.debug("📥 Unhandled event: %s", event.type)
        
        # Return None for events we don't forward
        return None
    
    async def _handle_onprem_api_request(
        self,
        client_ws,
        session: SessionInfo,
        msg: Dict[str, Any]
    ) -> None:
        """
        Handle On-Prem API call request from client.
        
        Example client message:
        {
            "type": "onprem.api.call",
            "endpoint": "/api/customer/123",
            "method": "GET"
        }
        
        Args:
            client_ws: Client WebSocket
            session: User session (contains Bearer Token)
            msg: Client message with API call details
        """
        try:
            endpoint = msg.get("endpoint")
            method = msg.get("method", "GET")
            payload = msg.get("data")
            
            logger.info(
                "On-Prem API call from user %s: %s %s",
                session.get_user_name(),
                method,
                endpoint
            )
            
            # Call On-Prem API with Bearer Token from session
            result = await self.session_manager.call_onprem_api(
                session_id=session.session_id,
                endpoint=endpoint,
                method=method,
                json=payload
            )
            
            # Send result back to client
            await self._send_message(client_ws, {
                "type": "onprem.api.response",
                "endpoint": endpoint,
                "data": result
            })
            
        except Exception as e:
            logger.error("On-Prem API call failed: %s", e)
            await self._send_message(client_ws, {
                "type": "onprem.api.error",
                "endpoint": msg.get("endpoint"),
                "error": str(e)
            })
    
    async def _handle_function_call_result(
        self,
        azure_conn,
        msg: Dict[str, Any],
        session: SessionInfo
    ) -> None:
        """
        Handle function call result from client and send to Azure.
        
        Example client message:
        {
            "type": "function_call_result",
            "call_id": "call_xxx",
            "result": {"approved": true, "message": "Überweisung bestätigt"}
        }
        
        Args:
            azure_conn: Azure connection
            msg: Client message with function result
            session: User session
        """
        try:
            call_id = msg.get("call_id")
            result = msg.get("result", {})
            
            logger.info(
                "Function call result from user %s: call_id=%s, result=%s",
                session.get_user_name(),
                call_id,
                result
            )
            
            # WORKFLOW: Validierung für Terminauswahl via Workflow Executor
            if result.get("selected"):
                termin_id = result.get("termin_id")
                datum = result.get("datum")
                uhrzeit = result.get("uhrzeit")
                
                logger.info(f"🔍 Workflow validation: Processing selection {termin_id} ({datum} {uhrzeit})")
                
                # Check if workflow is active
                if hasattr(session, 'workflow_context') and session.workflow_context and session.workflow_active:
                    context = session.workflow_context
                    workflow = create_appointment_workflow()
                    
                    # Process selection through workflow validator
                    selection_data = {
                        "termin_id": termin_id,
                        "datum": datum,
                        "uhrzeit": uhrzeit,
                        "selected": True
                    }
                    
                    # Execute workflow validation
                    updated_context = workflow.process_selection(context, selection_data)
                    session.workflow_context = updated_context
                    
                    # Check validation result
                    if updated_context.state == WorkflowState.COMPLETED:
                        # Validation successful, booking confirmed
                        logger.info(f"✅ Workflow validation passed: {updated_context.selection.dict()}")
                        result = {
                            "selected": True,
                            "termin_id": termin_id,
                            "datum": datum,
                            "uhrzeit": uhrzeit,
                            "success": True,
                            "message": f"Termin am {datum} um {uhrzeit} Uhr wurde erfolgreich reserviert",
                            "workflow_state": updated_context.state
                        }
                        session.workflow_active = False  # Workflow complete
                        
                    elif updated_context.state == WorkflowState.AWAITING_SELECTION:
                        # Validation failed - return to selection
                        logger.warning(f"⚠️ Workflow validation failed: {updated_context.error}")
                        result = {
                            "selected": False,
                            "error": updated_context.error or "Ungültiger Termin. Bitte wählen Sie aus der angezeigten Liste.",
                            "message": updated_context.error,
                            "workflow_state": updated_context.state
                        }
                        
                    elif updated_context.state == WorkflowState.FAILED:
                        # Unexpected error
                        logger.error(f"❌ Workflow failed: {updated_context.error}")
                        result = {
                            "selected": False,
                            "error": "Workflow error",
                            "message": updated_context.error,
                            "workflow_state": updated_context.state
                        }
                        session.workflow_active = False
                        
                else:
                    logger.warning("⚠️ No active workflow found - using legacy validation")
                    # LEGACY FALLBACK: Old validation logic if workflow not active
                    if hasattr(session, 'appointments_cache') and session.appointments_cache:
                        appointments = session.appointments_cache.get("appointments", [])
                        
                        # Suche exakte Übereinstimmung: termin_id ODER (datum + uhrzeit)
                        valid_appointment = None
                        
                        if termin_id:
                            # Validiere via termin_id
                            valid_appointment = next(
                                (apt for apt in appointments if apt["id"] == termin_id),
                                None
                            )
                        
                        # Zusätzliche Validierung: Datum + Uhrzeit müssen exakt übereinstimmen
                        if valid_appointment:
                            if datum and uhrzeit:
                                if valid_appointment["datum"] != datum or valid_appointment["uhrzeit"] != uhrzeit:
                                    logger.warning(
                                        "⚠️ Termin ID %s exists, but datum/uhrzeit mismatch: %s %s vs %s %s",
                                        termin_id,
                                        datum, uhrzeit,
                                        valid_appointment["datum"], valid_appointment["uhrzeit"]
                                    )
                                    valid_appointment = None
                        elif datum and uhrzeit:
                            # Fallback: Validiere nur via datum + uhrzeit (falls User verbal gewählt hat)
                            valid_appointment = next(
                                (apt for apt in appointments 
                                 if apt["datum"] == datum and apt["uhrzeit"] == uhrzeit),
                                None
                            )
                        
                        if not valid_appointment:
                            valid_slots = [f"{apt['datum']} um {apt['uhrzeit']}" for apt in appointments]
                            logger.warning(
                                "⚠️ Invalid appointment: termin_id=%s, datum=%s, uhrzeit=%s. Valid slots: %s",
                                termin_id, datum, uhrzeit, valid_slots[:3]
                            )
                            # Sende Error zurück an Agent
                            result = {
                                "selected": False,
                                "error": "Ungültiger Termin. Bitte wählen Sie einen Termin aus der angezeigten Liste.",
                                "message": f"Termin am {datum} um {uhrzeit} ist nicht verfügbar"
                            }
                            logger.info("❌ Appointment validation failed - sending error to agent")
                        else:
                            logger.info(
                                "✅ Appointment validation passed: %s (%s um %s)",
                                valid_appointment["id"],
                                valid_appointment["datum"],
                                valid_appointment["uhrzeit"]
                            )
                    else:
                        logger.warning("⚠️ No appointments cache found for legacy validation")
            
            # Send function call output to Azure
            await azure_conn.send({
                "type": "conversation.item.create",
                "item": {
                    "type": "function_call_output",
                    "call_id": call_id,
                    "output": json.dumps(result)
                }
            })
            
            # Trigger response generation
            await azure_conn.response.create()
            
            logger.info("✅ Function call result sent to Azure, response triggered")
            
        except Exception as e:
            logger.error("Failed to handle function call result: %s", e)
    
    async def _receive_from_client(self, client_ws) -> Optional[Any]:
        """Receive message from client WebSocket."""
        try:
            # This depends on your WebSocket library (Flask-Sock, etc.)
            # Adjust as needed for your framework
            return await asyncio.get_event_loop().run_in_executor(
                None,
                client_ws.receive
            )
        except Exception:
            return None
    
    async def _send_message(self, ws, message: Dict[str, Any]) -> None:
        """Send JSON message to WebSocket."""
        try:
            # Log session.updated messages for debugging
            if message.get('type') == 'session.updated':
                logger.info("   🚀 Actually sending session.updated to client...")
            
            await asyncio.get_event_loop().run_in_executor(
                None,
                ws.send,
                json.dumps(message)
            )
            
            if message.get('type') == 'session.updated':
                logger.info("   ✅ session.updated sent successfully")
                
        except Exception as e:
            # Only log at debug level if connection is closed
            if "closed" in str(e).lower() or "1005" in str(e):
                logger.debug("WebSocket already closed, cannot send message")
            else:
                logger.warning("Failed to send message: %s", e)
                if message.get('type') == 'session.updated':
                    logger.error("   ❌ Failed to send session.updated!")
    
    async def _send_error(self, ws, error_message: str) -> None:
        """Send error message to WebSocket."""
        await self._send_message(ws, {
            "type": "error",
            "error": {"message": error_message}
        })

