import os
from azure.search.documents import SearchClient
from azure.search.documents.indexes import SearchIndexClient
from azure.search.documents.indexes.models import (
    SearchIndex, SearchField, SearchFieldDataType, SimpleField, SearchableField,
    VectorSearch, HnswAlgorithmConfiguration, VectorSearchProfile, SemanticConfiguration,
    SemanticField, SemanticPrioritizedFields, SemanticSearch
)
from azure.core.credentials import AzureKeyCredential
from dotenv import load_dotenv

load_dotenv()


class VectorSearchManager:
    def __init__(self):
        self.search_service_name = os.getenv("AZURE_SEARCH_SERVICE_NAME")
        self.search_api_key = os.getenv("AZURE_SEARCH_API_KEY")
        self.search_index_name = os.getenv("AZURE_SEARCH_INDEX_NAME")
        self.endpoint = f"https://{self.search_service_name}.search.windows.net"
        self.search_client = None
        self.index_client = None

    def initialize(self):
        """Initialize search client and create index if it doesn't exist."""
        try:
            credential = AzureKeyCredential(self.search_api_key)
            self.search_client = SearchClient(
                endpoint=self.endpoint,
                index_name=self.search_index_name,
                credential=credential
            )
            self.index_client = SearchIndexClient(
                endpoint=self.endpoint,
                credential=credential
            )
            
            # Check if index exists, create if not
            if self._index_exists():
                print(f"Search index '{self.search_index_name}' already exists.")
            else:
                print(f"Search index '{self.search_index_name}' does not exist. Creating...")
                if self._create_index():
                    print(f"Search index '{self.search_index_name}' created successfully.")
                else:
                    print(f"Failed to create index '{self.search_index_name}'.")
                    return False
            return True
        except Exception as e:
            print(f"Error initializing search client: {e}")
            return False

    def _index_exists(self):
        """Check if index exists."""
        try:
            self.index_client.get_index(self.search_index_name)
            return True
        except:
            return False

    def _create_index(self):
        """Create search index with vector field."""
        try:
            index = SearchIndex(
                name=self.search_index_name,
                fields=[
                    SimpleField(name="id", type=SearchFieldDataType.String, key=True),
                    SearchableField(name="content", type=SearchFieldDataType.String, analyzer_name="standard.lucene"),
                    SearchableField(name="source", type=SearchFieldDataType.String, retrievable=True, filterable=True),
                    SearchableField(name="title", type=SearchFieldDataType.String, retrievable=True),
                    SearchField(name="embedding", type=SearchFieldDataType.Collection(SearchFieldDataType.Single),
                               searchable=True, vector_search_dimensions=1536, vector_search_profile_name="myHnswProfile"),
                ],
                vector_search=VectorSearch(
                    algorithms=[HnswAlgorithmConfiguration(name="myHnsw")],
                    profiles=[VectorSearchProfile(name="myHnswProfile", algorithm_configuration_name="myHnsw")]
                ),
                semantic_search=SemanticSearch(
                    configurations=[SemanticConfiguration(
                        name="default",
                        prioritized_fields=SemanticPrioritizedFields(
                            content_fields=[SemanticField(field_name="content")]
                        )
                    )]
                )
            )
            self.index_client.create_index(index)
            return True
        except Exception as e:
            print(f"Error creating index: {e}")
            return False

    def vector_search(self, embedding, top_k=5):
        """Perform vector search on indexed documents."""
        try:
            from azure.search.documents.models import VectorizedQuery
            
            vector_query = VectorizedQuery(vector=embedding, k_nearest_neighbors=top_k, fields="embedding")
            results = self.search_client.search(
                search_text="",
                vector_queries=[vector_query],
                top=top_k,
                include_total_count=True
            )
            
            retrieved_docs = []
            for result in results:
                doc = {
                    "id": result.get("id"),
                    "content": result.get("content"),
                    "source": result.get("source"),
                    "score": result.get("@search.score")
                }
                retrieved_docs.append(doc)
            return retrieved_docs
        except Exception as e:
            print(f"Error performing vector search: {e}")
            return []

    def hybrid_search(self, query, embedding, top_k=5):
        """Perform hybrid search (text + vector)."""
        try:
            from azure.search.documents.models import VectorizedQuery
            
            vector_query = VectorizedQuery(vector=embedding, k_nearest_neighbors=top_k, fields="embedding")
            results = self.search_client.search(
                search_text=query,
                vector_queries=[vector_query],
                top=top_k,
                include_total_count=True
            )
            
            retrieved_docs = []
            for result in results:
                doc = {
                    "id": result.get("id"),
                    "content": result.get("content"),
                    "source": result.get("source"),
                    "score": result.get("@search.score")
                }
                retrieved_docs.append(doc)
            return retrieved_docs
        except Exception as e:
            print(f"Error performing hybrid search: {e}")
            return []

    def upload_documents(self, documents):
        """Upload documents to search index."""
        try:
            self.search_client.upload_documents(documents)
            print(f"Uploaded {len(documents)} documents to index.")
            return True
        except Exception as e:
            print(f"Error uploading documents: {e}")
            return False

    def delete_documents(self, doc_ids):
        """Delete documents from index by id."""
        try:
            docs = [{"id": doc_id} for doc_id in doc_ids]
            self.search_client.delete_documents(docs)
            print(f"Deleted {len(doc_ids)} documents from index.")
            return True
        except Exception as e:
            print(f"Error deleting documents: {e}")
            return False
