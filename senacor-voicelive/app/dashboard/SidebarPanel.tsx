'use client'

import type { StepState } from '@/lib/types/pipeline'
import { PIPELINE_STEPS } from '@/lib/types/pipeline'
import { Activity, BarChart3, Settings } from 'lucide-react'

interface SidebarPanelProps {
  status: 'disconnected' | 'connecting' | 'connected'
  stats: { totalEvents: number; sessionsStarted: number; sessionsEnded: number }
  stepStates: Record<string, StepState>
  onConnect: () => void
  onDisconnect: () => void
  onClear: () => void
}

export function SidebarPanel({
  status,
  stats,
  stepStates,
  onConnect,
  onDisconnect,
  onClear,
}: SidebarPanelProps) {
  const runningStep = PIPELINE_STEPS.find(
    (s) => stepStates[s.id]?.status === 'running',
  )

  return (
    <aside className="w-[26rem] shrink-0 bg-white border-l border-[#e2ddf0] overflow-y-auto flex flex-col">
      {/* ── Scenario Usage ── */}
      <section className="px-5 py-5 border-b border-[#e2ddf0]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Scenario Usage
          </h3>
          <span className="text-[10px] text-gray-400 border border-gray-200 rounded px-2 py-0.5">
            Live
          </span>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-black text-[#7c3aed]">
              {stats.totalEvents}
            </span>
            <span className="text-xs text-gray-500">events</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-black text-[#7c3aed]">
              {stats.sessionsStarted}
            </span>
            <span className="text-xs text-gray-500">sessions</span>
          </div>
        </div>
      </section>

      {/* ── Connection / Controls ── */}
      <section className="px-5 py-5 border-b border-[#e2ddf0]">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
          Connection
        </h3>

        <div className="flex items-center gap-2 mb-4">
          <span
            className={`w-2 h-2 rounded-full ${
              status === 'connected'
                ? 'bg-emerald-500 animate-pulse'
                : status === 'connecting'
                  ? 'bg-amber-400 animate-pulse'
                  : 'bg-gray-300'
            }`}
          />
          <span className="text-xs font-semibold capitalize text-gray-700">
            {status === 'connected'
              ? 'Verbunden'
              : status === 'connecting'
                ? 'Verbinde …'
                : 'Getrennt'}
          </span>
        </div>

        <div className="flex gap-2">
          {status === 'connected' ? (
            <button
              onClick={onDisconnect}
              className="flex-1 text-xs font-semibold py-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
            >
              Trennen
            </button>
          ) : (
            <button
              onClick={onConnect}
              className="flex-1 text-xs font-semibold py-2 rounded-lg bg-[#7c3aed] text-white hover:bg-[#6d28d9] transition-colors"
            >
              Verbinden
            </button>
          )}
          <button
            onClick={onClear}
            className="text-xs font-semibold py-2 px-3 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
          >
            Reset
          </button>
        </div>
      </section>

      {/* ── Scenario Properties ── */}
      <section className="px-5 py-5 border-b border-[#e2ddf0]">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
          Scenario Properties
        </h3>
        <div className="space-y-2 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <Settings className="w-3.5 h-3.5 text-gray-400" />
            <span>Hub: <strong className="text-gray-700">conversation_events</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-3.5 h-3.5 text-gray-400" />
            <span>Pipeline Steps: <strong className="text-gray-700">{PIPELINE_STEPS.length}</strong></span>
          </div>
        </div>
      </section>

      {/* ── Currently Running ── */}
      <section className="px-5 py-5 border-b border-[#e2ddf0]">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
          Currently Running
        </h3>
        {runningStep ? (
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center animate-pulse"
              style={{ backgroundColor: runningStep.color }}
            >
              <Activity className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-800">
                {runningStep.label}
              </p>
              <p className="text-[10px] text-gray-400">
                {runningStep.sublabel}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-xs text-gray-400 italic">
            Kein Schritt wird gerade ausgeführt
          </p>
        )}
      </section>


    </aside>
  )
}
