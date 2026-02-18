import os
import logging
from azure.storage.blob import BlobServiceClient, ContainerClient
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)


class BlobStorageManager:
    def __init__(self):
        self.connection_string = os.getenv("AZURE_STORAGE_CONNECTION_STRING")
        self.container_name = os.getenv("AZURE_CONTAINER_NAME")
        self.client = None
        self.container_client = None

    def initialize(self):
        """Initialize blob storage connection and create container if not exists."""
        try:
            self.client = BlobServiceClient.from_connection_string(self.connection_string)
            self.container_client = self.client.get_container_client(self.container_name)
            
            # Check if container exists
            if not self._container_exists():
                logger.info(f"Container '{self.container_name}' not found. Creating...")
                self.container_client = self.client.create_container(name=self.container_name)
                logger.info(f"Container '{self.container_name}' created.")
            else:
                logger.info(f"Container '{self.container_name}' already exists.")
            return True
        except Exception as e:
            logger.error(f"Error initializing blob storage: {e}")
            return False

    def _container_exists(self):
        """Check if container exists."""
        try:
            self.client.get_container_client(self.container_name).get_container_properties()
            return True
        except:
            return False

    def upload_blob(self, file_path, blob_name):
        """Upload a file to blob storage."""
        try:
            with open(file_path, "rb") as data:
                self.container_client.upload_blob(blob_name, data, overwrite=True)
            logger.info(f"File '{file_path}' uploaded as '{blob_name}'.")
            return True
        except Exception as e:
            logger.error(f"Error uploading blob: {e}")
            return False

    def download_blob(self, blob_name, download_path):
        """Download a blob from storage."""
        try:
            blob_client = self.container_client.get_blob_client(blob_name)
            with open(download_path, "wb") as file:
                file.write(blob_client.download_blob().readall())
            logger.info(f"Blob '{blob_name}' downloaded to '{download_path}'.")
            return True
        except Exception as e:
            logger.error(f"Error downloading blob: {e}")
            return False

    def list_blobs(self):
        """List all blobs in container."""
        try:
            blobs = [blob.name for blob in self.container_client.list_blobs()]
            return blobs
        except Exception as e:
            logger.error(f"Error listing blobs: {e}")
            return []
