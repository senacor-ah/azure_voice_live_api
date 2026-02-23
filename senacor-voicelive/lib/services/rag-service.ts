/**
 * RAG Service for Voice Live Integration
 * Migrated from: backend/src/rag_service.py
 *
 * Provides a wrapper around the RAG pipeline for integration
 * with the Azure Voice Live agent as a function tool.
 */

import { BlobStorageManager } from '@/lib/rag/blob-storage'
import { EmbeddingManager } from '@/lib/rag/embeddings'
import { VectorSearchManager } from '@/lib/rag/vector-search'
import { AnswerGenerator } from '@/lib/rag/answer-generator'
import { AnswerGeneratorOpenRouter } from '@/lib/rag/answer-generator-openrouter'
import { getEventStreamingService } from '@/lib/services/event-streaming'
import type { RAGQueryResult, RAGSource } from '@/lib/types/voice'

// ============================================================================
// RAG Service
// ============================================================================

interface CacheEntry {
  result: RAGQueryResult
  expiresAt: number
}

export class RAGService {
  private blobManager: BlobStorageManager
  private embeddingManager: EmbeddingManager
  private searchManager: VectorSearchManager
  private answerGenerator: AnswerGenerator | AnswerGeneratorOpenRouter
  private benchmarkGenerator: AnswerGenerator | null = null
  private _initialized = false
  private queryCache = new Map<string, CacheEntry>()
  private readonly CACHE_TTL_MS = 5 * 60 * 1000 // 5 Minuten

  constructor() {
    this.blobManager = new BlobStorageManager()
    this.embeddingManager = new EmbeddingManager()
    this.searchManager = new VectorSearchManager()

    // Choose answer generator based on environment variable
    const useOpenRouter = (process.env.USE_OPENROUTER ?? 'false').toLowerCase() === 'true'

    if (useOpenRouter) {
      console.log('🔀 Using OpenRouter for answer generation')
      this.answerGenerator = new AnswerGeneratorOpenRouter()
      // Also initialize Azure OpenAI for background benchmarking
      console.log('📊 Initializing Azure OpenAI for background benchmarking')
      this.benchmarkGenerator = new AnswerGenerator()
    } else {
      console.log('🔀 Using Azure OpenAI for answer generation')
      this.answerGenerator = new AnswerGenerator()
      this.benchmarkGenerator = null
    }

    // Customize system prompt for voice interaction
    this.answerGenerator.systemPrompt = `
Du bist ein Informationsextraktionssystem für die Senacor Bank.

AUFGABE:
Beantworte die Frage ausschließlich auf Basis des bereitgestellten Kontexts.
Der Kontext stammt aus offiziellen Bankdokumenten der Senacor Bank.

WICHTIG – DOKUMENTENHERKUNFT:
Die bereitgestellten Dokumente sind die offiziellen Produkt- und Preisinformationen
der Senacor Bank. Falls der Text im Kontext andere Banknamen (z. B. "Commerzbank")
enthält, ignoriere diese Bezeichnungen – behandle alle Inhalte als Senacor Bank
Dokumente und beantworte die Frage trotzdem auf Basis der enthaltenen Informationen.

SPRACHE:
- Antworte IMMER auf Deutsch.
- Klar, präzise, natürlich gesprochen.
- Maximal 3–4 kurze Sätze.

INHALTLICHE REGELN:
- Verwende ausschließlich Informationen aus dem bereitgestellten Kontext.
- Ergänze KEIN eigenes Wissen außerhalb des Kontexts.
- Erfinde niemals Zahlen, Produkte oder Konditionen.
- Nur wenn der Kontext wirklich keine relevanten Informationen enthält, antworte:
  "Dazu liegen mir aktuell keine ausreichenden Informationen vor."

FORMAT:
- Keine langen Aufzählungen – fasse bei mehreren Punkten kompakt zusammen.
- Keine Markdown-Formatierung.
`
  }

  /** Initialize all RAG pipeline components. */
  async initialize(): Promise<boolean> {
    if (this._initialized) {
      console.log('RAG Service already initialized')
      return true
    }

    try {
      console.log('Initializing RAG Service...')

      if (!(await this.blobManager.initialize())) {
        console.error('Failed to initialize blob storage')
        return false
      }

      if (!this.embeddingManager.initialize()) {
        console.error('Failed to initialize embedding model')
        return false
      }

      if (!(await this.searchManager.initialize())) {
        console.error('Failed to initialize vector search')
        return false
      }

      if (!this.answerGenerator.initialize()) {
        console.error('Failed to initialize answer generator')
        return false
      }

      if (this.benchmarkGenerator) {
        if (!this.benchmarkGenerator.initialize()) {
          console.warn('Failed to initialize benchmark generator - continuing without')
          this.benchmarkGenerator = null
        } else {
          console.log('✅ Benchmark generator (Azure OpenAI) initialized')
        }
      }

      this._initialized = true
      console.log('✅ RAG Service initialized successfully')
      return true
    } catch (e) {
      console.error(`Error initializing RAG Service: ${e}`)
      return false
    }
  }

  /**
   * Query the RAG system with a question.
   */
  async query(
    question: string,
    topK = 3,
    maxTokens = 300,
    sessionId?: string,
    userId?: string,
  ): Promise<RAGQueryResult> {
    if (!this._initialized) {
      return { success: false, error: 'RAG Service nicht initialisiert' }
    }

    try {
      console.log(`📝 RAG Query: ${question.slice(0, 100)}...`)
      const eventStreaming = getEventStreamingService()

      // Check cache first
      const cacheKey = `${question.trim().toLowerCase()}:${topK}`
      const cached = this.queryCache.get(cacheKey)
      if (cached && cached.expiresAt > Date.now()) {
        console.log('⚡ RAG Cache hit – returning cached answer')
        return cached.result
      }

      // Generate embedding for question
      const embeddingStart = performance.now()
      const queryEmbedding = await this.embeddingManager.generateEmbedding(question)
      const embeddingTimeMs = performance.now() - embeddingStart

      if (!queryEmbedding) {
        return { success: false, error: 'Fehler beim Generieren des Embeddings' }
      }

      console.log(`⏱️ Embedding generated in ${embeddingTimeMs.toFixed(2)}ms`)

      // Publish embedding completed event
      if (sessionId && eventStreaming.enabled) {
        await eventStreaming.publishRagEmbeddingCompleted(
          sessionId,
          question.slice(0, 100),
          embeddingTimeMs,
          userId,
        )
      }

      // Search for relevant documents
      console.log(`🔍 Searching for top ${topK} Chunks...`)
      const searchStart = performance.now()
      // Fetch more than topK to have buffer for deduplication
      const fetchK = topK * 3
      const rawResults = await this.searchManager.vectorSearch(queryEmbedding, fetchK)

      // Deduplicate by content fingerprint (first 200 chars), then cap at topK
      const seen = new Set<string>()
      const results = rawResults.filter((doc) => {
        const fingerprint = doc.content.slice(0, 200).trim()
        if (seen.has(fingerprint)) return false
        seen.add(fingerprint)
        return true
      }).slice(0, topK)

      const searchTimeMs = performance.now() - searchStart

      if (rawResults.length !== results.length) {
        console.warn(`⚠️  Deduplication removed ${rawResults.length - results.length} duplicate chunk(s) – index likely has duplicate documents!`)
      }

      if (!results.length) {
        return {
          success: true,
          answer: 'Ich konnte leider keine relevanten Informationen in den Dokumenten finden.',
          sources: [],
        }
      }

      console.log(`✅ Found ${results.length} relevant Chunks in ${searchTimeMs.toFixed(2)}ms`)

      // Log retrieved chunks for debugging
      console.log('─'.repeat(60))
      results.forEach((doc, i) => {
        console.log(`[Chunk ${i + 1}] source=${doc.source} | score=${doc.score.toFixed(4)}`)
        console.log(`           content: ${doc.content.slice(0, 200).replace(/\n/g, ' ')}…`)
      })
      console.log('─'.repeat(60))

      // Prepare top 5 chunks for event streaming
      const topChunks = results.slice(0, 5).map((doc) => ({
        source: doc.source,
        score: doc.score,
        content_preview: doc.content.slice(0, 150),
      }))

      // Publish vector search completed event
      if (sessionId && eventStreaming.enabled) {
        await eventStreaming.publishRagVectorSearchCompleted(
          sessionId,
          searchTimeMs,
          topChunks,
          userId,
        )
      }

      // Generate answer
      console.log('🤖 Generating answer...')

      // Run benchmark in background (fire-and-forget)
      if (this.benchmarkGenerator) {
        this.benchmarkGenerator
          .generateAnswer(question, results, maxTokens)
          .then((res) => {
            if (res) console.log('📊 [BENCHMARK] Azure OpenAI generation completed')
            else console.warn('📊 [BENCHMARK] Azure OpenAI generation failed')
          })
          .catch((e) => console.error(`📊 [BENCHMARK] Error: ${e}`))
      }

      // Main answer generation
      const llmStart = performance.now()
      const answerResult = await this.answerGenerator.generateAnswer(question, results, maxTokens)
      const totalCompletionTimeMs = performance.now() - llmStart

      if (!answerResult) {
        return { success: false, error: 'Fehler beim Generieren der Antwort' }
      }

      const answer = answerResult.answer
      const firstTokenTimeMs = answerResult.first_token_time_ms ?? totalCompletionTimeMs * 0.1

      console.log(`✅ Answer generated successfully (${answer.length} chars, ${totalCompletionTimeMs.toFixed(2)}ms)`)

      // Publish LLM generation completed event
      if (sessionId && eventStreaming.enabled) {
        await eventStreaming.publishRagLlmGenerationCompleted(
          sessionId,
          firstTokenTimeMs,
          totalCompletionTimeMs,
          answer.length,
          userId,
        )
      }

      const sources: RAGSource[] = results.map((doc) => ({
        source: doc.source,
        score: doc.score,
        content: doc.content.slice(0, 200) + '...',
      }))

      const queryResult: RAGQueryResult = { success: true, answer, sources }

      // Store in cache
      this.queryCache.set(cacheKey, {
        result: queryResult,
        expiresAt: Date.now() + this.CACHE_TTL_MS,
      })

      return queryResult
    } catch (e) {
      console.error(`Error in RAG query: ${e}`)
      return { success: false, error: `Fehler bei der Abfrage: ${String(e)}` }
    }
  }

  /** Get list of available documents in storage. */
  async getAvailableDocuments(): Promise<string[]> {
    if (!this._initialized) return []
    try {
      return await this.blobManager.listBlobs()
    } catch (e) {
      console.error(`Error listing documents: ${e}`)
      return []
    }
  }

  /** Check if RAG service is initialized. */
  isInitialized(): boolean {
    return this._initialized
  }
}

// ============================================================================
// Singleton
// ============================================================================

let _ragServiceInstance: RAGService | null = null

export function getRagService(): RAGService {
  if (!_ragServiceInstance) {
    _ragServiceInstance = new RAGService()
  }
  return _ragServiceInstance
}
