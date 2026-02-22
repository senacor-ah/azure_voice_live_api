'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { PipelineEvent, StepState } from '@/lib/types/pipeline'
import { PIPELINE_STEPS } from '@/lib/types/pipeline'

interface UsePubSubOptions {
  /** Auto-connect on mount */
  autoConnect?: boolean
}

export interface ConnectedClient {
  id: string
  name: string
  connectedAt: string
}

interface UsePubSubReturn {
  /** Current connection status */
  status: 'disconnected' | 'connecting' | 'connected'
  /** Ordered event log (newest first) */
  events: PipelineEvent[]
  /** Current state per pipeline step */
  stepStates: Record<string, StepState>
  /** Stats */
  stats: {
    totalEvents: number
    sessionsStarted: number
    sessionsEnded: number
  }
  /** Currently connected clients (keyed by clientId) */
  connectedClients: Record<string, ConnectedClient>
  /** The client whose events are shown (null = all) */
  selectedClientId: string | null
  setSelectedClientId: (id: string | null) => void
  /** Connect to PubSub */
  connect: () => void
  /** Disconnect */
  disconnect: () => void
  /** Clear event log */
  clearEvents: () => void
  /** The currently selected event (for detail view) */
  selectedEvent: PipelineEvent | null
  setSelectedEvent: (e: PipelineEvent | null) => void
}

/** How long after audio transcript done before fading starts (avatar speaks) */
const FADE_AFTER_AUDIO_MS = 5000
/** How long after response done in text mode before fading starts */
const FADE_AFTER_TEXT_MS = 1500
/** Duration of fading CSS transition before resetting to idle */
const FADE_TRANSITION_MS = 1200

export function usePubSub(url: string | null, options?: UsePubSubOptions): UsePubSubReturn {
  const { autoConnect = false } = options ?? {}

  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected')
  const [events, setEvents] = useState<PipelineEvent[]>([])
  const [stepStates, setStepStates] = useState<Record<string, StepState>>({})
  const [stats, setStats] = useState({ totalEvents: 0, sessionsStarted: 0, sessionsEnded: 0 })
  const [selectedEvent, setSelectedEvent] = useState<PipelineEvent | null>(null)
  const [connectedClients, setConnectedClients] = useState<Record<string, ConnectedClient>>({})
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)

  // Fade state: set when a response cycle ends – triggers the fade useEffect
  const [lastEndEvent, setLastEndEvent] = useState<{ mode: 'text' | 'audio'; stamp: number } | null>(null)
  // Track whether audio transcript fired in the current response cycle
  const hadAudioInCycleRef = useRef(false)

  const wsRef = useRef<WebSocket | null>(null)

  // Process an incoming event and update step states
  const processEvent = useCallback((evt: PipelineEvent) => {
    // Extract client info from data fields
    const clientId = (evt.clientId ?? evt.data?.user_id ?? evt.data?.userId ?? evt.data?.session_id) as string | undefined
    const clientName = (evt.clientName ?? evt.data?.user_name ?? evt.data?.userName ?? evt.data?.name) as string | undefined

    const enrichedEvt: PipelineEvent = {
      ...evt,
      clientId: clientId ?? evt.clientId,
      clientName: clientName ?? evt.clientName,
    }

    // Track connected clients
    if (evt.type === 'session.started' || evt.type === 'session_started') {
      if (clientId) {
        setConnectedClients((prev) => ({
          ...prev,
          [clientId]: { id: clientId, name: clientName ?? clientId, connectedAt: evt.timestamp },
        }))
      }
    }
    if (evt.type === 'session.ended' || evt.type === 'session_ended') {
      if (clientId) {
        setConnectedClients((prev) => {
          const next = { ...prev }
          delete next[clientId]
          return next
        })
        // Deselect if the active client disconnected
        setSelectedClientId((prev) => (prev === clientId ? null : prev))
      }
    }

    // ── Fade / mode detection ─────────────────────────────────────────────
    // New user turn → reset audio flag and cancel any pending fade
    if (evt.type === 'input_audio_buffer.speech_started') {
      hadAudioInCycleRef.current = false
    }
    // Avatar/audio mode: transcript done means audio was generated
    if (evt.type === 'response.audio_transcript.done') {
      hadAudioInCycleRef.current = true
      setLastEndEvent({ mode: 'audio', stamp: Date.now() })
    }
    // Text mode: response done with no prior audio transcript → text cycle
    if (evt.type === 'response.done' && !hadAudioInCycleRef.current) {
      setLastEndEvent({ mode: 'text', stamp: Date.now() })
    }
    // ──────────────────────────────────────────────────────────────────────

    setEvents((prev) => [enrichedEvt, ...prev].slice(0, 500))
    setStats((prev) => ({
      totalEvents: prev.totalEvents + 1,
      sessionsStarted: prev.sessionsStarted + (evt.type === 'session.started' || evt.type === 'session_started' ? 1 : 0),
      sessionsEnded: prev.sessionsEnded + (evt.type === 'session.ended' || evt.type === 'session_ended' ? 1 : 0),
    }))

    setStepStates((prev) => {
      const next = { ...prev }

      for (const step of PIPELINE_STEPS) {
        // Check if event completes this step
        if (step.completeEvents.includes(evt.type)) {
          next[step.id] = { status: 'success', timestamp: evt.timestamp, data: evt.data }
        }
        // Check if event triggers / starts this step
        else if (step.triggerEvents.includes(evt.type)) {
          next[step.id] = { status: 'running', timestamp: evt.timestamp, data: evt.data }
        }
      }

      return next
    })
  }, [])

  const connect = useCallback(() => {
    if (!url) {
      console.warn('[PubSub] connect() called but url is null – token not fetched yet')
      return
    }
    if (wsRef.current) {
      console.warn('[PubSub] connect() called but WebSocket already exists (readyState=%d)', wsRef.current.readyState)
      return
    }

    // Mask the access_token in logs so we don't leak it
    const maskedUrl = url.replace(/(access_token=)[^&]+/, '$1***')
    console.info('[PubSub] Connecting to %s', maskedUrl)
    setStatus('connecting')

    // Plain WebSocket – no subprotocol.
    // The backend publishes via sendToAll() which works with simple connections.
    // The json.webpubsub.azure.v1 subprotocol requires additional hub permissions
    // and causes code 1006 on hubs that are not explicitly configured for it.
    let ws: WebSocket
    try {
      ws = new WebSocket(url)
    } catch (err) {
      console.error('[PubSub] Failed to construct WebSocket:', err)
      setStatus('disconnected')
      return
    }
    wsRef.current = ws

    ws.onopen = () => {
      console.info('[PubSub] ✅ Connection opened (readyState=%d)', ws.readyState)
      setStatus('connected')
      processEvent({
        type: 'system.connected',
        timestamp: new Date().toISOString(),
        data: { message: 'Verbunden mit Azure Web PubSub' },
      })
    }

    ws.onmessage = (raw) => {
      try {
        const message = JSON.parse(raw.data as string)
        console.debug('[PubSub] ← message type=%s', message.type, message)

        // Ignore PubSub system / ack / connected messages
        if (message.type === 'system' || message.type === 'ack') {
          console.debug('[PubSub] Ignoring system/ack message')
          return
        }

        let actualEvent: PipelineEvent | null = null

        if (message.type === 'message' && message.data) {
          console.debug('[PubSub] Unwrapping Web PubSub message envelope (data field)')
          actualEvent = typeof message.data === 'string' ? JSON.parse(message.data) : message.data
        } else if (message.dataType === 'json' && message.data) {
          console.debug('[PubSub] Unwrapping dataType=json envelope')
          actualEvent = typeof message.data === 'string' ? JSON.parse(message.data) : message.data
        } else if (message.type && message.timestamp) {
          console.debug('[PubSub] Direct event format detected')
          actualEvent = message
        } else if (message.type) {
          console.debug('[PubSub] Fallback: treating whole message as event (type=%s)', message.type)
          actualEvent = message
        } else {
          console.warn('[PubSub] Unrecognised message format – could not extract event:', message)
        }

        if (actualEvent) {
          console.info('[PubSub] Processing event: %s', actualEvent.type, actualEvent)
          processEvent(actualEvent)
        }
      } catch (err) {
        console.error('[PubSub] Failed to parse message:', err, '\nRaw data:', raw.data)
      }
    }

    ws.onerror = (evt) => {
      // The browser doesn't expose a reason here for security; the close event
      // immediately follows and carries the code + reason string.
      console.error('[PubSub] ❌ WebSocket error event fired (detail will follow in onclose):', evt)
    }

    ws.onclose = (evt) => {
      const reason = evt.reason ? ` – "${evt.reason}"` : ''
      console.warn(
        '[PubSub] Connection closed. code=%d%s wasClean=%s',
        evt.code,
        reason,
        evt.wasClean,
        '\nSee https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent/code for code meanings',
      )
      // Common codes:
      //  1000 Normal closure
      //  1006 Abnormal (no close frame) – often means network error or server refused
      //  4001 Unauthorized token
      //  4004 Hub not found
      if (evt.code === 1006) {
        console.error('[PubSub] Code 1006 = abnormal closure. Likely causes: invalid token, hub not found, or CORS/network issue.')
      }
      setStatus('disconnected')
      wsRef.current = null
    }
  }, [url, processEvent])

  const disconnect = useCallback(() => {
    wsRef.current?.close()
    wsRef.current = null
  }, [])

  const clearEvents = useCallback(() => {
    setEvents([])
    setStepStates({})
    setStats({ totalEvents: 0, sessionsStarted: 0, sessionsEnded: 0 })
    setSelectedEvent(null)
    setConnectedClients({})
    setSelectedClientId(null)
    setLastEndEvent(null)
    hadAudioInCycleRef.current = false
  }, [])

  // ── Fade effect ──────────────────────────────────────────────────────────
  // Runs whenever a response cycle ends.
  // 1. After the mode-specific delay: set active nodes to 'fading'
  // 2. After the CSS transition: reset to 'idle'
  useEffect(() => {
    if (!lastEndEvent) return
    const delay = lastEndEvent.mode === 'audio' ? FADE_AFTER_AUDIO_MS : FADE_AFTER_TEXT_MS

    let idleTimer: ReturnType<typeof setTimeout> | null = null

    const fadeTimer = setTimeout(() => {
      setStepStates((prev) => {
        const next = { ...prev }
        for (const key of Object.keys(next)) {
          if (next[key].status === 'success' || next[key].status === 'running') {
            next[key] = { ...next[key], status: 'fading' }
          }
        }
        return next
      })
      idleTimer = setTimeout(() => {
        setStepStates((prev) => {
          const next = { ...prev }
          for (const key of Object.keys(next)) {
            if (next[key].status === 'fading') {
              next[key] = { ...next[key], status: 'idle' }
            }
          }
          return next
        })
        idleTimer = null
      }, FADE_TRANSITION_MS)
    }, delay)

    return () => {
      clearTimeout(fadeTimer)
      if (idleTimer) clearTimeout(idleTimer)
    }
  }, [lastEndEvent])
  // ────────────────────────────────────────────────────────────────────────

  // Auto-connect
  useEffect(() => {
    if (autoConnect && url) connect()
    return () => disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoConnect, url])

  return {
    status,
    events,
    stepStates,
    stats,
    connectedClients,
    selectedClientId,
    setSelectedClientId,
    connect,
    disconnect,
    clearEvents,
    selectedEvent,
    setSelectedEvent,
  }
}
