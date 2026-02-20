/**
 * Event Streaming Service - Azure Web PubSub Integration
 * Migrated from: backend/src/event_streaming.py
 *
 * Real-time event streaming service that publishes events to Azure Web PubSub.
 * Allows external clients to subscribe to conversation events in real-time.
 */

import { WebPubSubServiceClient } from '@azure/web-pubsub'

// ============================================================================
// Event Streaming Service
// ============================================================================

export class EventStreamingService {
  private client: WebPubSubServiceClient | null = null
  private hubName: string
  public enabled: boolean

  constructor(connectionString?: string, hubName?: string) {
    const connStr = connectionString ?? process.env.AZURE_WEBPUBSUB_CONNECTION_STRING ?? ''
    this.hubName = hubName ?? process.env.AZURE_WEBPUBSUB_HUB_NAME ?? 'conversation_events'
    this.enabled = Boolean(connStr)

    if (this.enabled) {
      try {
        this.client = new WebPubSubServiceClient(connStr, this.hubName)
        console.log(`✅ Event Streaming Service initialized (Hub: ${this.hubName})`)
      } catch (e) {
        console.error(`❌ Failed to initialize Web PubSub client: ${e}`)
        this.enabled = false
        this.client = null
      }
    } else {
      console.warn('⚠️ Event Streaming Service disabled (no connection string)')
    }
  }

  // --------------------------------------------------------------------------
  // Core publish methods
  // --------------------------------------------------------------------------

  async publishEvent(
    eventType: string,
    data: Record<string, unknown>,
    _userId?: string,
  ): Promise<void> {
    if (!this.enabled || !this.client) return

    try {
      const eventMessage = {
        type: eventType,
        timestamp: new Date().toISOString(),
        data,
      }

      await this.client.sendToAll(eventMessage)

      console.debug(`📡 Event published: ${eventType}`)
    } catch (e) {
      console.error(`❌ Failed to publish event ${eventType}: ${e}`)
    }
  }

  // --------------------------------------------------------------------------
  // Session events
  // --------------------------------------------------------------------------

  async publishSessionStarted(sessionId: string, userName: string, userId?: string): Promise<void> {
    await this.publishEvent('session.started', { session_id: sessionId, user_name: userName, user_id: userId }, userId)
  }

  async publishSessionEnded(
    sessionId: string,
    userName: string,
    userId?: string,
    durationSeconds?: number,
  ): Promise<void> {
    const data: Record<string, unknown> = { session_id: sessionId, user_name: userName, user_id: userId }
    if (durationSeconds != null) data.duration_seconds = durationSeconds
    await this.publishEvent('session.ended', data, userId)
  }

  async publishSessionUpdated(
    sessionId: string,
    userId?: string,
    config?: Record<string, unknown>,
  ): Promise<void> {
    const data: Record<string, unknown> = { session_id: sessionId, user_id: userId }
    if (config) data.config = config
    await this.publishEvent('session.updated', data, userId)
  }

  // --------------------------------------------------------------------------
  // Speech events
  // --------------------------------------------------------------------------

  async publishSpeechStarted(sessionId: string, userId?: string): Promise<void> {
    await this.publishEvent(
      'input_audio_buffer.speech_started',
      { session_id: sessionId, user_id: userId },
      userId,
    )
  }

  async publishSpeechStopped(sessionId: string, userId?: string): Promise<void> {
    await this.publishEvent(
      'input_audio_buffer.speech_stopped',
      { session_id: sessionId, user_id: userId },
      userId,
    )
  }

  // --------------------------------------------------------------------------
  // Transcript events
  // --------------------------------------------------------------------------

  async publishUserTranscript(sessionId: string, transcript: string, userId?: string): Promise<void> {
    await this.publishEvent(
      'conversation.item.input_audio_transcription.completed',
      { session_id: sessionId, transcript, user_id: userId },
      userId,
    )
  }

  async publishAiTranscript(sessionId: string, transcript: string, userId?: string): Promise<void> {
    await this.publishEvent(
      'response.audio_transcript.done',
      { session_id: sessionId, transcript, user_id: userId },
      userId,
    )
  }

  // --------------------------------------------------------------------------
  // Response events
  // --------------------------------------------------------------------------

  async publishResponseCreated(sessionId: string, responseId?: string, userId?: string): Promise<void> {
    const data: Record<string, unknown> = { session_id: sessionId, user_id: userId }
    if (responseId) data.response_id = responseId
    await this.publishEvent('response.created', data, userId)
  }

  async publishResponseDone(
    sessionId: string,
    responseId?: string,
    status?: string,
    userId?: string,
  ): Promise<void> {
    const data: Record<string, unknown> = { session_id: sessionId, user_id: userId }
    if (responseId) data.response_id = responseId
    if (status) data.status = status
    await this.publishEvent('response.done', data, userId)
  }

  // --------------------------------------------------------------------------
  // Auth events
  // --------------------------------------------------------------------------

  async publishAuthenticationSucceeded(
    sessionId: string,
    userName: string,
    userId?: string,
    successful = 'successful',
  ): Promise<void> {
    await this.publishEvent(
      'authentication_succeeded',
      { session_id: sessionId, user_name: userName, user_id: userId, successful },
      userId,
    )
  }

  // --------------------------------------------------------------------------
  // Agent events
  // --------------------------------------------------------------------------

  async publishAgentInvoked(
    sessionId: string,
    userId?: string,
    agentConfig?: Record<string, unknown>,
  ): Promise<void> {
    const data: Record<string, unknown> = { session_id: sessionId, user_id: userId }
    if (agentConfig) data.agent_config = agentConfig
    await this.publishEvent('agent_invoked', data, userId)
  }

  // --------------------------------------------------------------------------
  // Function call events
  // --------------------------------------------------------------------------

  async publishFunctionCalled(
    sessionId: string,
    functionName: string,
    functionArguments?: Record<string, unknown>,
    functionOutput?: unknown,
    callId?: string,
    userId?: string,
  ): Promise<void> {
    const data: Record<string, unknown> = {
      session_id: sessionId,
      user_id: userId,
      function_name: functionName,
    }
    if (callId) data.call_id = callId
    if (functionArguments) data.function_arguments = functionArguments
    if (functionOutput != null) data.function_output = functionOutput
    await this.publishEvent('function_called', data, userId)
  }

  // --------------------------------------------------------------------------
  // Transfer events
  // --------------------------------------------------------------------------

  async publishTransferConfirmed(
    sessionId: string,
    transferDetails: Record<string, unknown>,
    confirmed = 'confirmed',
    userId?: string,
  ): Promise<void> {
    await this.publishEvent(
      'transfer_confirmed',
      { session_id: sessionId, user_id: userId, confirmed, transfer_details: transferDetails },
      userId,
    )
  }

  // --------------------------------------------------------------------------
  // RAG events
  // --------------------------------------------------------------------------

  async publishRagEmbeddingCompleted(
    sessionId: string,
    question: string,
    embeddingTimeMs: number,
    userId?: string,
  ): Promise<void> {
    await this.publishEvent(
      'rag_embedding_completed',
      { session_id: sessionId, user_id: userId, question, embedding_time_ms: embeddingTimeMs },
      userId,
    )
  }

  async publishRagVectorSearchCompleted(
    sessionId: string,
    searchTimeMs: number,
    topChunks: Record<string, unknown>[],
    userId?: string,
  ): Promise<void> {
    await this.publishEvent(
      'rag_vector_search_completed',
      { session_id: sessionId, user_id: userId, search_time_ms: searchTimeMs, top_chunks: topChunks.slice(0, 5) },
      userId,
    )
  }

  async publishRagLlmGenerationCompleted(
    sessionId: string,
    firstTokenTimeMs: number,
    totalCompletionTimeMs: number,
    answerLength: number,
    userId?: string,
  ): Promise<void> {
    await this.publishEvent(
      'rag_llm_generation_completed',
      {
        session_id: sessionId,
        user_id: userId,
        first_token_time_ms: firstTokenTimeMs,
        total_completion_time_ms: totalCompletionTimeMs,
        answer_length: answerLength,
      },
      userId,
    )
  }

  // --------------------------------------------------------------------------
  // Cleanup
  // --------------------------------------------------------------------------

  close(): void {
    console.log('✅ Event Streaming Service closed')
  }
}

// ============================================================================
// Singleton
// ============================================================================

let _eventStreamingService: EventStreamingService | null = null

export function getEventStreamingService(): EventStreamingService {
  if (!_eventStreamingService) {
    _eventStreamingService = new EventStreamingService()
  }
  return _eventStreamingService
}

export function initializeEventStreaming(
  connectionString?: string,
  hubName?: string,
): EventStreamingService {
  _eventStreamingService = new EventStreamingService(connectionString, hubName)
  return _eventStreamingService
}
