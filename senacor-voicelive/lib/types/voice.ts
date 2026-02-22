/**
 * Type definitions for the Voice Live backend services.
 * Migrated from Python backend types.
 */

import { z } from 'zod'

// ============================================================================
// Appointment Workflow Types (from appointment_workflow.py)
// ============================================================================

export const WorkflowState = {
  IDLE: 'idle',
  FETCHING: 'fetching',
  AWAITING_SELECTION: 'awaiting_selection',
  VALIDATING: 'validating',
  CONFIRMING: 'confirming',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const

export type WorkflowState = (typeof WorkflowState)[keyof typeof WorkflowState]

/**
 * Backend-driven state machine for appointment booking.
 * The orchestrator (not the agent prompt) controls transitions.
 *
 * Flow: IDLE → FETCHING → ANNOUNCING_COUNT → AWAITING_UI_SELECTION → CONFIRMED
 */
export const AppointmentFlowState = {
  /** No appointment flow active */
  IDLE: 'appt_idle',
  /** termine_abrufen running */
  FETCHING: 'appt_fetching',
  /** Agent is announcing how many slots were found (TTS playing) */
  ANNOUNCING_COUNT: 'appt_announcing_count',
  /** termine_anzeigen sent to client, waiting for UI selection */
  AWAITING_UI_SELECTION: 'appt_awaiting_ui_selection',
  /** User selected a slot via UI, booking confirmed */
  CONFIRMED: 'appt_confirmed',
} as const

export type AppointmentFlowState = (typeof AppointmentFlowState)[keyof typeof AppointmentFlowState]

export const AppointmentDataSchema = z.object({
  id: z.string(),
  datum: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  uhrzeit: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be HH:MM'),
  verfuegbar: z.boolean().default(true),
})

export type AppointmentData = z.infer<typeof AppointmentDataSchema>

export const AdvisorInfoSchema = z.object({
  name: z.string().default('Michael Weber'),
  title: z.string().default('Senior Bankberater'),
  avatarUrl: z.string().default('/advisor-avatar.svg'),
})

export type AdvisorInfo = z.infer<typeof AdvisorInfoSchema>

export const AppointmentSelectionSchema = z.object({
  termin_id: z.string().optional().nullable(),
  datum: z.string().optional().nullable(),
  uhrzeit: z.string().optional().nullable(),
  selected: z.boolean().default(false),
})

export type AppointmentSelection = z.infer<typeof AppointmentSelectionSchema>

export const WorkflowContextSchema = z.object({
  state: z.string().default(WorkflowState.IDLE),
  appointments: z.array(AppointmentDataSchema).default([]),
  advisor: AdvisorInfoSchema.default({ name: '', title: '', avatarUrl: '' }),
  selection: AppointmentSelectionSchema.optional().nullable(),
  error: z.string().optional().nullable(),
  started_at: z.string().optional().nullable(),
  completed_at: z.string().optional().nullable(),
})

export type WorkflowContext = z.infer<typeof WorkflowContextSchema>

// ============================================================================
// Session Types (from auth_session_manager.py)
// ============================================================================

export interface UserContext {
  user_id: string
  name: string
  email: string
  roles: string[]
  tenant_id?: string
  department?: string
  phone?: string
  location?: string
  employee_id?: string
  permissions?: string[]
}

export interface SessionInfo {
  sessionId: string
  bearerToken: string
  userContext: UserContext
  expiresAt: Date
  createdAt: Date
  azureConnection?: unknown
  greetingSent?: boolean
  appointmentsCache?: AppointmentCacheData | null
  workflowContext?: WorkflowContext | null
  workflowActive: boolean
  /** Backend-driven appointment flow state machine */
  appointmentFlowState?: AppointmentFlowState
  /** Tracks total audio duration (seconds) for the current response (for drain timing) */
  responseAudioDurationSec?: number
  /** Timestamp (ms) when the first audio chunk of the current response was generated */
  responseAudioFirstChunkTime?: number
  /** Estimated total TTS duration (ms) based on transcript text length (used in avatar mode) */
  responseTranscriptTtsDurationMs?: number
  /** Timestamp (ms) when the transcript for the current response was completed */
  responseTranscriptDoneTime?: number
}

export interface AppointmentCacheData {
  advisor: AdvisorInfo
  appointments: AppointmentData[]
}

// ============================================================================
// Event Streaming Types (from event_streaming.py)
// ============================================================================

export interface StreamEvent {
  type: string
  timestamp: string
  data: Record<string, unknown>
}

export interface TransferDetails {
  recipient: string
  iban: string
  amount: number
  currency: string
  purpose?: string
}

// ============================================================================
// RAG Types (from rag_service.py)
// ============================================================================

export interface RAGQueryResult {
  success: boolean
  answer?: string
  sources?: RAGSource[]
  error?: string
}

export interface RAGSource {
  source: string
  score: number
  content: string
}

// ============================================================================
// Voice Proxy Types (from voice_proxy_handler.py)
// ============================================================================

export interface VoiceProxyConfig {
  azureEndpoint: string
  azureApiKey: string
  azureModel: string
  useAzureAiAgents: boolean
  azureAgentId: string
  azureAiProjectName: string
  enableRecording: boolean
  recordingsDir: string
  azureVoiceName: string
  azureAvatarEnabled: boolean
  azureAvatarCharacter: string
  azureAvatarStyle: string
  azureAvatarVideoWidth: number
  azureAvatarVideoHeight: number
  azureAvatarVideoBitrate: number
  azureAvatarIceUrls?: string | null
}

export interface ClientMessage {
  type: string
  [key: string]: unknown
}

export interface FunctionCallResult {
  type: 'function_call_result'
  call_id: string
  result: Record<string, unknown>
}

// ============================================================================
// API Response Types
// ============================================================================

export interface HealthResponse {
  status: string
  service: string
  active_sessions: number
}

export interface ConfigResponse {
  ws_endpoint: string
  auth_required: boolean
  auth_flow: string
}

export interface SessionStatsResponse {
  total_sessions: number
  sessions: {
    session_id: string
    user_name: string
    user_id: string
    created_at: string
    expires_at: string
  }[]
}
