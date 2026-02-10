import os
import sys
import uuid
from dotenv import load_dotenv

# Add src directory to path
sys.path.insert(0, os.path.dirname(__file__))

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
        print("=" * 50)
        print("Initializing RAG Pipeline...")
        print("=" * 50)
        
        # Initialize Blob Storage
        print("\n1. Initializing Blob Storage...")
        if not self.blob_manager.initialize():
            print("Failed to initialize blob storage.")
            return False
        
        # Initialize Embeddings
        print("\n2. Initializing Embedding Model...")
        if not self.embedding_manager.initialize():
            print("Failed to initialize embedding model.")
            return False
        
        # Initialize Search
        print("\n3. Initializing Vector Search...")
        if not self.search_manager.initialize():
            print("Failed to initialize search.")
            return False
        
        # Initialize Answer Generator
        print("\n4. Initializing Answer Generator...")
        if not self.answer_generator.initialize():
            print("Failed to initialize answer generator.")
            return False
        
        self.initialized = True
        print("\n" + "=" * 50)
        print("RAG Pipeline initialized successfully!")
        print("=" * 50 + "\n")
        return True

    def upload_document(self, file_path, blob_name=None):
        """Upload a document to blob storage."""
        if not self.initialized:
            print("Pipeline not initialized. Call initialize() first.")
            return False
        
        if blob_name is None:
            blob_name = os.path.basename(file_path)
        
        return self.blob_manager.upload_blob(file_path, blob_name)

    def query(self, question, top_k=5):
        """Query the RAG pipeline."""
        if not self.initialized:
            print("Pipeline not initialized. Call initialize() first.")
            return []
        
        # Generate embedding for query
        query_embedding = self.embedding_manager.generate_embedding(question)
        if query_embedding is None:
            print("Failed to generate embedding for query.")
            return []
        
        # Perform hybrid search
        results = self.search_manager.hybrid_search(question, query_embedding, top_k=top_k)
        return results

    def vector_query(self, question, top_k=5):
        """Pure vector search without text query."""
        if not self.initialized:
            print("Pipeline not initialized. Call initialize() first.")
            return []
        
        query_embedding = self.embedding_manager.generate_embedding(question)
        if query_embedding is None:
            print("Failed to generate embedding for query.")
            return []
        
        results = self.search_manager.vector_search(query_embedding, top_k=top_k)
        return results

    def list_documents(self):
        """List all documents in blob storage."""
        if not self.initialized:
            print("Pipeline not initialized. Call initialize() first.")
            return []
        
        return self.blob_manager.list_blobs()

    def index_pdf(self, pdf_path, chunk_size=500):
        """Extract text from PDF, create embeddings, and index documents."""
        if not self.initialized:
            print("Pipeline not initialized. Call initialize() first.")
            return False
        
        if not HAS_PYPDF:
            print("PyPDF2 not installed. Install with: pip install PyPDF2")
            return False
        
        try:
            # Extract text from PDF
            print(f"Extracting text from {pdf_path}...")
            reader = PdfReader(pdf_path)
            full_text = ""
            for page in reader.pages:
                full_text += page.extract_text()
            
            if not full_text:
                print("No text extracted from PDF.")
                return False
            
            # Split text into chunks
            chunks = self._chunk_text(full_text, chunk_size)
            print(f"Created {len(chunks)} chunks from PDF.")
            
            # Generate embeddings for chunks
            print("Generating embeddings...")
            embeddings = self.embedding_manager.batch_generate_embeddings(chunks)
            if not embeddings:
                print("Failed to generate embeddings.")
                return False
            
            # Prepare documents for indexing
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
            
            # Upload to search index
            print("Uploading documents to search index...")
            if self.search_manager.upload_documents(documents):
                print(f"Successfully indexed {len(documents)} documents.")
                return True
            else:
                print("Failed to upload documents to index.")
                return False
            
        except Exception as e:
            print(f"Error indexing PDF: {e}")
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
            print("Pipeline not initialized. Call initialize() first.")
            return None
        
        # Set custom system prompt if provided
        if system_prompt:
            self.answer_generator.set_system_prompt(system_prompt)
        
        # Retrieve relevant documents
        print(f"\nSearching for relevant information...")
        retrieved_docs = self.query(question, top_k=top_k)
        
        if not retrieved_docs:
            print("No relevant documents found.")
            return None
        
        print(f"Found {len(retrieved_docs)} relevant documents.")
        
        # Generate answer
        print("Generating answer...")
        answer = self.answer_generator.generate_answer(question, retrieved_docs)
        
        return answer

    def interactive_session(self, system_prompt=None):
        """Start interactive Q&A session."""
        if not self.initialized:
            print("Pipeline not initialized. Call initialize() first.")
            return
        
        if system_prompt:
            self.answer_generator.set_system_prompt(system_prompt)
        
        print("\n" + "=" * 70)
        print("RAG Q&A Session Started")
        print("=" * 70)
        print("Type your questions below. Enter 'quit' to exit.")
        print("=" * 70 + "\n")
        
        while True:
            try:
                question = input("\n📝 Question: ").strip()
                
                if question.lower() == 'quit':
                    print("\nSession ended. Thank you!")
                    break
                
                if not question:
                    print("Please enter a valid question.")
                    continue
                
                # Answer question
                answer = self.answer_question(question, top_k=5)
                
                if answer:
                    print("\n" + "=" * 70)
                    print("💡 Answer:")
                    print("=" * 70)
                    print(answer)
                    print("=" * 70)
                else:
                    print("Failed to generate answer.")
                
            except KeyboardInterrupt:
                print("\n\nSession interrupted. Goodbye!")
                break
            except Exception as e:
                print(f"Error: {e}")


if __name__ == "__main__":
    # Initialize pipeline
    pipeline = RAGPipeline()
    if not pipeline.initialize():
        print("Failed to initialize pipeline.")
        exit(1)
    
    # List available documents
    print("Documents in storage:")
    docs = pipeline.list_documents()
    for doc in docs:
        print(f"  - {doc}")
    
    # Index PDF documents
    print("\n" + "=" * 50)
    print("Indexing Documents...")
    print("=" * 50)
    for doc in docs:
        if doc.endswith(".pdf"):
            pdf_path = os.path.join(os.path.dirname(__file__), "..", doc)
            # Try both paths
            if not os.path.exists(pdf_path):
                pdf_path = os.path.join(os.path.dirname(__file__), "..", "src", doc)
            
            if os.path.exists(pdf_path):
                pipeline.index_pdf(pdf_path)
            else:
                print(f"PDF file not found: {doc}")
    
    # Custom system prompt (optional)
    custom_prompt = """Du bist ein KI-Assistent und Experte für Finanzberatung.
                    Beantworte Fragen ausschließlich auf Basis der bereitgestellten Informationen zu Bank- und Finanzdienstleistungen.
                    Antworte präzise, professionell und hilfreich.
                    Falls eine Information nicht im gegebenen Kontext enthalten ist, weise klar und transparent darauf hin. Das Dokument ist auf Deutsch und die Antworten müssen ebenfalls auf Deutsch erfolgen."""
    
    # Start interactive session
    pipeline.interactive_session(system_prompt=custom_prompt)
