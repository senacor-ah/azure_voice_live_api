/**
 * Vector Search Manager
 * Migrated from: backend/RAG/src/vector_search.py
 *
 * Azure AI Search operations for RAG vector/hybrid search.
 */

import {
  SearchClient,
  SearchIndexClient,
  KnownSearchFieldDataType,
} from '@azure/search-documents'
import { AzureKeyCredential } from '@azure/core-auth'

export interface SearchDocument {
  id: string
  content: string
  source: string
  score: number
  title?: string
}

export class VectorSearchManager {
  private searchServiceName: string
  private searchApiKey: string
  private searchIndexName: string
  private endpoint: string
  private searchClient: SearchClient<Record<string, unknown>> | null = null
  private indexClient: SearchIndexClient | null = null

  constructor() {
    this.searchServiceName = process.env.AZURE_SEARCH_SERVICE_NAME ?? ''
    this.searchApiKey = process.env.AZURE_SEARCH_API_KEY ?? ''
    this.searchIndexName = process.env.AZURE_SEARCH_INDEX_NAME ?? ''
    this.endpoint = `https://${this.searchServiceName}.search.windows.net`
  }

  /** Initialize search client and create index if it doesn't exist. */
  async initialize(): Promise<boolean> {
    try {
      const credential = new AzureKeyCredential(this.searchApiKey)

      this.searchClient = new SearchClient(
        this.endpoint,
        this.searchIndexName,
        credential,
      )

      this.indexClient = new SearchIndexClient(this.endpoint, credential)

      const indexExists = await this.indexExists()
      if (indexExists) {
        console.log(`Search index '${this.searchIndexName}' already exists.`)
      } else {
        console.log(`Search index '${this.searchIndexName}' does not exist. Creating...`)
        const created = await this.createIndex()
        if (created) {
          console.log(`Search index '${this.searchIndexName}' created successfully.`)
        } else {
          console.error(`Failed to create index '${this.searchIndexName}'.`)
          return false
        }
      }
      return true
    } catch (e) {
      console.error(`Error initializing search client: ${e}`)
      return false
    }
  }

  /** Check if index exists. */
  private async indexExists(): Promise<boolean> {
    try {
      if (!this.indexClient) return false
      await this.indexClient.getIndex(this.searchIndexName)
      return true
    } catch {
      return false
    }
  }

  /** Create search index with vector field. */
  private async createIndex(): Promise<boolean> {
    try {
      if (!this.indexClient) return false

      const startTime = performance.now()

      await this.indexClient.createIndex({
        name: this.searchIndexName,
        fields: [
          { name: 'id', type: KnownSearchFieldDataType.String, key: true },
          {
            name: 'content',
            type: KnownSearchFieldDataType.String,
            searchable: true,
            analyzerName: 'standard.lucene',
          },
          {
            name: 'source',
            type: KnownSearchFieldDataType.String,
            searchable: true,
            filterable: true,
          },
          {
            name: 'title',
            type: KnownSearchFieldDataType.String,
            searchable: true,
          },
          {
            name: 'embedding',
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            type: 'Collection(Edm.Single)' as any,
            searchable: true,
            vectorSearchDimensions: 1536,
            vectorSearchProfileName: 'myHnswProfile',
          },
        ],
        vectorSearch: {
          algorithms: [
            { name: 'myHnsw', kind: 'hnsw' },
          ],
          profiles: [
            { name: 'myHnswProfile', algorithmConfigurationName: 'myHnsw' },
          ],
        },
        semanticSearch: {
          configurations: [
            {
              name: 'default',
              prioritizedFields: {
                contentFields: [{ name: 'content' }],
              },
            },
          ],
        },
      })

      const elapsed = (performance.now() - startTime) / 1000
      console.log(`[TIMING] Search index created in ${elapsed.toFixed(2)}s`)
      return true
    } catch (e) {
      console.error(`Error creating index: ${e}`)
      return false
    }
  }

  /** Perform vector search on indexed documents. */
  async vectorSearch(embedding: number[], topK = 5): Promise<SearchDocument[]> {
    try {
      if (!this.searchClient) throw new Error('Not initialized')

      const startTime = performance.now()

      const results = await this.searchClient.search('', {
        vectorSearchOptions: {
          queries: [
            {
              kind: 'vector',
              vector: embedding,
              kNearestNeighborsCount: topK,
              fields: ['embedding'],
            },
          ],
        },
        top: topK,
        includeTotalCount: true,
      })

      const retrievedDocs: SearchDocument[] = []
      for await (const result of results.results) {
        retrievedDocs.push({
          id: String(result.document.id ?? ''),
          content: String(result.document.content ?? ''),
          source: String(result.document.source ?? ''),
          score: result.score ?? 0,
          title: result.document.title ? String(result.document.title) : undefined,
        })
      }

      const elapsed = (performance.now() - startTime) / 1000
      console.log(
        `[TIMING] Vector search completed in ${elapsed.toFixed(2)}s (retrieved ${retrievedDocs.length} documents)`,
      )
      return retrievedDocs
    } catch (e) {
      console.error(`Error performing vector search: ${e}`)
      return []
    }
  }

  /** Perform hybrid search (text + vector). */
  async hybridSearch(query: string, embedding: number[], topK = 5): Promise<SearchDocument[]> {
    try {
      if (!this.searchClient) throw new Error('Not initialized')

      const startTime = performance.now()

      const results = await this.searchClient.search(query, {
        vectorSearchOptions: {
          queries: [
            {
              kind: 'vector',
              vector: embedding,
              kNearestNeighborsCount: topK,
              fields: ['embedding'],
            },
          ],
        },
        top: topK,
        includeTotalCount: true,
      })

      const retrievedDocs: SearchDocument[] = []
      for await (const result of results.results) {
        retrievedDocs.push({
          id: String(result.document.id ?? ''),
          content: String(result.document.content ?? ''),
          source: String(result.document.source ?? ''),
          score: result.score ?? 0,
          title: result.document.title ? String(result.document.title) : undefined,
        })
      }

      const elapsed = (performance.now() - startTime) / 1000
      console.log(
        `[TIMING] Hybrid search completed in ${elapsed.toFixed(2)}s (retrieved ${retrievedDocs.length} documents)`,
      )
      return retrievedDocs
    } catch (e) {
      console.error(`Error performing hybrid search: ${e}`)
      return []
    }
  }

  /** Upload documents to search index. */
  async uploadDocuments(documents: Record<string, unknown>[]): Promise<boolean> {
    try {
      if (!this.searchClient) throw new Error('Not initialized')

      const startTime = performance.now()
      await this.searchClient.uploadDocuments(documents)
      const elapsed = (performance.now() - startTime) / 1000
      console.log(`[TIMING] Indexed ${documents.length} documents in ${elapsed.toFixed(2)}s`)
      return true
    } catch (e) {
      console.error(`Error uploading documents: ${e}`)
      return false
    }
  }

  /** Delete documents from index by id. */
  async deleteDocuments(docIds: string[]): Promise<boolean> {
    try {
      if (!this.searchClient) throw new Error('Not initialized')
      const docs = docIds.map((id) => ({ id }))
      await this.searchClient.deleteDocuments(docs)
      console.log(`Deleted ${docIds.length} documents from index.`)
      return true
    } catch (e) {
      console.error(`Error deleting documents: ${e}`)
      return false
    }
  }
}
