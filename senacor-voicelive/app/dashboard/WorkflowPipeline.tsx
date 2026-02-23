'use client'

import { useCallback, useMemo } from 'react'
import {
  ReactFlow,
  Background,
  type NodeProps,
  type Node,
  type Edge,
  Handle,
  Position,
  MarkerType,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import type { StepState } from '@/lib/types/pipeline'
import {
  Mic, FileText, Brain, Volume2, Search, Calendar,
  ArrowLeftRight, Radio, Smartphone, Cloud, Server, Plug, Cog,
} from 'lucide-react'

const ICONS: Record<string, React.FC<{ className?: string }>> = {
  mic: Mic, transcript: FileText, brain: Brain, speaker: Volume2,
  search: Search, calendar: Calendar, arrowleftright: ArrowLeftRight,
  voicelive: Radio, smartphone: Smartphone, cloud: Cloud,
  server: Server, plug: Plug, cog: Cog,
}

/* ═══════════════════════════════════════════════════════════════════════════
   Zone node – modern frosted-glass region label
   ═══════════════════════════════════════════════════════════════════════════ */
type ZoneData = {
  label: string
  icon: string
  accent: string   // gradient-from color
  accent2: string  // gradient-to color
}

function ZoneNode({ data }: NodeProps<Node<ZoneData>>) {
  return (
    <div className="w-full h-full pointer-events-none flex flex-col">
      {/* subtle gradient background */}
      <div
        className="absolute inset-0 rounded-3xl opacity-[0.045]"
        style={{
          background: `linear-gradient(135deg, ${data.accent}, ${data.accent2})`,
        }}
      />
      {/* top label bar */}
      <div className="relative z-10 flex items-center gap-2 px-5 pt-4 pb-2">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{
            background: `linear-gradient(135deg, ${data.accent}, ${data.accent2})`,
          }}
        >
          {(() => {
            const Icon = ICONS[data.icon] ?? Cloud
            return <Icon className="w-3.5 h-3.5 text-white" />
          })()}
        </div>
        <span
          className="text-[11px] font-semibold tracking-wide"
          style={{ color: data.accent }}
        >
          {data.label}
        </span>
      </div>
      {/* dashed border */}
      <div
        className="absolute inset-0 rounded-3xl border border-dashed opacity-25"
        style={{ borderColor: data.accent }}
      />
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   Step node – modern card with gradient icon
   ═══════════════════════════════════════════════════════════════════════════ */
type StepData = {
  label: string
  sublabel: string
  icon: string
  color: string
  color2: string
  status: 'idle' | 'running' | 'success' | 'error' | 'fading'
  isSelected: boolean
  width?: number
}

function StepNode({ data }: NodeProps<Node<StepData>>) {
  const { label, sublabel, icon, color, color2, status, isSelected, width } = data
  const Icon = ICONS[icon] ?? Radio
  const active = status === 'running' || status === 'success'
  const fading = status === 'fading'

  return (
    <div
      className={`flex flex-col items-center select-none group transition-opacity ${
        fading ? 'duration-[1200ms]' : 'duration-300'
      }`}
      style={{ ...(width ? { width } : {}), opacity: fading ? 0.35 : 1 }}
    >
      {/* 8 invisible handles */}
      <Handle type="target"  position={Position.Left}   id="tgt-left"   className="!opacity-0 !w-1 !h-1" />
      <Handle type="target"  position={Position.Right}  id="tgt-right"  className="!opacity-0 !w-1 !h-1" />
      <Handle type="target"  position={Position.Top}    id="tgt-top"    className="!opacity-0 !w-1 !h-1" />
      <Handle type="target"  position={Position.Bottom} id="tgt-bottom" className="!opacity-0 !w-1 !h-1" />
      <Handle type="source"  position={Position.Left}   id="src-left"   className="!opacity-0 !w-1 !h-1" />
      <Handle type="source"  position={Position.Right}  id="src-right"  className="!opacity-0 !w-1 !h-1" />
      <Handle type="source"  position={Position.Top}    id="src-top"    className="!opacity-0 !w-1 !h-1" />
      <Handle type="source"  position={Position.Bottom} id="src-bottom" className="!opacity-0 !w-1 !h-1" />

      {/* card */}
      <div
        className={`
          relative flex flex-col items-center gap-2.5 px-5 py-4 rounded-2xl w-full
          backdrop-blur-sm transition-all duration-300 cursor-pointer
          ${active
            ? 'bg-white/90 shadow-lg shadow-black/[0.06]'
            : 'bg-white/60 shadow-md shadow-black/[0.03]'}
          ${isSelected
            ? 'ring-2 scale-[1.04]'
            : 'hover:shadow-lg hover:shadow-black/[0.08] hover:scale-[1.02]'}
        `}
        style={{
          ...(isSelected ? { ringColor: color } : {}),
          border: `1px solid ${active ? color + '30' : 'rgba(0,0,0,0.06)'}`,
        }}
      >
        {/* status pill – hidden while fading out */}
        {status === 'running' && (
          <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
            <span className="flex items-center gap-1 text-[9px] font-semibold text-white px-2.5 py-0.5 rounded-full shadow-sm animate-pulse"
              style={{ background: `linear-gradient(135deg, ${color}, ${color2})` }}>
              <span className="w-1.5 h-1.5 rounded-full bg-white/80 animate-ping" />
              Aktiv
            </span>
          </div>
        )}
        {status === 'success' && (
          <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
            <span className="text-[9px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full shadow-sm">
              ✓ Fertig
            </span>
          </div>
        )}
        {status === 'error' && (
          <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
            <span className="text-[9px] font-semibold text-red-600 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-full shadow-sm">
              Fehler
            </span>
          </div>
        )}
        {status === 'fading' && (
          <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
            <span className="text-[9px] font-semibold text-gray-400 bg-gray-50 border border-gray-200 px-2.5 py-0.5 rounded-full shadow-sm">
              ✓ Fertig
            </span>
          </div>
        )}

        {/* icon circle with gradient */}
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300
            ${status === 'running' ? 'animate-pulse' : ''}
          `}
          style={{
            background: active
              ? `linear-gradient(135deg, ${color}, ${color2})`
              : 'linear-gradient(135deg, #e5e7eb, #d1d5db)',
            boxShadow: active ? `0 4px 14px ${color}40` : 'none',
          }}
        >
          <Icon className={`w-5.5 h-5.5 ${active ? 'text-white' : 'text-gray-400'}`} />
        </div>

        {/* text */}
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-[11px] font-semibold text-gray-800 text-center leading-tight whitespace-nowrap">
            {label}
          </span>
          <span className="text-[9px] text-gray-400 text-center leading-tight whitespace-nowrap">
            {sublabel}
          </span>
        </div>
      </div>
    </div>
  )
}

const nodeTypes = { zone: ZoneNode, step: StepNode }

/* ═══════════════════════════════════════════════════════════════════════════
   Edge builders
   ═══════════════════════════════════════════════════════════════════════════ */
function fwd(
  id: string, src: string, tgt: string,
  color: string, active: boolean
): Edge {
  const c = active ? color : '#6b7280'
  return {
    id, source: src, sourceHandle: 'src-right', target: tgt, targetHandle: 'tgt-left',
    type: 'smoothstep',
    animated: active,
    style: { stroke: c, strokeWidth: active ? 3 : 2, opacity: active ? 1 : 0.7 },
    markerEnd: { type: MarkerType.ArrowClosed, color: c, width: 22, height: 22 },
  }
}

function ret(
  id: string,
  src: string, srcH: string,
  tgt: string, tgtH: string,
  color: string, active: boolean,
  label?: string
): Edge {
  const c = active ? color : '#6b7280'
  return {
    id, source: src, sourceHandle: srcH, target: tgt, targetHandle: tgtH,
    type: 'smoothstep',
    animated: active,
    ...(label ? {
      label,
      labelStyle: { fontSize: 9, fontWeight: 500, fill: active ? color : '#a1a1aa' },
      labelBgStyle: { fill: '#fafafa', fillOpacity: 0.9, rx: 4 },
      labelBgPadding: [4, 6] as [number, number],
    } : {}),
    style: { stroke: c, strokeWidth: 2.5, strokeDasharray: '6 4', opacity: active ? 1 : 0.65 },
    markerEnd: { type: MarkerType.ArrowClosed, color: c, width: 18, height: 18 },
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   Build the graph
   ═══════════════════════════════════════════════════════════════════════════ */
function buildGraph(
  stepStates: Record<string, StepState>,
  activeStepId: string | null | undefined
) {
  const st = (id: string): StepData['status'] => stepStates[id]?.status ?? 'idle'
  const on = (id: string) => st(id) === 'running' || st(id) === 'success'

  const nodes: Node[] = [
    /* ── zone backgrounds ── */
    {
      id: 'zone-device', type: 'zone',
      position: { x: 0, y: 0 },
      selectable: false, draggable: false,
      style: { width: 190, height: 780, zIndex: -1, pointerEvents: 'none' } as React.CSSProperties,
      data: { label: 'Kundengerät', icon: 'smartphone', accent: '#6b7280', accent2: '#374151' },
    },
    {
      id: 'zone-backend', type: 'zone',
      position: { x: 230, y: 0 },
      selectable: false, draggable: false,
      style: { width: 1460, height: 580, zIndex: -1, pointerEvents: 'none' } as React.CSSProperties,
      data: { label: 'Azure Zone', icon: 'cloud', accent: '#7c3aed', accent2: '#4f46e5' },
    },
    {
      id: 'zone-onprem', type: 'zone',
      position: { x: 230, y: 600 },
      selectable: false, draggable: false,
      style: { width: 1460, height: 180, zIndex: -1, pointerEvents: 'none' } as React.CSSProperties,
      data: { label: 'OnPrem Systeme', icon: 'server', accent: '#16a34a', accent2: '#22c55e' },
    },
  ]

  /* ── step definitions with dual-tone gradients ── */
  const stepDefs: Array<{
    id: string; label: string; sublabel: string
    icon: string; color: string; color2: string
    x: number; y: number; width?: number
  }> = [
    { id: 'speech',         label: 'Speech Input',       sublabel: 'Spracheingabe',       icon: 'mic',            color: '#334155', color2: '#1e293b', x: 20,  y: 225, width: 150 },
    { id: 'response',       label: 'Speech Response',    sublabel: 'Sprachausgabe',       icon: 'speaker',        color: '#059669', color2: '#10b981', x: 20,  y: 430, width: 150 },
    { id: 'handler',        label: 'Handler',            sublabel: 'Request Handler',     icon: 'cog',            color: '#475569', color2: '#334155', x: 280, y: 225 },
    { id: 'voicelive',      label: 'VoiceLive API',      sublabel: 'Azure Realtime',      icon: 'voicelive',      color: '#7c3aed', color2: '#6d28d9', x: 440, y: 225 },
    { id: 'transcription',  label: 'Transcription',      sublabel: 'Speech-to-Text',      icon: 'transcript',     color: '#d97706', color2: '#f59e0b', x: 600, y: 225 },
    { id: 'agent',          label: 'Agent',              sublabel: 'Intent & Orchestration', icon: 'brain',       color: '#2563eb', color2: '#3b82f6', x: 760, y: 225 },
    { id: 'rag',            label: 'RAG Pipeline',       sublabel: 'Wissensabfrage',      icon: 'search',         color: '#d97706', color2: '#f59e0b', x: 1120, y: 55  },
    { id: 'fn_appointment', label: 'Terminvereinbarung', sublabel: 'Function Call',       icon: 'calendar',       color: '#7c3aed', color2: '#8b5cf6', x: 1300, y: 225 },
    { id: 'fn_transfer',    label: 'Überweisung',        sublabel: 'Function Call',       icon: 'arrowleftright', color: '#db2777', color2: '#ec4899', x: 1120, y: 395 },
    { id: 'kunden_api',      label: 'Kunden API',         sublabel: 'OnPrem Integration',  icon: 'plug',           color: '#16a34a', color2: '#22c55e', x: 440, y: 640 },
    { id: 'transaction_api',  label: 'Transaktions API',   sublabel: 'OnPrem Integration',  icon: 'plug',           color: '#16a34a', color2: '#22c55e', x: 1120, y: 640 },
    { id: 'terminierung_api', label: 'Terminierungs API',  sublabel: 'OnPrem Integration',  icon: 'plug',           color: '#16a34a', color2: '#22c55e', x: 1300, y: 640 },
  ]

  for (const s of stepDefs) {
    nodes.push({
      id: s.id, type: 'step',
      position: { x: s.x, y: s.y },
      ...(s.width ? { style: { width: s.width } as React.CSSProperties } : {}),
      data: {
        label: s.label, sublabel: s.sublabel,
        icon: s.icon, color: s.color, color2: s.color2,
        status: st(s.id), isSelected: activeStepId === s.id,
        ...(s.width ? { width: s.width } : {}),
      },
    })
  }

  /* ── edges ── */
  const edges: Edge[] = [
    // Forward path: speech → handler → voicelive → transcription → agent
    fwd('e0', 'speech',        'handler',        '#475569', on('speech')),
    fwd('e1', 'handler',       'voicelive',      '#475569', on('handler')),
    fwd('e2', 'voicelive',     'transcription',  '#7c3aed', on('voicelive')),
    fwd('e3', 'transcription', 'agent',          '#d97706', on('transcription')),
    // Agent ↔ function calls (bidirectional)
    {
      id: 'e4', source: 'agent', sourceHandle: 'src-right',
      target: 'rag', targetHandle: 'tgt-left',
      type: 'smoothstep', animated: on('agent') || on('rag'),
      style: { stroke: on('agent') || on('rag') ? '#2563eb' : '#6b7280', strokeWidth: on('agent') || on('rag') ? 3 : 2, opacity: on('agent') || on('rag') ? 1 : 0.7 },
      markerStart: { type: MarkerType.ArrowClosed, color: on('agent') || on('rag') ? '#2563eb' : '#6b7280', width: 22, height: 22 },
      markerEnd:   { type: MarkerType.ArrowClosed, color: on('agent') || on('rag') ? '#2563eb' : '#6b7280', width: 22, height: 22 },
    },
    {
      id: 'e5', source: 'agent', sourceHandle: 'src-right',
      target: 'fn_appointment', targetHandle: 'tgt-left',
      type: 'smoothstep', animated: on('agent') || on('fn_appointment'),
      style: { stroke: on('agent') || on('fn_appointment') ? '#2563eb' : '#6b7280', strokeWidth: on('agent') || on('fn_appointment') ? 3 : 2, opacity: on('agent') || on('fn_appointment') ? 1 : 0.7 },
      markerStart: { type: MarkerType.ArrowClosed, color: on('agent') || on('fn_appointment') ? '#2563eb' : '#6b7280', width: 22, height: 22 },
      markerEnd:   { type: MarkerType.ArrowClosed, color: on('agent') || on('fn_appointment') ? '#2563eb' : '#6b7280', width: 22, height: 22 },
    },
    {
      id: 'e6', source: 'agent', sourceHandle: 'src-right',
      target: 'fn_transfer', targetHandle: 'tgt-left',
      type: 'smoothstep', animated: on('agent') || on('fn_transfer'),
      style: { stroke: on('agent') || on('fn_transfer') ? '#2563eb' : '#6b7280', strokeWidth: on('agent') || on('fn_transfer') ? 3 : 2, opacity: on('agent') || on('fn_transfer') ? 1 : 0.7 },
      markerStart: { type: MarkerType.ArrowClosed, color: on('agent') || on('fn_transfer') ? '#2563eb' : '#6b7280', width: 22, height: 22 },
      markerEnd:   { type: MarkerType.ArrowClosed, color: on('agent') || on('fn_transfer') ? '#2563eb' : '#6b7280', width: 22, height: 22 },
    },
    // Handler ↔ Kunden API (bidirectional)
    {
      id: 'e-api', source: 'handler', sourceHandle: 'src-bottom',
      target: 'kunden_api', targetHandle: 'tgt-top',
      type: 'smoothstep', animated: on('handler') || on('kunden_api'),
      style: { stroke: on('handler') || on('kunden_api') ? '#475569' : '#6b7280', strokeWidth: 2.5, strokeDasharray: '6 4', opacity: on('handler') || on('kunden_api') ? 1 : 0.7 },
      markerStart: { type: MarkerType.ArrowClosed, color: on('handler') || on('kunden_api') ? '#475569' : '#6b7280', width: 18, height: 18 },
      markerEnd:   { type: MarkerType.ArrowClosed, color: on('handler') || on('kunden_api') ? '#475569' : '#6b7280', width: 18, height: 18 },
    },
    // Terminvereinbarung ↔ Terminierungs API (bidirectional)
    {
      id: 'e-term', source: 'fn_appointment', sourceHandle: 'src-bottom',
      target: 'terminierung_api', targetHandle: 'tgt-top',
      type: 'smoothstep', animated: on('fn_appointment') || on('terminierung_api'),
      style: { stroke: on('fn_appointment') || on('terminierung_api') ? '#7c3aed' : '#6b7280', strokeWidth: 2.5, strokeDasharray: '6 4', opacity: on('fn_appointment') || on('terminierung_api') ? 1 : 0.7 },
      markerStart: { type: MarkerType.ArrowClosed, color: on('fn_appointment') || on('terminierung_api') ? '#7c3aed' : '#6b7280', width: 18, height: 18 },
      markerEnd:   { type: MarkerType.ArrowClosed, color: on('fn_appointment') || on('terminierung_api') ? '#7c3aed' : '#6b7280', width: 18, height: 18 },
    },
    // Überweisung ↔ Transaktions API (bidirectional)
    {
      id: 'e-tx', source: 'fn_transfer', sourceHandle: 'src-bottom',
      target: 'transaction_api', targetHandle: 'tgt-top',
      type: 'smoothstep', animated: on('fn_transfer') || on('transaction_api'),
      style: { stroke: on('fn_transfer') || on('transaction_api') ? '#db2777' : '#6b7280', strokeWidth: 2.5, strokeDasharray: '6 4', opacity: on('fn_transfer') || on('transaction_api') ? 1 : 0.7 },
      markerStart: { type: MarkerType.ArrowClosed, color: on('fn_transfer') || on('transaction_api') ? '#db2777' : '#6b7280', width: 18, height: 18 },
      markerEnd:   { type: MarkerType.ArrowClosed, color: on('fn_transfer') || on('transaction_api') ? '#db2777' : '#6b7280', width: 18, height: 18 },
    },
    // Completion: agent → voicelive
    ret('e10', 'agent',     'src-bottom', 'voicelive',  'tgt-bottom', '#2563eb', on('agent'), 'Completion'),
    // VoiceLive → Speech Response (WebRTC)
    ret('e11', 'voicelive', 'src-left', 'response', 'tgt-right', '#059669', on('voicelive'), 'WebRTC'),
  ]

  return { nodes, edges }
}

/* ═══════════════════════════════════════════════════════════════════════════
   Exported component
   ═══════════════════════════════════════════════════════════════════════════ */
interface WorkflowPipelineProps {
  stepStates: Record<string, StepState>
  onStepClick?: (stepId: string) => void
  activeStepId?: string | null
}

export function WorkflowPipeline({
  stepStates, onStepClick, activeStepId,
}: WorkflowPipelineProps) {
  const { nodes, edges } = useMemo(
    () => buildGraph(stepStates, activeStepId),
    [stepStates, activeStepId]
  )

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (node.type === 'step') onStepClick?.(node.id)
    },
    [onStepClick]
  )

  return (
    <div className="h-full w-full overflow-hidden rounded-2xl bg-gradient-to-br from-gray-50/80 to-white border border-black/[0.04]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={onNodeClick}
        fitView
        fitViewOptions={{ padding: 0.08 }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnDrag={false}
        zoomOnScroll={false}
        zoomOnPinch={false}
        preventScrolling={false}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#e4e4e7" gap={28} size={0.8} />
      </ReactFlow>
    </div>
  )
}
