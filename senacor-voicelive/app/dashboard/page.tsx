'use client'

import { useCallback, useEffect, useState } from 'react'
import { WorkflowPipeline } from './WorkflowPipeline'
import { EventDetailPanel } from './EventDetailPanel'
import { usePubSub } from './use-pubsub'

export default function DashboardPage() {
  const [pubsubUrl, setPubsubUrl] = useState<string | null>(null)
  const [activeStepId, setActiveStepId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'diagram' | 'eventlog'>('diagram')

  // Fetch PubSub URL from our API
  useEffect(() => {
    fetch('/api/pubsub-url')
      .then((r) => r.json())
      .then((d) => {
        if (d.url) setPubsubUrl(d.url)
      })
      .catch(() => {
        /* PubSub might not be configured */
      })
  }, [])

  const {
    status,
    events,
    stepStates,
    connectedClients,
    selectedClientId,
    setSelectedClientId,
    selectedEvent,
    setSelectedEvent,
  } = usePubSub(pubsubUrl, { autoConnect: true })

  const filteredEvents = selectedClientId
    ? events.filter((e) => e.clientId === selectedClientId)
    : events

  const handleStepClick = useCallback(
    (stepId: string) => {
      setActiveStepId((prev) => (prev === stepId ? null : stepId))
    },
    [],
  )

  return (
    <div className="flex flex-1 h-screen">
      {/* ── Main content area ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* ── Tabs bar ── */}
        <div className="bg-white border-b border-[#e2ddf0] px-6">
          <div className="flex items-center gap-6 py-3">
            <h1 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <span className="text-[#7c3aed]">⟲</span> Pipeline: Voice Session
            </h1>
            <div className="flex-1" />
            {/* Client badges */}
            <div className="flex items-center gap-2 flex-wrap">
              {Object.values(connectedClients).map((client) => (
                <button
                  key={client.id}
                  onClick={() =>
                    setSelectedClientId(
                      selectedClientId === client.id ? null : client.id,
                    )
                  }
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                    selectedClientId === client.id
                      ? 'bg-[#7c3aed] text-white'
                      : 'bg-[#ede9fe] text-[#7c3aed] hover:bg-[#ddd6fe]'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {client.name}
                </button>
              ))}
              {Object.keys(connectedClients).length === 0 && (
                <span className="text-xs text-gray-400 italic">Keine verbundenen Clients</span>
              )}
            </div>
            {/* Connection status pill */}
            <div
              className={`
                inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold
                ${
                  status === 'connected'
                    ? 'bg-emerald-50 text-emerald-700'
                    : status === 'connecting'
                      ? 'bg-amber-50 text-amber-700'
                      : 'bg-gray-100 text-gray-500'
                }
              `}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  status === 'connected'
                    ? 'bg-emerald-500'
                    : status === 'connecting'
                      ? 'bg-amber-400 animate-pulse'
                      : 'bg-gray-400'
                }`}
              />
              {status === 'connected'
                ? 'Live'
                : status === 'connecting'
                  ? 'Connecting'
                  : 'Offline'}
            </div>
          </div>
          {/* Sub-tabs */}
          <div className="flex items-center gap-1 -mb-px">
            <button
              onClick={() => setActiveTab('diagram')}
              className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${
                activeTab === 'diagram'
                  ? 'text-[#7c3aed] border-[#7c3aed]'
                  : 'text-gray-400 hover:text-gray-600 border-transparent'
              }`}
            >
              Diagram
            </button>
            <button
              onClick={() => setActiveTab('eventlog')}
              className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${
                activeTab === 'eventlog'
                  ? 'text-[#7c3aed] border-[#7c3aed]'
                  : 'text-gray-400 hover:text-gray-600 border-transparent'
              }`}
            >
              Event Log
            </button>
          </div>
        </div>

        {/* ── Pipeline diagram ── */}
        {activeTab === 'diagram' && (
          <div className="flex-1 p-4 min-h-0 flex flex-col">
            <WorkflowPipeline
              stepStates={stepStates}
              onStepClick={handleStepClick}
              activeStepId={activeStepId}
            />
          </div>
        )}

        {/* ── Event Log tab ── */}
        {activeTab === 'eventlog' && (
          <div className="flex-1 px-6 py-6 min-h-0 flex flex-col">
            <EventDetailPanel
              events={filteredEvents}
              selectedEvent={selectedEvent}
              onSelectEvent={setSelectedEvent}
            />
          </div>
        )}
      </div>

    </div>
  )
}
