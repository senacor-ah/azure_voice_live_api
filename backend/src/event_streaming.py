# ---------------------------------------------------------------------------------------------
#  Event Streaming Service - Azure Web PubSub Integration
# ---------------------------------------------------------------------------------------------

"""
Real-time event streaming service that publishes events to Azure Web PubSub.
This allows external clients to subscribe to conversation events in real-time.
"""

import asyncio
import json
import logging
import os
from datetime import datetime
from typing import Any, Dict, List, Optional

from azure.messaging.webpubsubservice import WebPubSubServiceClient

logger = logging.getLogger(__name__)


class EventStreamingService:
    """
    Service for streaming events to Azure Web PubSub.
    
    Events are published to a hub where external clients can subscribe
    to receive real-time updates about sessions, conversations, and user activities.
    """
    
    def __init__(
        self,
        connection_string: Optional[str] = None,
        hub_name: Optional[str] = None
    ):
        """
        Initialize the event streaming service.
        
        Args:
            connection_string: Azure Web PubSub connection string (from env if not provided)
            hub_name: Hub name for events (from env if not provided)
        """
        self.connection_string = connection_string or os.getenv("AZURE_WEBPUBSUB_CONNECTION_STRING")
        self.hub_name = hub_name or os.getenv("AZURE_WEBPUBSUB_HUB_NAME", "conversation_events")
        
        self.enabled = bool(self.connection_string)
        
        if self.enabled:
            try:
                self.client = WebPubSubServiceClient.from_connection_string(
                    connection_string=self.connection_string,
                    hub=self.hub_name
                )
                logger.info("✅ Event Streaming Service initialized (Hub: %s)", self.hub_name)
            except Exception as e:
                logger.error("❌ Failed to initialize Web PubSub client: %s", e)
                self.enabled = False
                self.client = None
        else:
            logger.warning("⚠️ Event Streaming Service disabled (no connection string)")
            self.client = None
    
    def publish_event(
        self,
        event_type: str,
        data: Dict[str, Any],
        user_id: Optional[str] = None
    ) -> None:
        """
        Publish an event to Web PubSub (synchronous wrapper).
        
        Args:
            event_type: Type of event (e.g., "session.started", "session.ended")
            data: Event data dictionary
            user_id: Optional user ID to filter events to specific users
        """
        if not self.enabled:
            return
        
        try:
            # Create event message
            event_message = {
                "type": event_type,
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "data": data
            }
            
            # Publish to all subscribers
            self.client.send_to_all(
                message=json.dumps(event_message),
                content_type="application/json"
            )
            
            logger.debug("📡 Event published: %s", event_type)
            
        except Exception as e:
            logger.error("❌ Failed to publish event %s: %s", event_type, e)
    
    async def publish_event_async(
        self,
        event_type: str,
        data: Dict[str, Any],
        user_id: Optional[str] = None
    ) -> None:
        """
        Publish an event to Web PubSub asynchronously.
        
        Args:
            event_type: Type of event (e.g., "session.started", "session.ended")
            data: Event data dictionary
            user_id: Optional user ID to filter events to specific users
        """
        if not self.enabled:
            return
        
        # Run synchronous publish in executor to avoid blocking
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, self.publish_event, event_type, data, user_id)
    
    def publish_session_started(
        self,
        session_id: str,
        user_name: str,
        user_id: Optional[str] = None
    ) -> None:
        """
        Publish a session started event.
        
        Args:
            session_id: Unique session identifier
            user_name: User's display name
            user_id: User's unique ID
        """
        self.publish_event(
            event_type="session.started",
            data={
                "session_id": session_id,
                "user_name": user_name,
                "user_id": user_id
            },
            user_id=user_id
        )
    
    async def publish_session_started_async(
        self,
        session_id: str,
        user_name: str,
        user_id: Optional[str] = None
    ) -> None:
        """
        Publish a session started event asynchronously.
        
        Args:
            session_id: Unique session identifier
            user_name: User's display name
            user_id: User's unique ID
        """
        await self.publish_event_async(
            event_type="session.started",
            data={
                "session_id": session_id,
                "user_name": user_name,
                "user_id": user_id
            },
            user_id=user_id
        )
    
    def publish_session_ended(
        self,
        session_id: str,
        user_name: str,
        user_id: Optional[str] = None,
        duration_seconds: Optional[float] = None
    ) -> None:
        """
        Publish a session ended event.
        
        Args:
            session_id: Unique session identifier
            user_name: User's display name
            user_id: User's unique ID
            duration_seconds: Session duration in seconds
        """
        event_data = {
            "session_id": session_id,
            "user_name": user_name,
            "user_id": user_id
        }
        
        if duration_seconds is not None:
            event_data["duration_seconds"] = duration_seconds
        
        self.publish_event(
            event_type="session.ended",
            data=event_data,
            user_id=user_id
        )
    
    async def publish_session_ended_async(
        self,
        session_id: str,
        user_name: str,
        user_id: Optional[str] = None,
        duration_seconds: Optional[float] = None
    ) -> None:
        """
        Publish a session ended event asynchronously.
        
        Args:
            session_id: Unique session identifier
            user_name: User's display name
            user_id: User's unique ID
            duration_seconds: Session duration in seconds
        """
        event_data = {
            "session_id": session_id,
            "user_name": user_name,
            "user_id": user_id
        }
        
        if duration_seconds is not None:
            event_data["duration_seconds"] = duration_seconds
        
        await self.publish_event_async(
            event_type="session.ended",
            data=event_data,
            user_id=user_id
        )
    
    async def publish_session_updated_async(
        self,
        session_id: str,
        user_id: Optional[str] = None,
        config: Optional[Dict[str, Any]] = None
    ) -> None:
        """
        Publish a session updated event asynchronously.
        
        Args:
            session_id: Unique session identifier
            user_id: User's unique ID
            config: Session configuration details
        """
        event_data = {
            "session_id": session_id,
            "user_id": user_id
        }
        
        if config:
            event_data["config"] = config
        
        await self.publish_event_async(
            event_type="session.updated",
            data=event_data,
            user_id=user_id
        )
    
    async def publish_speech_started_async(
        self,
        session_id: str,
        user_id: Optional[str] = None
    ) -> None:
        """
        Publish a speech started event asynchronously.
        
        Args:
            session_id: Unique session identifier
            user_id: User's unique ID
        """
        await self.publish_event_async(
            event_type="input_audio_buffer.speech_started",
            data={
                "session_id": session_id,
                "user_id": user_id
            },
            user_id=user_id
        )
    
    async def publish_speech_stopped_async(
        self,
        session_id: str,
        user_id: Optional[str] = None
    ) -> None:
        """
        Publish a speech stopped event asynchronously.
        
        Args:
            session_id: Unique session identifier
            user_id: User's unique ID
        """
        await self.publish_event_async(
            event_type="input_audio_buffer.speech_stopped",
            data={
                "session_id": session_id,
                "user_id": user_id
            },
            user_id=user_id
        )
    
    async def publish_user_transcript_async(
        self,
        session_id: str,
        transcript: str,
        user_id: Optional[str] = None
    ) -> None:
        """
        Publish a user transcription completed event asynchronously.
        
        Args:
            session_id: Unique session identifier
            transcript: The transcribed text
            user_id: User's unique ID
        """
        await self.publish_event_async(
            event_type="conversation.item.input_audio_transcription.completed",
            data={
                "session_id": session_id,
                "transcript": transcript,
                "user_id": user_id
            },
            user_id=user_id
        )
    
    async def publish_ai_transcript_async(
        self,
        session_id: str,
        transcript: str,
        user_id: Optional[str] = None
    ) -> None:
        """
        Publish an AI audio transcript done event asynchronously.
        
        Args:
            session_id: Unique session identifier
            transcript: The AI's transcribed response
            user_id: User's unique ID
        """
        await self.publish_event_async(
            event_type="response.audio_transcript.done",
            data={
                "session_id": session_id,
                "transcript": transcript,
                "user_id": user_id
            },
            user_id=user_id
        )
    
    async def publish_response_created_async(
        self,
        session_id: str,
        response_id: Optional[str] = None,
        user_id: Optional[str] = None
    ) -> None:
        """
        Publish a response created event asynchronously.
        
        Args:
            session_id: Unique session identifier
            response_id: The response identifier
            user_id: User's unique ID
        """
        event_data = {
            "session_id": session_id,
            "user_id": user_id
        }
        
        if response_id:
            event_data["response_id"] = response_id
        
        await self.publish_event_async(
            event_type="response.created",
            data=event_data,
            user_id=user_id
        )
    
    async def publish_response_done_async(
        self,
        session_id: str,
        response_id: Optional[str] = None,
        status: Optional[str] = None,
        user_id: Optional[str] = None
    ) -> None:
        """
        Publish a response done event asynchronously.
        
        Args:
            session_id: Unique session identifier
            response_id: The response identifier
            status: Response status
            user_id: User's unique ID
        """
        event_data = {
            "session_id": session_id,
            "user_id": user_id
        }
        
        if response_id:
            event_data["response_id"] = response_id
        if status:
            event_data["status"] = status
        
        await self.publish_event_async(
            event_type="response.done",
            data=event_data,
            user_id=user_id
        )
    
    async def publish_authentication_succeeded_async(
        self,
        session_id: str,
        user_name: str,
        user_id: Optional[str] = None,
        successful: str = "successful"
    ) -> None:
        """
        Publish an authentication succeeded event asynchronously.
        
        Args:
            session_id: Unique session identifier
            user_name: User's display name
            user_id: User's unique ID
            successful: Success status string
        """
        event_data = {
            "session_id": session_id,
            "user_name": user_name,
            "user_id": user_id,
            "successful": successful
        }
        
        await self.publish_event_async(
            event_type="authentication_succeeded",
            data=event_data,
            user_id=user_id
        )
    
    async def publish_agent_invoked_async(
        self,
        session_id: str,
        user_id: Optional[str] = None,
        agent_config: Optional[Dict[str, Any]] = None
    ) -> None:
        """
        Publish an agent invoked event asynchronously.
        
        Args:
            session_id: Unique session identifier
            user_id: User's unique ID
            agent_config: Agent configuration details
        """
        event_data = {
            "session_id": session_id,
            "user_id": user_id
        }
        
        if agent_config:
            event_data["agent_config"] = agent_config
        
        await self.publish_event_async(
            event_type="agent_invoked",
            data=event_data,
            user_id=user_id
        )
    
    async def publish_function_called_async(
        self,
        session_id: str,
        function_name: str,
        function_arguments: Optional[Dict[str, Any]] = None,
        function_output: Optional[Any] = None,
        call_id: Optional[str] = None,
        user_id: Optional[str] = None
    ) -> None:
        """
        Publish a function called event asynchronously.
        
        Args:
            session_id: Unique session identifier
            function_name: Name of the function called
            function_arguments: Arguments passed to the function
            function_output: Output returned by the function
            call_id: Function call identifier
            user_id: User's unique ID
        """
        event_data = {
            "session_id": session_id,
            "user_id": user_id,
            "function_name": function_name
        }
        
        if call_id:
            event_data["call_id"] = call_id
        if function_arguments:
            event_data["function_arguments"] = function_arguments
        if function_output is not None:
            event_data["function_output"] = function_output
        
        await self.publish_event_async(
            event_type="function_called",
            data=event_data,
            user_id=user_id
        )
    
    async def publish_transfer_confirmed_async(
        self,
        session_id: str,
        transfer_details: Dict[str, Any],
        confirmed: str = "confirmed",
        user_id: Optional[str] = None
    ) -> None:
        """
        Publish a money transfer confirmed event asynchronously.
        
        Args:
            session_id: Unique session identifier
            transfer_details: Transfer details (recipient, iban, amount, etc.)
            confirmed: Confirmation status string
            user_id: User's unique ID
        """
        event_data = {
            "session_id": session_id,
            "user_id": user_id,
            "confirmed": confirmed,
            "transfer_details": transfer_details
        }
        
        await self.publish_event_async(
            event_type="transfer_confirmed",
            data=event_data,
            user_id=user_id
        )
    
    async def publish_rag_embedding_completed_async(
        self,
        session_id: str,
        question: str,
        embedding_time_ms: float,
        user_id: Optional[str] = None
    ) -> None:
        """
        Publish a RAG embedding completed event asynchronously.
        
        Args:
            session_id: Unique session identifier
            question: The question being embedded
            embedding_time_ms: Time taken for embedding in milliseconds
            user_id: User's unique ID
        """
        event_data = {
            "session_id": session_id,
            "user_id": user_id,
            "question": question,
            "embedding_time_ms": embedding_time_ms
        }
        
        await self.publish_event_async(
            event_type="rag_embedding_completed",
            data=event_data,
            user_id=user_id
        )
    
    async def publish_rag_vector_search_completed_async(
        self,
        session_id: str,
        search_time_ms: float,
        top_chunks: List[Dict[str, Any]],
        user_id: Optional[str] = None
    ) -> None:
        """
        Publish a RAG vector search completed event asynchronously.
        
        Args:
            session_id: Unique session identifier
            search_time_ms: Time taken for vector search in milliseconds
            top_chunks: Top 5 chunks retrieved from search
            user_id: User's unique ID
        """
        event_data = {
            "session_id": session_id,
            "user_id": user_id,
            "search_time_ms": search_time_ms,
            "top_chunks": top_chunks[:5]  # Limit to top 5
        }
        
        await self.publish_event_async(
            event_type="rag_vector_search_completed",
            data=event_data,
            user_id=user_id
        )
    
    async def publish_rag_llm_generation_completed_async(
        self,
        session_id: str,
        first_token_time_ms: float,
        total_completion_time_ms: float,
        answer_length: int,
        user_id: Optional[str] = None
    ) -> None:
        """
        Publish a RAG LLM generation completed event asynchronously.
        
        Args:
            session_id: Unique session identifier
            first_token_time_ms: Time to first token in milliseconds
            total_completion_time_ms: Total completion time in milliseconds
            answer_length: Length of generated answer
            user_id: User's unique ID
        """
        event_data = {
            "session_id": session_id,
            "user_id": user_id,
            "first_token_time_ms": first_token_time_ms,
            "total_completion_time_ms": total_completion_time_ms,
            "answer_length": answer_length
        }
        
        await self.publish_event_async(
            event_type="rag_llm_generation_completed",
            data=event_data,
            user_id=user_id
        )
    
    def close(self) -> None:
        """Close the Web PubSub client and cleanup resources."""
        if self.client:
            try:
                self.client.close()
                logger.info("✅ Event Streaming Service closed")
            except Exception as e:
                logger.error("❌ Error closing Event Streaming Service: %s", e)


# Global singleton instance
_event_streaming_service: Optional[EventStreamingService] = None


def get_event_streaming_service() -> EventStreamingService:
    """
    Get the global event streaming service instance.
    
    Returns:
        EventStreamingService singleton
    """
    global _event_streaming_service
    
    if _event_streaming_service is None:
        _event_streaming_service = EventStreamingService()
    
    return _event_streaming_service


def initialize_event_streaming(
    connection_string: Optional[str] = None,
    hub_name: Optional[str] = None
) -> EventStreamingService:
    """
    Initialize the global event streaming service.
    
    Args:
        connection_string: Azure Web PubSub connection string
        hub_name: Hub name for events
        
    Returns:
        Initialized EventStreamingService
    """
    global _event_streaming_service
    
    _event_streaming_service = EventStreamingService(
        connection_string=connection_string,
        hub_name=hub_name
    )
    
    return _event_streaming_service
