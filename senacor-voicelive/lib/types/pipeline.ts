/**
 * Pipeline step definitions for the Voice Live dashboard.
 * Maps backend event types to visual pipeline steps.
 */

export type StepStatus = 'idle' | 'running' | 'success' | 'error'

export interface PipelineStep {
  id: string
  label: string
  sublabel: string
  /** Event types that activate this step */
  triggerEvents: string[]
  /** Event types that mark this step as completed */
  completeEvents: string[]
  /** Icon key */
  icon: 'session' | 'mic' | 'transcript' | 'search' | 'brain' | 'speaker' | 'calendar' | 'arrowleftright'
  /** Accent colour for the icon circle */
  color: string
}

/**
 * Pipeline layout: sequential rows, each row can have 1 or more parallel steps.
 * Rows are rendered top-to-bottom; steps within a row are rendered side-by-side.
 */
export interface PipelineRow {
  steps: PipelineStep[]
}

export interface StepState {
  status: StepStatus
  timestamp?: string
  data?: Record<string, unknown>
}

export interface PipelineEvent {
  type: string
  timestamp: string
  data?: Record<string, unknown>
  /** Client identifier extracted from the event */
  clientId?: string
  /** Human-readable client name */
  clientName?: string
}

/**
 * The ordered pipeline steps that map to our voice-session flow.
 */
export const PIPELINE_ROWS: PipelineRow[] = [
  {
    steps: [{
      id: 'speech',
      label: 'Speech Input',
      sublabel: 'Audio Detection',
      triggerEvents: ['input_audio_buffer.speech_started'],
      completeEvents: ['input_audio_buffer.speech_stopped'],
      icon: 'mic',
      color: '#1a1a2e',
    }],
  },
  {
    steps: [{
      id: 'transcription',
      label: 'Transcription',
      sublabel: 'Speech → Text',
      triggerEvents: ['conversation.item.input_audio_transcription.completed'],
      completeEvents: ['conversation.item.input_audio_transcription.completed'],
      icon: 'transcript',
      color: '#f59e0b',
    }],
  },
  {
    steps: [{
      id: 'agent',
      label: 'Agent',
      sublabel: 'Processing',
      triggerEvents: ['agent_invoked', 'function_called', 'response.created'],
      completeEvents: ['response.done'],
      icon: 'brain',
      color: '#3b82f6',
    }],
  },
  {
    steps: [
      {
        id: 'rag',
        label: 'RAG Pipeline',
        sublabel: 'Knowledge Retrieval',
        triggerEvents: ['rag_embedding_completed'],
        completeEvents: ['rag_llm_generation_completed'],
        icon: 'search',
        color: '#f59e0b',
      },
      {
        id: 'fn_appointment',
        label: 'Terminvereinbarung',
        sublabel: 'Function Call',
        triggerEvents: ['function_called_appointment', 'fn_appointment_started'],
        completeEvents: ['fn_appointment_completed'],
        icon: 'calendar',
        color: '#8b5cf6',
      },
      {
        id: 'fn_transfer',
        label: 'Überweisung',
        sublabel: 'Function Call',
        triggerEvents: ['function_called_transfer', 'fn_transfer_started'],
        completeEvents: ['fn_transfer_completed'],
        icon: 'arrowleftright',
        color: '#ec4899',
      },
    ],
  },
  {
    steps: [{
      id: 'response',
      label: 'AI Response',
      sublabel: 'Text → Speech',
      triggerEvents: ['response.audio_transcript.done'],
      completeEvents: ['response.audio_transcript.done'],
      icon: 'speaker',
      color: '#10b981',
    }],
  },
]

/** Flat list of all steps (for backwards-compat with step-state logic) */
export const PIPELINE_STEPS: PipelineStep[] = PIPELINE_ROWS.flatMap((r) => r.steps)
