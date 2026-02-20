'use client'

import type { PipelineEvent } from '@/lib/types/pipeline'
import { PIPELINE_STEPS } from '@/lib/types/pipeline'
import { Clock, Zap, Hash } from 'lucide-react'

interface EventDetailPanelProps {
  events: PipelineEvent[]
  selectedEvent: PipelineEvent | null
  onSelectEvent: (e: PipelineEvent) => void
}

function getStepForEvent(eventType: string) {
  return PIPELINE_STEPS.find(
    (s) =>
      s.triggerEvents.includes(eventType) ||
      s.completeEvents.includes(eventType),
  )
}

function formatTime(ts: string) {
  try {
    return new Date(ts).toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  } catch {
    return ts
  }
}

export function EventDetailPanel({
  events,
  selectedEvent,
  onSelectEvent,
}: EventDetailPanelProps) {
  return (
    <div className="bg-white rounded-xl border border-[#e2ddf0] flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[#e2ddf0] flex items-center justify-between shrink-0">
        <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
          Event Log
        </h2>
        <span className="text-xs text-gray-400">{events.length} events</span>
      </div>

      {/* Event list + detail split */}
      <div className="flex flex-1 min-h-0">
        {/* Event list */}
        <div className="w-1/2 border-r border-[#e2ddf0] overflow-y-auto">
          {events.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Zap className="w-8 h-8 mb-2 opacity-40" />
              <p className="text-sm">Keine Events</p>
              <p className="text-xs mt-1">Warte auf PubSub-Events …</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {events.map((evt, idx) => {
                const step = getStepForEvent(evt.type)
                const isSelected = selectedEvent === evt
                return (
                  <button
                    key={`${evt.type}-${evt.timestamp}-${idx}`}
                    onClick={() => onSelectEvent(evt)}
                    className={`
                      w-full text-left px-4 py-3 hover:bg-[#f8f5ff] transition-colors
                      ${isSelected ? 'bg-[#ede9fe] border-l-2 border-[#7c3aed]' : ''}
                    `}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: step?.color ?? '#9ca3af' }}
                      />
                      <span className="text-xs font-semibold text-gray-800 truncate">
                        {evt.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 ml-4">
                      <Clock className="w-3 h-3 text-gray-300" />
                      <span className="text-[10px] text-gray-400">
                        {formatTime(evt.timestamp)}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Detail pane */}
        <div className="w-1/2 overflow-y-auto p-5">
          {selectedEvent ? (
            <div>
              <p className="text-sm font-bold text-[#7c3aed] mb-1">
                {selectedEvent.type}
              </p>
              <p className="text-xs text-gray-400 mb-4">
                {new Date(selectedEvent.timestamp).toLocaleString('de-DE')}
              </p>

              {selectedEvent.data &&
              Object.keys(selectedEvent.data).length > 0 ? (
                <div className="space-y-2">
                  {Object.entries(selectedEvent.data).map(([key, value]) => (
                    <div
                      key={key}
                      className="bg-[#f8f5ff] rounded-lg px-3 py-2"
                    >
                      <span className="text-[10px] font-semibold text-[#7c3aed] uppercase tracking-wider">
                        {key}
                      </span>
                      <p className="text-xs text-gray-700 mt-0.5 font-mono break-all">
                        {typeof value === 'object'
                          ? JSON.stringify(value, null, 2)
                          : String(value)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic">
                  Keine zusätzlichen Daten
                </p>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <Hash className="w-6 h-6 mb-2 opacity-40" />
              <p className="text-xs">Event auswählen für Details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
