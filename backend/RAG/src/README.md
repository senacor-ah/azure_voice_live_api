# RAG Pipeline - Source Code Documentation

## Overview
This directory contains a modular Retrieval-Augmented Generation (RAG) pipeline built with Azure services. The pipeline enables document ingestion, embedding generation, vector search, and AI-powered question answering.

## Project Structure

```
src/
├── main.py              # Main pipeline orchestrator and entry point
├── answer_generator.py  # Azure OpenAI chat completion for answer generation
├── blob_storage.py      # Azure Blob Storage manager for document storage
├── embeddings.py        # Azure OpenAI embedding generation
└── vector_search.py     # Azure AI Search integration for vector/hybrid search
```

## Module Descriptions

### 1. **main.py** - RAG Pipeline Orchestrator
The main entry point that coordinates all components of the RAG pipeline.

**Key Class:** `RAGPipeline`

**Features:**
- Initializes all pipeline components (blob storage, embeddings, search, chat)
- Uploads documents to Azure Blob Storage
- Indexes PDF documents by extracting text and creating embeddings
- Performs vector and hybrid search queries
- Generates AI answers based on retrieved context
- Provides interactive Q&A session interface

**Main Methods:**
- `initialize()` - Set up all pipeline components
- `index_pdf(pdf_path, chunk_size)` - Extract, chunk, embed, and index PDF documents
- `query(question, top_k)` - Hybrid search (text + vector)
- `vector_query(question, top_k)` - Pure vector search
- `answer_question(question, top_k)` - End-to-end RAG: retrieve + generate answer
- `interactive_session(system_prompt)` - Start interactive Q&A interface

### 2. **answer_generator.py** - Answer Generation
Uses Azure OpenAI chat models to generate answers based on retrieved documents.

**Key Class:** `AnswerGenerator`

**Features:**
- Generates context-aware answers using retrieved documents
- Customizable system prompts
- Formats context with source attribution

**Main Methods:**
- `initialize()` - Initialize Azure OpenAI chat client
- `generate_answer(question, context_documents)` - Generate answer from context
- `set_system_prompt(prompt)` - Set custom system prompt

### 3. **blob_storage.py** - Document Storage
Manages document storage in Azure Blob Storage.

**Key Class:** `BlobStorageManager`

**Features:**
- Container creation and management
- File upload/download
- List stored documents

**Main Methods:**
- `initialize()` - Connect to Azure Blob Storage and ensure container exists
- `upload_blob(file_path, blob_name)` - Upload file to storage
- `download_blob(blob_name, download_path)` - Download file from storage
- `list_blobs()` - List all stored documents

### 4. **embeddings.py** - Text Embeddings
Generates text embeddings using Azure OpenAI embedding models.

**Key Class:** `EmbeddingManager`

**Features:**
- Single and batch embedding generation
- Text preprocessing (newline removal)
- Uses Azure OpenAI text-embedding-ada-002 model (1536 dimensions)

**Main Methods:**
- `initialize()` - Initialize Azure OpenAI embeddings client
- `generate_embedding(text)` - Generate embedding for single text
- `batch_generate_embeddings(texts)` - Generate embeddings for multiple texts

### 5. **vector_search.py** - Vector Search & Indexing
Manages Azure AI Search index creation, document upload, and search operations.

**Key Class:** `VectorSearchManager`

**Features:**
- Automatic index creation with vector search configuration
- Vector search using HNSW algorithm
- Hybrid search (combines text and vector search)
- Semantic search configuration
- Document upload and deletion

**Main Methods:**
- `initialize()` - Set up search client and create index if needed
- `vector_search(embedding, top_k)` - Pure vector search
- `hybrid_search(query, embedding, top_k)` - Text + vector hybrid search
- `upload_documents(documents)` - Upload documents to search index
- `delete_documents(doc_ids)` - Remove documents from index

## How to Run the Code

### Prerequisites
1. Python 3.8 or higher
2. Required Python packages (install from root directory):
   ```bash
   pip install -r requirements.txt
   ```
3. Azure resources configured (see environment variables section)
4. A `.env` file with all required credentials (see `.env.example`)

### Running the Pipeline

#### Option 1: Interactive Mode (Recommended)
Run the main pipeline script:
```bash
python src/main.py
```

This will:
1. Initialize all components
2. List documents in blob storage
3. Index any PDF documents found
4. Start an interactive Q&A session

**Interactive Commands:**
- Type your question and press Enter
- Type `quit` to exit the session
- Use Ctrl+C to interrupt

#### Option 2: Programmatic Usage
Import and use the pipeline in your own scripts:

```python
from src.main import RAGPipeline

# Initialize pipeline
pipeline = RAGPipeline()
if pipeline.initialize():
    
    # Index a PDF document
    pipeline.index_pdf("path/to/document.pdf", chunk_size=500)
    
    # Ask a question
    answer = pipeline.answer_question("What is the main topic?", top_k=5)
    print(answer)
    
    # Or use individual components
    docs = pipeline.query("search query", top_k=5)
    for doc in docs:
        print(f"Score: {doc['score']}, Source: {doc['source']}")
```

### Workflow

1. **Document Upload** (optional)
   ```python
   pipeline.upload_document("local_file.pdf", "blob_name.pdf")
   ```

2. **Document Indexing**
   ```python
   pipeline.index_pdf("document.pdf", chunk_size=500)
   ```
   - Extracts text from PDF
   - Splits into chunks
   - Generates embeddings
   - Uploads to Azure AI Search

3. **Question Answering**
   ```python
   answer = pipeline.answer_question("Your question here?", top_k=5)
   ```
   - Generates query embedding
   - Performs hybrid search
   - Retrieves top-k relevant documents
   - Generates context-aware answer

## Configuration

### Customization Options

**Chunk Size:** Control text chunk size for indexing
```python
pipeline.index_pdf("doc.pdf", chunk_size=1000)  # Default: 500 words
```

**Number of Results:** Adjust retrieval count
```python
pipeline.answer_question("question", top_k=10)  # Default: 5
```

**System Prompt:** Customize AI behavior
```python
custom_prompt = "You are a helpful financial advisor..."
pipeline.answer_question("question", system_prompt=custom_prompt)
```

### Index Schema

The search index includes:
- `id` (String) - Unique document identifier
- `content` (String) - Text content chunk
- `source` (String) - Original document name
- `title` (String) - Document title/part identifier
- `embedding` (Vector) - 1536-dimensional embedding

**Vector Search:** Uses HNSW algorithm for efficient similarity search
**Semantic Search:** Enhanced with semantic ranking capabilities

## Troubleshooting

### Common Issues

1. **"Pipeline not initialized"**
   - Ensure you call `pipeline.initialize()` before other operations

2. **"Failed to initialize [component]"**
   - Check `.env` file for missing/incorrect credentials
   - Verify Azure resources are accessible

3. **"PyPDF2 not installed"**
   - Install with: `pip install PyPDF2`

4. **"No relevant documents found"**
   - Ensure documents are indexed first
   - Check if search index contains documents
   - Verify query is relevant to indexed content

5. **API/Connection Errors**
   - Verify internet connectivity
   - Check Azure credentials and quotas
   - Ensure API versions are compatible

## Dependencies

Core libraries used:
- `azure-storage-blob` - Blob storage management
- `azure-search-documents` - AI Search operations
- `openai` - Azure OpenAI integration
- `python-dotenv` - Environment variable management
- `PyPDF2` - PDF text extraction (optional)

See `requirements.txt` in root directory for complete list.

## Environment Variables

All required credentials must be set in a `.env` file in the project root.
See `.env.example` for a template with all required variables.

## Notes

- Embeddings use the `text-embedding-ada-002` model (1536 dimensions)
- Chat completions default to the configured deployment name
- Documents are chunked with word-based splitting (no sentence preservation)
- Overlapping chunks are not implemented in the current version
- The system supports both German and English prompts/responses
