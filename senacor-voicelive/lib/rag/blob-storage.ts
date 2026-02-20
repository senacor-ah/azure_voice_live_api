/**
 * Blob Storage Manager
 * Migrated from: backend/RAG/src/blob_storage.py
 *
 * Azure Blob Storage operations for RAG document management.
 */

import { BlobServiceClient, ContainerClient } from '@azure/storage-blob'

export class BlobStorageManager {
  private connectionString: string
  private containerName: string
  private client: BlobServiceClient | null = null
  private containerClient: ContainerClient | null = null

  constructor() {
    this.connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING ?? ''
    this.containerName = process.env.AZURE_CONTAINER_NAME ?? ''
  }

  /** Initialize blob storage connection and create container if not exists. */
  async initialize(): Promise<boolean> {
    try {
      this.client = BlobServiceClient.fromConnectionString(this.connectionString)
      this.containerClient = this.client.getContainerClient(this.containerName)

      const exists = await this.containerClient.exists()
      if (!exists) {
        console.log(`Container '${this.containerName}' not found. Creating...`)
        await this.containerClient.create()
        console.log(`Container '${this.containerName}' created.`)
      } else {
        console.log(`Container '${this.containerName}' already exists.`)
      }
      return true
    } catch (e) {
      console.error(`Error initializing blob storage: ${e}`)
      return false
    }
  }

  /** Upload a file to blob storage. */
  async uploadBlob(filePath: string, blobName: string): Promise<boolean> {
    try {
      if (!this.containerClient) throw new Error('Not initialized')
      const blockBlobClient = this.containerClient.getBlockBlobClient(blobName)
      await blockBlobClient.uploadFile(filePath)
      console.log(`File '${filePath}' uploaded as '${blobName}'.`)
      return true
    } catch (e) {
      console.error(`Error uploading blob: ${e}`)
      return false
    }
  }

  /** Download a blob from storage. */
  async downloadBlob(blobName: string): Promise<Buffer | null> {
    try {
      if (!this.containerClient) throw new Error('Not initialized')
      const blobClient = this.containerClient.getBlobClient(blobName)
      const response = await blobClient.download()
      const chunks: Buffer[] = []
      if (response.readableStreamBody) {
        for await (const chunk of response.readableStreamBody) {
          chunks.push(Buffer.from(chunk))
        }
      }
      return Buffer.concat(chunks)
    } catch (e) {
      console.error(`Error downloading blob: ${e}`)
      return null
    }
  }

  /** List all blobs in container. */
  async listBlobs(): Promise<string[]> {
    try {
      if (!this.containerClient) throw new Error('Not initialized')
      const blobs: string[] = []
      for await (const blob of this.containerClient.listBlobsFlat()) {
        blobs.push(blob.name)
      }
      return blobs
    } catch (e) {
      console.error(`Error listing blobs: ${e}`)
      return []
    }
  }
}
