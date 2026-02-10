"""
RAG Service for Voice Live Integration

This module provides a synchronous wrapper around the RAG pipeline
for integration with the Azure Voice Live agent as a function tool.
"""

import logging
import os
import sys
from pathlib import Path
from typing import Dict, Any, List, Optional
from dotenv import load_dotenv

# Load environment variables from backend/.env
backend_dir = Path(__file__).parent.parent
env_path = backend_dir / ".env"
load_dotenv(dotenv_path=env_path)

# Add RAG src directory to Python path (append to avoid conflicts with installed packages)
rag_src_path = backend_dir / "RAG" / "src"
if str(rag_src_path) not in sys.path:
    sys.path.append(str(rag_src_path))

# Import RAG modules (these are in backend/RAG/src/)
from blob_storage import BlobStorageManager
from embeddings import EmbeddingManager
from vector_search import VectorSearchManager
from answer_generator import AnswerGenerator

logger = logging.getLogger(__name__)


class RAGService:
    """
    RAG Service for voice agent integration.
    
    Provides a simple interface to query the RAG system with questions
    and retrieve AI-generated answers based on indexed documents.
    """
    
    _instance = None  # Singleton pattern
    
    def __new__(cls):
        """Ensure only one instance exists (singleton)."""
        if cls._instance is None:
            cls._instance = super(RAGService, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance
    
    def __init__(self):
        """Initialize RAG service (only once due to singleton)."""
        if not self._initialized:
            # Ensure environment variables are properly loaded for RAG modules
            # The RAG modules use os.getenv() directly, so we need to set them
            backend_dir = Path(__file__).parent.parent
            env_path = backend_dir / ".env"
            load_dotenv(dotenv_path=env_path, override=True)
            
            self.blob_manager = BlobStorageManager()
            self.embedding_manager = EmbeddingManager()
            self.search_manager = VectorSearchManager()
            self.answer_generator = AnswerGenerator()
            self._initialized = False
            
            # Customize system prompt for voice interaction
            self.answer_generator.system_prompt = """Du bist ein hilfreicher Assistent, der Fragen basierend auf bereitgestellten Dokumenten beantwortet.
Antworte IMMER auf Deutsch, klar und präzise.
Verwende den bereitgestellten Kontext, um Fragen genau zu beantworten.
Wenn der Kontext nicht genügend Informationen enthält, sage dies klar und deutlich.
Halte Antworten kurz und gut strukturiert - denke daran, dass sie gesprochen werden.
Vermeide lange Aufzählungen - fasse sie zusammen wenn möglich."""
    
    def initialize(self) -> bool:
        """
        Initialize all RAG pipeline components.
        
        Returns:
            True if initialization successful, False otherwise
        """
        if self._initialized:
            logger.info("RAG Service already initialized")
            return True
        
        try:
            logger.info("Initializing RAG Service...")
            
            # Initialize Blob Storage
            if not self.blob_manager.initialize():
                logger.error("Failed to initialize blob storage")
                return False
            
            # Initialize Embeddings
            if not self.embedding_manager.initialize():
                logger.error("Failed to initialize embedding model")
                return False
            
            # Initialize Search
            if not self.search_manager.initialize():
                logger.error("Failed to initialize vector search")
                return False
            
            # Initialize Answer Generator
            if not self.answer_generator.initialize():
                logger.error("Failed to initialize answer generator")
                return False
            
            self._initialized = True
            logger.info("✅ RAG Service initialized successfully")
            return True
            
        except Exception as e:
            logger.error(f"Error initializing RAG Service: {e}", exc_info=True)
            return False
    
    def query(
        self,
        question: str,
        top_k: int = 5,
        max_tokens: int = 2000  # Increased for better answer generation
    ) -> Dict[str, Any]:
        """
        Query the RAG system with a question.
        
        Args:
            question: User's question in German
            top_k: Number of documents to retrieve
            max_tokens: Maximum tokens in generated answer
            
        Returns:
            Dict containing:
                - success: bool
                - answer: str (generated answer)
                - sources: List[Dict] (retrieved documents)
                - error: str (if failed)
        """
        if not self._initialized:
            return {
                "success": False,
                "error": "RAG Service nicht initialisiert"
            }
        
        try:
            logger.info(f"📝 RAG Query: {question[:100]}...")
            
            # Generate embedding for question
            query_embedding = self.embedding_manager.generate_embedding(question)
            if query_embedding is None:
                return {
                    "success": False,
                    "error": "Fehler beim Generieren des Embeddings"
                }
            
            # Search for relevant documents
            logger.info(f"🔍 Searching for top {top_k} Chunks...")
            results = self.search_manager.vector_search(query_embedding, top_k=top_k)
            
            if not results:
                return {
                    "success": True,
                    "answer": "Ich konnte leider keine relevanten Informationen in den Dokumenten finden.",
                    "sources": []
                }
            
            logger.info(f"✅ Found {len(results)} relevant Chunks")
            
            # Generate answer
            logger.info("🤖 Generating answer...")
            answer = self.answer_generator.generate_answer(
                question=question,
                context_documents=results,
                max_tokens=max_tokens
            )
            
            if answer is None:
                return {
                    "success": False,
                    "error": "Fehler beim Generieren der Antwort"
                }
            
            logger.info("✅ Answer generated successfully")
            
            return {
                "success": True,
                "answer": answer,
                "sources": [
                    {
                        "source": doc.get("source", "Unknown"),
                        "score": doc.get("score", 0),
                        "content": doc.get("content", "")[:200] + "..."  # Preview only
                    }
                    for doc in results
                ]
            }
            
        except Exception as e:
            logger.error(f"Error in RAG query: {e}", exc_info=True)
            return {
                "success": False,
                "error": f"Fehler bei der Abfrage: {str(e)}"
            }
    
    def get_available_documents(self) -> List[str]:
        """
        Get list of available documents in storage.
        
        Returns:
            List of document names
        """
        if not self._initialized:
            return []
        
        try:
            return self.blob_manager.list_blobs()
        except Exception as e:
            logger.error(f"Error listing documents: {e}")
            return []
    
    def is_initialized(self) -> bool:
        """Check if RAG service is initialized."""
        return self._initialized


# Global RAG service instance
_rag_service_instance = None


def get_rag_service() -> RAGService:
    """
    Get or create the global RAG service instance.
    
    Returns:
        RAGService singleton instance
    """
    global _rag_service_instance
    if _rag_service_instance is None:
        _rag_service_instance = RAGService()
    return _rag_service_instance
