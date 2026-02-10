import os
from openai import AzureOpenAI
from dotenv import load_dotenv

load_dotenv()


class EmbeddingManager:
    def __init__(self):
        self.api_key = os.getenv("AZURE_OPENAI_API_KEY")
        self.api_endpoint = os.getenv("AZURE_OPENAI_ENDPOINT")
        self.api_version = os.getenv("AZURE_OPENAI_API_VERSION")
        self.deployment_name = os.getenv("AZURE_OPENAI_EMBEDDING_DEPLOYMENT")
        self.client = None

    def initialize(self):
        """Initialize Azure OpenAI embedding model."""
        try:
            self.client = AzureOpenAI(
                api_key=self.api_key,
                api_version=self.api_version,
                azure_endpoint=self.api_endpoint
            )
            print(f"Embedding model '{self.deployment_name}' initialized.")
            return True
        except Exception as e:
            print(f"Error initializing embedding model: {e}")
            return False

    def generate_embedding(self, text):
        """Generate embedding for a single text."""
        try:
            text = text.replace("\n", " ").strip()
            response = self.client.embeddings.create(
                input=text,
                model=self.deployment_name
            )
            return response.data[0].embedding
        except Exception as e:
            print(f"Error generating embedding: {e}")
            return None

    def batch_generate_embeddings(self, texts):
        """Generate embeddings for multiple texts."""
        try:
            response = self.client.embeddings.create(
                input=texts,
                model=self.deployment_name
            )
            embeddings = [item.embedding for item in response.data]
            return embeddings
        except Exception as e:
            print(f"Error batch generating embeddings: {e}")
            return None
