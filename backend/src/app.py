# ---------------------------------------------------------------------------------------------
#  Flask Application with Authenticated Voice Proxy
# ---------------------------------------------------------------------------------------------

"""
Flask app that provides:
1. WebSocket proxy for Azure Voice Live with authentication
2. Bearer Token management (never exposed to client!)
3. On-Prem API integration with user context
"""

import asyncio
import logging
import os
from pathlib import Path

from dotenv import load_dotenv
from flask import Flask, jsonify, request, send_from_directory
from flask_sock import Sock

# Load environment variables from .env file in backend directory
# Since app.py is in backend/src/, we need to go up one level to find .env
backend_dir = Path(__file__).parent.parent
env_path = backend_dir / ".env"
load_dotenv(dotenv_path=env_path)

from auth_session_manager import AuthSessionManager
from voice_proxy_handler import VoiceProxyHandler

# Configure logging
logging.basicConfig(
    level=logging.INFO,  # INFO level (DEBUG ist zu verbose)
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
# Aber für voice_proxy_handler auf DEBUG setzen
logging.getLogger('voice_proxy_handler').setLevel(logging.DEBUG)
logger = logging.getLogger(__name__)

# Initialize Flask
app = Flask(__name__, static_folder="../static", static_url_path="")
sock = Sock(app)

# Configuration from environment
ONPREM_AUTH_URL = os.getenv(
    "ONPREM_AUTH_URL",
    "https://your-onprem-system.com/api/auth/exchange-token"
)
ONPREM_API_BASE_URL = os.getenv(
    "ONPREM_API_BASE_URL",
    "https://your-onprem-system.com/api"
)
AZURE_ENDPOINT = os.getenv(
    "AZURE_VOICE_ENDPOINT",
    "wss://your-resource.cognitiveservices.azure.com/voice-agent/realtime"
)
AZURE_API_KEY = os.getenv("AZURE_OPENAI_API_KEY", "")

# Model Configuration
AZURE_MODEL = os.getenv("AZURE_MODEL", "gpt-realtime")

# Azure AI Foundry Agent Configuration
USE_AZURE_AI_AGENTS = os.getenv("USE_AZURE_AI_AGENTS", "false").lower() == "true"
AZURE_AGENT_ID = os.getenv("AZURE_AGENT_ID", "")  # e.g., "asst_DE5fwnx9zNwMZ1ADT9x7WkpG"
AZURE_AI_PROJECT_NAME = os.getenv("AZURE_AI_PROJECT_NAME", "")  # Required for Foundry Agents

# Recording settings
ENABLE_RECORDING = os.getenv("ENABLE_RECORDING", "true").lower() == "true"
RECORDINGS_DIR = os.getenv("RECORDINGS_DIR", "recordings")

# Voice & Avatar Configuration
AZURE_VOICE_NAME = os.getenv("AZURE_VOICE_NAME", "de-DE-FlorianMultilingualNeural")
AZURE_AVATAR_ENABLED = os.getenv("AZURE_AVATAR_ENABLED", "true").lower() == "true"
AZURE_AVATAR_CHARACTER = os.getenv("AZURE_AVATAR_CHARACTER", "lisa")
AZURE_AVATAR_STYLE = os.getenv("AZURE_AVATAR_STYLE", "casual-sitting")

# Avatar Video Settings (Microsoft-style explicit configuration)
AZURE_AVATAR_VIDEO_WIDTH = int(os.getenv("AZURE_AVATAR_VIDEO_WIDTH", "1280"))
AZURE_AVATAR_VIDEO_HEIGHT = int(os.getenv("AZURE_AVATAR_VIDEO_HEIGHT", "720"))
AZURE_AVATAR_VIDEO_BITRATE = int(os.getenv("AZURE_AVATAR_VIDEO_BITRATE", "2000000"))  # 2 Mbps
AZURE_AVATAR_ICE_URLS = os.getenv("AZURE_AVATAR_ICE_URLS", "")  # Optional: comma-separated STUN/TURN servers

# Initialize managers
session_manager = AuthSessionManager(
    onprem_auth_url=ONPREM_AUTH_URL,
    onprem_api_base_url=ONPREM_API_BASE_URL
)

voice_proxy_handler = VoiceProxyHandler(
    session_manager=session_manager,
    azure_endpoint=AZURE_ENDPOINT,
    azure_api_key=AZURE_API_KEY,
    azure_model=AZURE_MODEL,
    use_azure_ai_agents=USE_AZURE_AI_AGENTS,
    azure_agent_id=AZURE_AGENT_ID,
    azure_ai_project_name=AZURE_AI_PROJECT_NAME,
    enable_recording=ENABLE_RECORDING,
    recordings_dir=RECORDINGS_DIR,
    azure_voice_name=AZURE_VOICE_NAME,
    azure_avatar_enabled=AZURE_AVATAR_ENABLED,
    azure_avatar_character=AZURE_AVATAR_CHARACTER,
    azure_avatar_style=AZURE_AVATAR_STYLE,
    # Microsoft-style explicit video settings
    azure_avatar_video_width=AZURE_AVATAR_VIDEO_WIDTH,
    azure_avatar_video_height=AZURE_AVATAR_VIDEO_HEIGHT,
    azure_avatar_video_bitrate=AZURE_AVATAR_VIDEO_BITRATE,
    azure_avatar_ice_urls=AZURE_AVATAR_ICE_URLS if AZURE_AVATAR_ICE_URLS else None
)

logger.info("🎙️ Voice Proxy initialized (Recording: %s)", "ENABLED" if ENABLE_RECORDING else "DISABLED")

logger.info("Application initialized")
logger.info("On-Prem Auth URL: %s", ONPREM_AUTH_URL)
logger.info("On-Prem API Base: %s", ONPREM_API_BASE_URL)

if USE_AZURE_AI_AGENTS and AZURE_AGENT_ID:
    logger.info("Azure AI Foundry Agent: %s (Project: %s)", AZURE_AGENT_ID, AZURE_AI_PROJECT_NAME)
else:
    logger.info("Azure Model: %s", AZURE_MODEL)

logger.info("🎤 Voice: %s", AZURE_VOICE_NAME)
logger.info("👤 Avatar: %s (%s)", AZURE_AVATAR_CHARACTER, AZURE_AVATAR_STYLE)
logger.info("📹 Video: %dx%d @ %d bps (Microsoft-style)", 
           AZURE_AVATAR_VIDEO_WIDTH, AZURE_AVATAR_VIDEO_HEIGHT, AZURE_AVATAR_VIDEO_BITRATE)
if AZURE_AVATAR_ICE_URLS:
    logger.info("🌐 Custom ICE servers: %s", AZURE_AVATAR_ICE_URLS)


@app.route("/")
def index():
    """Serve the main application page."""
    if app.static_folder:
        return send_from_directory(app.static_folder, "index.html")
    return "Azure Voice Live Demo - Backend Running"


@app.route("/api/health")
def health():
    """Health check endpoint."""
    return jsonify({
        "status": "healthy",
        "service": "azure-voice-live-backend",
        "active_sessions": len(session_manager.sessions)
    })

# ============================================================================
# Mock Endpoints für Development (On-Prem System Simulation)
# ============================================================================

@app.route('/mock-auth/exchange-token', methods=['POST'])
def mock_auth_exchange():
    """
    Mock endpoint für Token exchange in Development.
    Simuliert das On-Prem Authentication System.
    """
    try:
        data = request.get_json()
        one_time_token = data.get('oneTimeToken')
        
        logger.info(f"Mock auth: Exchanging token {one_time_token}")
        
        # Development: Accept any token that starts with 'dev-'
        if one_time_token and one_time_token.startswith('dev-'):
            return jsonify({
                "access_token": "Bearer mock-bearer-token-12345",
                "expires_in": 3600,
                "user_id": "dev-user-123",
                "name": "Anton Happel",
                "email": "anton.happel@example.com",
                "roles": ["customer", "premium"]
            })
        else:
            return jsonify({"error": "Invalid development token"}), 401
            
    except Exception as e:
        logger.error(f"Mock auth error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/mock-api/<path:path>', methods=['GET', 'POST'])
def mock_api(path):
    """Mock On-Prem API endpoints."""
    logger.info(f"Mock API call: {request.method} /{path}")
    return jsonify({
        "status": "success",
        "endpoint": path,
        "method": request.method,
        "message": "Mock API response"
    })


@app.route("/api/config")
def get_config():
    """
    Get client configuration.
    
    Returns basic config WITHOUT sensitive data like API keys.
    """
    return jsonify({
        "ws_endpoint": "/ws/voice",
        "auth_required": True,
        "auth_flow": "oneTimeToken"
    })


@sock.route("/ws/voice")
def voice_websocket(ws):
    """
    WebSocket endpoint for authenticated voice proxy.
    
    Expected flow:
    1. Client connects
    2. Client sends: {"type": "auth.init", "oneTimeToken": "xxx"}
    3. Backend exchanges token for Bearer Token (stays in backend!)
    4. Backend connects to Azure Voice Live
    5. Bidirectional message forwarding begins
    """
    logger.info("New WebSocket connection")
    
    try:
        # Get or create event loop
        try:
            loop = asyncio.get_event_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
        
        # Handle connection asynchronously
        loop.run_until_complete(voice_proxy_handler.handle_connection(ws))
        
    except Exception as e:
        logger.error("WebSocket error: %s", e)
    finally:
        logger.info("WebSocket connection closed")


@app.route("/api/sessions/cleanup", methods=["POST"])
def cleanup_sessions():
    """
    Manually trigger session cleanup (remove expired sessions).
    
    In production, this should run automatically via background task.
    """
    try:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        loop.run_until_complete(session_manager.cleanup_expired_sessions())
        loop.close()
        
        return jsonify({
            "status": "success",
            "active_sessions": len(session_manager.sessions)
        })
    except Exception as e:
        logger.error("Cleanup error: %s", e)
        return jsonify({"error": str(e)}), 500


@app.route("/api/sessions/stats")
def session_stats():
    """Get statistics about active sessions."""
    sessions = session_manager.sessions
    
    stats = {
        "total_sessions": len(sessions),
        "sessions": [
            {
                "session_id": session.session_id,
                "user_name": session.get_user_name(),
                "user_id": session.get_user_id(),
                "created_at": session.created_at.isoformat(),
                "expires_at": session.expires_at.isoformat(),
            }
            for session in sessions.values()
        ]
    }
    
    return jsonify(stats)


@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors."""
    return jsonify({"error": "Not found"}), 404


@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors."""
    logger.error("Internal error: %s", error)
    return jsonify({"error": "Internal server error"}), 500


def main():
    """Run the Flask application."""
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 5000))
    debug = os.getenv("FLASK_ENV") == "development"
    
    logger.info("=" * 60)
    logger.info("Azure Voice Live Backend with Authentication")
    logger.info("=" * 60)
    logger.info("Server: http://%s:%s", host, port)
    logger.info("WebSocket: ws://%s:%s/ws/voice", host, port)
    logger.info("Health: http://%s:%s/api/health", host, port)
    logger.info("=" * 60)
    
    app.run(host=host, port=port, debug=debug)


if __name__ == "__main__":
    main()

