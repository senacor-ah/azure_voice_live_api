import os
import sys
import uuid
import time
import logging
from dotenv import load_dotenv

# Add src directory to path
sys.path.insert(0, os.path.dirname(__file__))

logger = logging.getLogger(__name__)

from blob_storage import BlobStorageManager
from embeddings import EmbeddingManager
from vector_search import VectorSearchManager
from answer_generator import AnswerGenerator

load_dotenv()

# Try importing PyPDF2 for PDF processing
try:
    from PyPDF2 import PdfReader
    HAS_PYPDF = True
except ImportError:
    HAS_PYPDF = False


class RAGPipeline:
    def __init__(self):
        self.blob_manager = BlobStorageManager()
        self.embedding_manager = EmbeddingManager()
        self.search_manager = VectorSearchManager()
        self.answer_generator = AnswerGenerator()
        self.initialized = False

    def initialize(self):
        """Initialize all components of the RAG pipeline."""
        pipeline_start = time.time()
        logger.info("=" * 50)
        logger.info("Initializing RAG Pipeline...")
        logger.info("=" * 50)
        
        # Initialize Blob Storage
        logger.info("1. Initializing Blob Storage...")
        start = time.time()
        if not self.blob_manager.initialize():
            logger.error("Failed to initialize blob storage.")
            return False
        logger.info(f"[TIMING] Blob Storage initialized in {time.time() - start:.2f}s")
        
        # Initialize Embeddings
        logger.info("2. Initializing Embedding Model...")
        start = time.time()
        if not self.embedding_manager.initialize():
            logger.error("Failed to initialize embedding model.")
            return False
        logger.info(f"[TIMING] Embedding Model initialized in {time.time() - start:.2f}s")
        
        # Initialize Search
        logger.info("3. Initializing Vector Search...")
        start = time.time()
        if not self.search_manager.initialize():
            logger.error("Failed to initialize search.")
            return False
        logger.info(f"[TIMING] Vector Search initialized in {time.time() - start:.2f}s")
        
        # Initialize Answer Generator
        logger.info("4. Initializing Answer Generator...")
        start = time.time()
        if not self.answer_generator.initialize():
            logger.error("Failed to initialize answer generator.")
            return False
        logger.info(f"[TIMING] Answer Generator initialized in {time.time() - start:.2f}s")
        
        self.initialized = True
        total_time = time.time() - pipeline_start
        logger.info("=" * 50)
        logger.info(f"RAG Pipeline initialized successfully in {total_time:.2f}s!")
        logger.info("=" * 50)
        return True

    def upload_document(self, file_path, blob_name=None):
        """Upload a document to blob storage."""
        if not self.initialized:
            logger.error("Pipeline not initialized. Call initialize() first.")
            return False
        
        if blob_name is None:
            blob_name = os.path.basename(file_path)
        
        return self.blob_manager.upload_blob(file_path, blob_name)

    def query(self, question, top_k=5):
        """Query the RAG pipeline."""
        if not self.initialized:
            logger.error("Pipeline not initialized. Call initialize() first.")
            return []
        
        start_time = time.time()
        # Generate embedding for query
        query_embedding = self.embedding_manager.generate_embedding(question)
        if query_embedding is None:
            logger.error("Failed to generate embedding for query.")
            return []
        
        # Perform hybrid search
        results = self.search_manager.hybrid_search(question, query_embedding, top_k=top_k)
        total_time = time.time() - start_time
        logger.info(f"[TIMING] Full query operation completed in {total_time:.2f}s")
        return results

    def vector_query(self, question, top_k=5):
        """Pure vector search without text query."""
        if not self.initialized:
            logger.error("Pipeline not initialized. Call initialize() first.")
            return []
        
        start_time = time.time()
        query_embedding = self.embedding_manager.generate_embedding(question)
        if query_embedding is None:
            logger.error("Failed to generate embedding for query.")
            return []
        
        results = self.search_manager.vector_search(query_embedding, top_k=top_k)
        total_time = time.time() - start_time
        logger.info(f"[TIMING] Vector-only query completed in {total_time:.2f}s")
        return results

    def list_documents(self):
        """List all documents in blob storage."""
        if not self.initialized:
            logger.error("Pipeline not initialized. Call initialize() first.")
            return []
        
        return self.blob_manager.list_blobs()

    def index_pdf(self, pdf_path, chunk_size=500):
        """Extract text from PDF, create embeddings, and index documents."""
        if not self.initialized:
            logger.error("Pipeline not initialized. Call initialize() first.")
            return False
        
        if not HAS_PYPDF:
            logger.error("PyPDF2 not installed. Install with: pip install PyPDF2")
            return False
        
        overall_start = time.time()
        try:
            # Extract text from PDF
            logger.info(f"Extracting text from {pdf_path}...")
            start = time.time()
            reader = PdfReader(pdf_path)
            full_text = ""
            for page in reader.pages:
                full_text += page.extract_text()
            extract_time = time.time() - start
            logger.info(f"[TIMING] PDF text extraction completed in {extract_time:.2f}s")
            
            if not full_text:
                logger.error("No text extracted from PDF.")
                return False
            
            # Split text into chunks
            start = time.time()
            chunks = self._chunk_text(full_text, chunk_size)
            chunk_time = time.time() - start
            logger.info(f"[TIMING] Text chunking completed in {chunk_time:.2f}s ({len(chunks)} chunks created)")
            
            # Generate embeddings for chunks
            logger.info("Generating embeddings...")
            start = time.time()
            embeddings = self.embedding_manager.batch_generate_embeddings(chunks)
            embedding_time = time.time() - start
            if not embeddings:
                logger.error("Failed to generate embeddings.")
                return False
            
            # Prepare documents for indexing
            start = time.time()
            documents = []
            pdf_name = os.path.basename(pdf_path)
            for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
                doc = {
                    "id": str(uuid.uuid4()),
                    "content": chunk,
                    "source": pdf_name,
                    "title": f"{pdf_name} - Part {i+1}",
                    "embedding": embedding
                }
                documents.append(doc)
            prep_time = time.time() - start
            logger.info(f"[TIMING] Document preparation completed in {prep_time:.2f}s")
            
            # Upload to search index
            logger.info("Uploading documents to search index...")
            start = time.time()
            if self.search_manager.upload_documents(documents):
                index_time = time.time() - start
                total_time = time.time() - overall_start
                logger.info(f"[TIMING] Total PDF indexing completed in {total_time:.2f}s")
                logger.info(f"  - Extraction: {extract_time:.2f}s")
                logger.info(f"  - Chunking: {chunk_time:.2f}s")
                logger.info(f"  - Embedding: {embedding_time:.2f}s")
                logger.info(f"  - Indexing: {index_time:.2f}s")
                return True
            else:
                logger.error("Failed to upload documents to index.")
                return False
            
        except Exception as e:
            logger.error(f"Error indexing PDF: {e}")
            return False

    def _chunk_text(self, text, chunk_size=500):
        """Split text into overlapping chunks."""
        words = text.split()
        chunks = []
        
        for i in range(0, len(words), chunk_size):
            chunk = " ".join(words[i:i + chunk_size])
            if chunk.strip():
                chunks.append(chunk)
        
        return chunks if chunks else [text]

    def answer_question(self, question, top_k=5, system_prompt=None):
        """End-to-end: retrieve documents, generate answer."""
        if not self.initialized:
            logger.error("Pipeline not initialized. Call initialize() first.")
            return None
        
        overall_start = time.time()
        # Set custom system prompt if provided
        if system_prompt:
            self.answer_generator.set_system_prompt(system_prompt)
        
        # Retrieve relevant documents
        logger.info(f"Searching for relevant information...")
        start = time.time()
        retrieved_docs = self.query(question, top_k=top_k)
        search_time = time.time() - start
        
        if not retrieved_docs:
            logger.warning("No relevant documents found.")
            return None
        
        logger.info(f"Found {len(retrieved_docs)} relevant documents.")
        
        # Generate answer
        logger.info("Generating answer...")
        start = time.time()
        answer = self.answer_generator.generate_answer(question, retrieved_docs)
        llm_time = time.time() - start
        
        total_time = time.time() - overall_start
        logger.info(f"[TIMING] End-to-end question answering:")
        logger.info(f"  - Document retrieval: {search_time:.2f}s")
        logger.info(f"  - LLM generation: {llm_time:.2f}s")
        logger.info(f"  - Total: {total_time:.2f}s")
        
        return answer

    def interactive_session(self, system_prompt=None):
        """Start interactive Q&A session."""
        if not self.initialized:
            logger.error("Pipeline not initialized. Call initialize() first.")
            return
        
        if system_prompt:
            self.answer_generator.set_system_prompt(system_prompt)
        
        logger.info("=" * 70)
        logger.info("RAG Q&A Session Started")
        logger.info("=" * 70)
        logger.info("Type your questions below. Enter 'quit' to exit.")
        logger.info("=" * 70)
        
        while True:
            try:
                question = input("\n📝 Question: ").strip()
                
                if question.lower() == 'quit':
                    logger.info("Session ended. Thank you!")
                    break
                
                if not question:
                    logger.warning("Please enter a valid question.")
                    continue
                
                # Answer question
                answer = self.answer_question(question, top_k=5)
                
                if answer:
                    logger.info("=" * 70)
                    logger.info("💡 Answer:")
                    logger.info("=" * 70)
                    logger.info(answer)
                    logger.info("=" * 70)
                else:
                    logger.error("Failed to generate answer.")
                
            except KeyboardInterrupt:
                logger.info("Session interrupted. Goodbye!")
                break
            except Exception as e:
                logger.error(f"Error: {e}")


if __name__ == "__main__":
    # Initialize pipeline
    pipeline = RAGPipeline()
    if not pipeline.initialize():
        logger.error("Failed to initialize pipeline.")
        exit(1)
    
    # List available documents
    logger.info("Documents in storage:")
    docs = pipeline.list_documents()
    for doc in docs:
        logger.info(f"  - {doc}")
    
    # Index PDF documents
    logger.info("=" * 50)
    logger.info("Indexing Documents...")
    logger.info("=" * 50)
    for doc in docs:
        if doc.endswith(".pdf"):
            pdf_path = os.path.join(os.path.dirname(__file__), "..", doc)
            # Try both paths
            if not os.path.exists(pdf_path):
                pdf_path = os.path.join(os.path.dirname(__file__), "..", "src", doc)
            
            if os.path.exists(pdf_path):
                pipeline.index_pdf(pdf_path)
            else:
                logger.error(f"PDF file not found: {doc}")
    
    # Custom system prompt (optional)
    custom_prompt = """Du bist ein KI-Assistent und Experte für Finanzberatung.
                    Beantworte Fragen ausschließlich auf Basis der bereitgestellten Informationen zu Bank- und Finanzdienstleistungen.
                    Antworte präzise, professionell und hilfreich.
                    Falls eine Information nicht im gegebenen Kontext enthalten ist, weise klar und transparent darauf hin. Das Dokument ist auf Deutsch und die Antworten müssen ebenfalls auf Deutsch erfolgen."""
    
    # Start interactive session
    pipeline.interactive_session(system_prompt=custom_prompt)
