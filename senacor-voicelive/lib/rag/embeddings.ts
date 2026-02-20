/**
 * Embedding Manager
 * Migrated from: backend/RAG/src/embeddings.py
 *
 * Azure OpenAI embedding generation for RAG pipeline.
 */

import { AzureOpenAI } from 'openai'

export class EmbeddingManager {
  private apiKey: string
  private apiEndpoint: string
  private apiVersion: string
  private deploymentName: string
  private client: AzureOpenAI | null = null

  constructor() {
    this.apiKey = process.env.AZURE_OPENAI_API_KEY ?? ''
    this.apiEndpoint = process.env.AZURE_OPENAI_ENDPOINT ?? ''
    this.apiVersion = process.env.AZURE_OPENAI_API_VERSION ?? ''
    this.deploymentName = process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT ?? ''
  }

  /** Initialize Azure OpenAI embedding model. */
  initialize(): boolean {
    try {
      this.client = new AzureOpenAI({
        apiKey: this.apiKey,
        apiVersion: this.apiVersion,
        endpoint: this.apiEndpoint,
      })
      console.log(`Embedding model '${this.deploymentName}' initialized.`)
      return true
    } catch (e) {
      console.error(`Error initializing embedding model: ${e}`)
      return false
    }
  }

  /** Generate embedding for a single text. */
  async generateEmbedding(text: string): Promise<number[] | null> {
    try {
      if (!this.client) throw new Error('Not initialized')

      const startTime = performance.now()
      const cleanText = text.replace(/\n/g, ' ').trim()

      const response = await this.client.embeddings.create({
        input: cleanText,
        model: this.deploymentName,
      })

      const elapsed = (performance.now() - startTime) / 1000
      console.log(`[TIMING] Single embedding generated in ${elapsed.toFixed(2)}s`)

      return response.data[0].embedding
    } catch (e) {
      console.error(`Error generating embedding: ${e}`)
      return null
    }
  }

  /** Generate embeddings for multiple texts. */
  async batchGenerateEmbeddings(texts: string[]): Promise<number[][] | null> {
    try {
      if (!this.client) throw new Error('Not initialized')

      const startTime = performance.now()

      const response = await this.client.embeddings.create({
        input: texts,
        model: this.deploymentName,
      })

      const embeddings = response.data.map((item) => item.embedding)
      const elapsed = (performance.now() - startTime) / 1000
      console.log(`[TIMING] Batch embeddings (${texts.length} texts) generated in ${elapsed.toFixed(2)}s`)

      return embeddings
    } catch (e) {
      console.error(`Error batch generating embeddings: ${e}`)
      return null
    }
  }
}
