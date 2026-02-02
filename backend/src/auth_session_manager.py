# ---------------------------------------------------------------------------------------------
#  Auth Session Manager - Handles oneTimeToken → Bearer Token flow
# ---------------------------------------------------------------------------------------------

"""
Manages user sessions with Bearer tokens from On-Prem authentication.
"""

import logging
import uuid
from datetime import datetime, timedelta
from typing import Dict, Optional, Any
import httpx

logger = logging.getLogger(__name__)


class SessionInfo:
    """Stores session information including Bearer token and user context."""
    
    def __init__(
        self,
        session_id: str,
        bearer_token: str,
        user_context: Dict[str, Any],
        expires_at: datetime
    ):
        self.session_id = session_id
        self.bearer_token = bearer_token
        self.user_context = user_context
        self.expires_at = expires_at
        self.created_at = datetime.now()
        self.azure_connection = None  # Wird später gesetzt
        self.appointments_cache = None  # Cache for generated appointments
        
        # Workflow state management
        self.workflow_context = None  # WorkflowContext from appointment_workflow.py
        self.workflow_active = False  # Flag to track active workflow
        
    def is_expired(self) -> bool:
        """Check if session is expired."""
        return datetime.now() > self.expires_at
    
    def get_user_id(self) -> str:
        """Get user ID from context."""
        return self.user_context.get('user_id', 'unknown')
    
    def get_user_name(self) -> str:
        """Get user name from context."""
        return self.user_context.get('name', 'Unknown User')


class AuthSessionManager:
    """
    Manages authenticated sessions with Bearer tokens.
    
    Flow:
    1. Client sends oneTimeToken
    2. Exchange with On-Prem system for Bearer Token
    3. Store Bearer Token in session (never sent to client!)
    4. Use Bearer Token for On-Prem API calls
    """
    
    def __init__(self, onprem_auth_url: str, onprem_api_base_url: str):
        """
        Initialize the session manager.
        
        Args:
            onprem_auth_url: URL for token exchange (On-Prem)
            onprem_api_base_url: Base URL for On-Prem business APIs
        """
        self.onprem_auth_url = onprem_auth_url
        self.onprem_api_base_url = onprem_api_base_url
        self.sessions: Dict[str, SessionInfo] = {}
        self.http_client = httpx.AsyncClient(timeout=30.0)
        
    async def create_session_from_one_time_token(
        self,
        one_time_token: str
    ) -> SessionInfo:
        """
        Exchange oneTimeToken for Bearer Token and create session.
        
        Args:
            one_time_token: One-time token from client
            
        Returns:
            SessionInfo with Bearer token and user context
            
        Raises:
            ValueError: If token exchange fails
        """
        logger.info("Exchanging oneTimeToken for Bearer token...")
        
        try:
            # 1. Token Exchange mit On-Prem System
            bearer_token, user_context, expires_in = await self._exchange_token(
                one_time_token
            )
            
            # 2. Session erstellen
            session_id = self._generate_session_id()
            expires_at = datetime.now() + timedelta(seconds=expires_in)
            
            session = SessionInfo(
                session_id=session_id,
                bearer_token=bearer_token,
                user_context=user_context,
                expires_at=expires_at
            )
            
            # 3. Session speichern (Bearer Token bleibt im Backend!)
            self.sessions[session_id] = session
            
            logger.info(
                "Session created for user %s (expires in %d seconds)",
                session.get_user_name(),
                expires_in
            )
            
            return session
            
        except Exception as e:
            logger.error("Token exchange failed: %s", e)
            raise ValueError(f"Authentication failed: {str(e)}")
    
    async def _exchange_token(
        self,
        one_time_token: str
    ) -> tuple[str, Dict[str, Any], int]:
        """
        Exchange oneTimeToken with On-Prem system.
        
        Args:
            one_time_token: One-time token from client
            
        Returns:
            Tuple of (bearer_token, user_context, expires_in_seconds)
        """
        # 🔧 Development: Dummy Session für Test-Token
        if one_time_token == "123456_TOK":
            logger.info("🔧 Development Mode: Using dummy session for token 123456_TOK")
            return self._create_dummy_session_data()
        
        try:
            # Call On-Prem Token Exchange Endpoint
            response = await self.http_client.post(
                self.onprem_auth_url,
                json={"oneTimeToken": one_time_token},
                headers={"Content-Type": "application/json"}
            )
            
            response.raise_for_status()
            data = response.json()
            
            # Extract Bearer Token und User Context
            bearer_token = data.get('access_token')
            expires_in = data.get('expires_in', 3600)  # Default 1 hour
            
            # User Context aus Token Response
            user_context = {
                'user_id': data.get('user_id'),
                'name': data.get('name'),
                'email': data.get('email'),
                'roles': data.get('roles', []),
                'tenant_id': data.get('tenant_id'),
                # Weitere User-spezifische Daten
            }
            
            if not bearer_token:
                raise ValueError("No access_token in response")
            
            return bearer_token, user_context, expires_in
            
        except httpx.HTTPStatusError as e:
            logger.error("Token exchange HTTP error: %s", e.response.text)
            raise ValueError(f"Token exchange failed: {e.response.status_code}")
        except Exception as e:
            logger.error("Token exchange error: %s", e)
            raise
    
    async def call_onprem_api(
        self,
        session_id: str,
        endpoint: str,
        method: str = "GET",
        **kwargs
    ) -> Dict[str, Any]:
        """
        Call On-Prem API with Bearer Token from session.
        
        Args:
            session_id: Session ID
            endpoint: API endpoint (relative to base URL)
            method: HTTP method
            **kwargs: Additional parameters for httpx request
            
        Returns:
            API response as dict
        """
        session = self.get_session(session_id)
        if not session:
            raise ValueError("Invalid or expired session")
        
        # Bearer Token aus Session verwenden
        headers = kwargs.pop('headers', {})
        headers['Authorization'] = f'Bearer {session.bearer_token}'
        
        url = f"{self.onprem_api_base_url}/{endpoint.lstrip('/')}"
        
        logger.info(
            "Calling On-Prem API: %s %s (user: %s)",
            method,
            endpoint,
            session.get_user_name()
        )
        
        try:
            response = await self.http_client.request(
                method=method,
                url=url,
                headers=headers,
                **kwargs
            )
            response.raise_for_status()
            return response.json()
            
        except httpx.HTTPStatusError as e:
            logger.error("On-Prem API error: %s - %s", e.response.status_code, e.response.text)
            raise
    
    def get_session(self, session_id: str) -> Optional[SessionInfo]:
        """
        Get session by ID and validate expiration.
        
        Args:
            session_id: Session identifier
            
        Returns:
            SessionInfo or None if expired/not found
        """
        session = self.sessions.get(session_id)
        
        if not session:
            return None
        
        if session.is_expired():
            logger.warning("Session expired: %s", session_id)
            self.delete_session(session_id)
            return None
        
        return session
    
    def delete_session(self, session_id: str) -> None:
        """
        Delete a session and cleanup resources.
        
        Args:
            session_id: Session identifier
        """
        if session_id in self.sessions:
            session = self.sessions[session_id]
            logger.info(
                "Deleting session for user %s",
                session.get_user_name()
            )
            del self.sessions[session_id]
    
    def _generate_session_id(self) -> str:
        """Generate unique session ID."""
        return f"session-{uuid.uuid4().hex}"
    
    def _create_dummy_session_data(self) -> tuple[str, Dict[str, Any], int]:
        """
        Create dummy session data for development/testing.
        
        Returns:
            Tuple of (bearer_token, user_context, expires_in_seconds)
        """
        bearer_token = "dummy-bearer-token-dev-123456"
        
        user_context = {
            'user_id': 'usr_42',
            'name': 'Anton Happel',
            'email': 'anton.happel@example.com',
            'roles': ['admin', 'user', 'voice_user'],
            'tenant_id': 'tenant_acme_corp',
            'department': 'IT Development',
            'phone': '+49 123 456789',
            'location': 'München, Deutschland',
            'employee_id': 'EMP-2024-001',
            'permissions': [
                'voice.access',
                'api.read',
                'api.write',
                'customer.view',
                'orders.manage'
            ]
        }
        
        expires_in = 7200  # 2 hours
        
        logger.info("✅ Created dummy session for: %s (%s)", 
                   user_context['name'], 
                   user_context['email'])
        
        return bearer_token, user_context, expires_in
    
    async def cleanup_expired_sessions(self) -> None:
        """Remove all expired sessions (call periodically)."""
        expired = [
            sid for sid, session in self.sessions.items()
            if session.is_expired()
        ]
        
        for sid in expired:
            self.delete_session(sid)
        
        if expired:
            logger.info("Cleaned up %d expired sessions", len(expired))
    
    async def close(self) -> None:
        """Close HTTP client."""
        await self.http_client.aclose()

