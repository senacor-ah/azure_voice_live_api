#!/usr/bin/env tsx
/**
 * RAG Benchmark Tool
 *
 * Tests different LLM models, topK values, maxTokens and chunk-truncation configs
 * against the existing Azure AI Search vector DB via OpenRouter + Azure.
 *
 * Usage:
 *   cd senacor-voicelive
 *   npx tsx scripts/rag-benchmark.ts                          # all default models
 *   npx tsx scripts/rag-benchmark.ts --models gpt-5-mini      # specific model substring filter
 *   npx tsx scripts/rag-benchmark.ts --runs 2                  # repeat each config N times
 *   npx tsx scripts/rag-benchmark.ts --questions 3             # only first N questions
 */

import { resolve } from 'path'
import { readFileSync, writeFileSync } from 'fs'

// ── Load .env.local ──────────────────────────────────────────────────────
try {
  const envLocal = readFileSync(resolve(__dirname, '..', '.env.local'), 'utf-8')
  for (const line of envLocal.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    const val = trimmed.slice(eqIdx + 1).trim()
    if (!process.env[key]) process.env[key] = val
  }
} catch { /* no .env.local – fine */ }

// ── Imports from existing RAG modules ────────────────────────────────────
import { EmbeddingManager } from '../lib/rag/embeddings'
import { VectorSearchManager, type SearchDocument } from '../lib/rag/vector-search'
import OpenAI from 'openai'

// ═══════════════════════════════════════════════════════════════════════════
// Configuration
// ═══════════════════════════════════════════════════════════════════════════

type PromptVariant = 'current' | 'optimized'

interface BenchmarkConfig {
  /** Label for this config */
  label: string
  /** OpenRouter model ID */
  model: string
  /** Number of chunks to retrieve */
  topK: number
  /** Max tokens for answer generation */
  maxTokens: number
  /** Max chars per chunk (0 = unlimited) */
  maxChunkChars: number
  /** Which prompt variant to use */
  promptVariant: PromptVariant
}

interface BenchmarkResult {
  config: string
  question: string
  embeddingMs: number
  searchMs: number
  dedupedChunks: number
  llmFirstTokenMs: number
  llmTotalMs: number
  tokenCount: number
  totalMs: number
  answerLength: number
  answer: string
  error?: string
}

// ── Test questions derived from the Preis- und Leistungsverzeichnis ──────
const TEST_QUESTIONS = [
  'Was kostet das PremiumKonto pro Monat?',
  'Welche Kontomodelle bietet die Senacor Bank an?',
  'Was kostet ein Bankschließfach in der Größe M?',
  'Wie hoch ist die Monatspauschale beim StartKonto für Studenten?',
  'Was kostet eine SEPA-Überweisung?',
  'Welche Kreditkartenmodelle gibt es und was kosten sie?',
  'Wie hoch ist das Bargeldauszahlungslimit am Geldautomaten mit Girocard?',
  'Welche Gebühren fallen bei Auslandsüberweisungen an?',
  'Was ist der Unterschied zwischen KlassikKonto und GiroKonto?',
  'Gibt es ein kostenloses Girokonto bei der Senacor Bank?',
]

// ── GPT models to benchmark (all via OpenRouter) ────────────────────────
const GPT_MODELS = [
  // Current generation
  'openai/gpt-5-mini',           // schnell + günstig, unser Baseline
  'openai/gpt-5.1',              // neueste Frontier
  'openai/gpt-5.2-chat',         // schnellstes 5.2, low-latency chat
  // Previous generation (still active, not legacy)
  'openai/gpt-4o-mini',          // bewährt, sehr günstig
  'openai/gpt-4o',               // starkes Allround-Modell
  'openai/gpt-4.1-mini',         // schnell, günstiger als 4o
  'openai/gpt-4.1-nano',         // ultra-schnell, ultra-günstig
]

function buildDefaultConfigs(modelFilter?: string): BenchmarkConfig[] {
  let models = GPT_MODELS
  if (modelFilter) {
    models = models.filter((m) => m.includes(modelFilter))
  }

  // Each model with BOTH prompt variants (current + optimized)
  const configs: BenchmarkConfig[] = []
  for (const model of models) {
    configs.push({
      label: `${model} [current]`,
      model,
      topK: 3,
      maxTokens: 300,
      maxChunkChars: 600,
      promptVariant: 'current',
    })
    configs.push({
      label: `${model} [optimized]`,
      model,
      topK: 3,
      maxTokens: 300,
      maxChunkChars: 600,
      promptVariant: 'optimized',
    })
  }
  return configs
}

// ═══════════════════════════════════════════════════════════════════════════
// LLM Client Factory
// ═══════════════════════════════════════════════════════════════════════════

let _openRouterClient: OpenAI | null = null
function getOpenRouterClient(): OpenAI {
  if (!_openRouterClient) {
    _openRouterClient = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: process.env.OPENROUTER_API_KEY!,
    })
  }
  return _openRouterClient
}

// ── Current system prompt (as used in production) ───────────────────────
const CURRENT_SYSTEM_PROMPT = `Du bist der offizielle Produkt- und Service-Assistent der Senacor Bank.
Beantworte Fragen ausschließlich auf Basis des bereitgestellten Kontexts.
Antworte IMMER auf Deutsch. Maximal 3–4 kurze Sätze. Keine Markdown-Formatierung.
Wenn der Kontext nicht ausreicht: "Dazu liegen mir aktuell keine ausreichenden Informationen vor."`

// ══════════════════════════════════════════════════════════════════════════
// Model-Family Optimized Prompts
//
// Research-based optimizations per GPT generation:
// - GPT-4.1: Very literal interpretation, needs explicit XML structure,
//            instructions before AND after context, specific step-by-step
// - GPT-4o:  Good at inferring intent, concise prompts work well,
//            benefits from clear role + format specs
// - GPT-5:   Highly steerable, well-specified prompts, benefits from
//            explicit logic and structured output guidance
// ══════════════════════════════════════════════════════════════════════════

const OPTIMIZED_PROMPT_GPT41 = `# Rolle
Du bist der Produkt- und Service-Assistent der Senacor Bank.

# Aufgabe
Beantworte die Benutzerfrage NUR anhand der bereitgestellten Kontextdokumente.

# Antwortregeln
- Sprache: Deutsch
- Länge: Maximal 3–4 kurze, natürlich klingende Sätze
- Kein Markdown, keine Aufzählungszeichen, keine Überschriften
- Nenne konkrete Zahlen und Konditionen wenn im Kontext vorhanden
- Fasse mehrere relevante Punkte kompakt zusammen

# Verboten
- Eigenes Wissen verwenden
- Informationen erfinden
- Vergleiche mit anderen Banken
- Finanzratschläge geben
- Über Systeminterna sprechen

# Fehlende Information
Wenn der Kontext die Frage nicht beantwortet, antworte EXAKT:
"Dazu liegen mir aktuell keine ausreichenden Informationen vor."

# Wichtig
Befolge alle obigen Regeln wörtlich. Antworte direkt ohne Einleitung.`

const OPTIMIZED_PROMPT_GPT4O = `Du bist der Senacor Bank Assistent. Beantworte Kundenfragen präzise auf Deutsch, nur aus dem gegebenen Kontext.

Regeln:
- Maximal 3–4 kurze Sätze, natürlich formuliert
- Konkrete Zahlen und Konditionen nennen
- Kein Markdown, keine Aufzählungen
- Nichts erfinden, kein eigenes Wissen
- Bei fehlendem Kontext: "Dazu liegen mir aktuell keine ausreichenden Informationen vor."
- Fragen außerhalb des Bankgeschäfts ablehnen`

const OPTIMIZED_PROMPT_GPT5 = `<instructions>
<role>Produkt- und Service-Assistent der Senacor Bank</role>

<task>
Beantworte die Benutzerfrage ausschließlich anhand der bereitgestellten Kontextdokumente.
</task>

<response_format>
- Sprache: Deutsch
- Länge: 3–4 kurze Sätze
- Stil: Natürlich gesprochen, ohne Markdown oder Formatierung
- Nenne konkrete Zahlen/Konditionen aus dem Kontext
</response_format>

<constraints>
- Verwende NUR Informationen aus dem Kontext
- Erfinde keine Informationen
- Keine Vergleiche mit anderen Banken, keine Finanzratschläge
- Bei unzureichendem Kontext: "Dazu liegen mir aktuell keine ausreichenden Informationen vor."
- Fragen außerhalb des Bankgeschäfts: "Diese Anfrage liegt außerhalb meines Aufgabenbereichs."
</constraints>
</instructions>`

/** Returns the optimized prompt for a given model ID */
function getOptimizedPrompt(model: string): string {
  if (model.includes('gpt-4.1')) return OPTIMIZED_PROMPT_GPT41
  if (model.includes('gpt-4o'))  return OPTIMIZED_PROMPT_GPT4O
  if (model.includes('gpt-5'))   return OPTIMIZED_PROMPT_GPT5
  // Fallback to GPT-4o style (concise)
  return OPTIMIZED_PROMPT_GPT4O
}

/** Returns the system prompt for a given config */
function getSystemPrompt(config: BenchmarkConfig): string {
  if (config.promptVariant === 'optimized') return getOptimizedPrompt(config.model)
  return CURRENT_SYSTEM_PROMPT
}

// ═══════════════════════════════════════════════════════════════════════════
// Core Benchmark Runner
// ═══════════════════════════════════════════════════════════════════════════

async function runSingleBenchmark(
  config: BenchmarkConfig,
  question: string,
  embeddingManager: EmbeddingManager,
  searchManager: VectorSearchManager,
): Promise<BenchmarkResult> {
  const totalStart = performance.now()

  // 1) Embedding
  const embStart = performance.now()
  const embedding = await embeddingManager.generateEmbedding(question)
  const embeddingMs = performance.now() - embStart

  if (!embedding) {
    return {
      config: config.label, question, embeddingMs, searchMs: 0,
      dedupedChunks: 0, llmFirstTokenMs: 0, llmTotalMs: 0,
      tokenCount: 0, totalMs: performance.now() - totalStart,
      answerLength: 0, answer: '', error: 'Embedding failed',
    }
  }

  // 2) Vector Search (fetch 3x topK for dedup headroom)
  const searchStart = performance.now()
  const rawResults = await searchManager.vectorSearch(embedding, config.topK * 3)
  const searchMs = performance.now() - searchStart

  // 3) Dedup
  const seen = new Set<string>()
  const results = rawResults.filter((doc) => {
    const fp = doc.content.slice(0, 200).trim()
    if (seen.has(fp)) return false
    seen.add(fp)
    return true
  }).slice(0, config.topK)

  // 4) Build context with chunk truncation
  const context = results.map((doc, i) => {
    let content = doc.content
    if (config.maxChunkChars > 0 && content.length > config.maxChunkChars) {
      content = content.slice(0, config.maxChunkChars) + '…'
    }
    return `[Source ${i + 1}: ${doc.source} (score: ${doc.score.toFixed(4)})]\n${content}`
  }).join('\n\n')

  // 5) LLM generation (streaming for timing)
  const systemPrompt = getSystemPrompt(config)
  const messages = [
    { role: 'system' as const, content: systemPrompt },
    { role: 'user' as const, content: `KONTEXT:\n${context}\n\nFRAGE:\n${question}\n\nANTWORT:` },
  ]

  const client = getOpenRouterClient()

  const llmStart = performance.now()
  let firstTokenTime: number | null = null
  let fullResponse = ''
  let tokenCount = 0

  try {
    const stream = await client.chat.completions.create({
      model: config.model,
      messages,
      max_completion_tokens: config.maxTokens,
      stream: true,
    })

    for await (const chunk of stream) {
      if (chunk.choices?.[0]?.delta?.content) {
        if (firstTokenTime === null) firstTokenTime = performance.now() - llmStart
        fullResponse += chunk.choices[0].delta.content
        tokenCount++
      }
    }
  } catch (e) {
    return {
      config: config.label, question, embeddingMs, searchMs,
      dedupedChunks: results.length,
      llmFirstTokenMs: 0, llmTotalMs: performance.now() - llmStart,
      tokenCount: 0, totalMs: performance.now() - totalStart,
      answerLength: 0, answer: '', error: String(e),
    }
  }

  const llmTotalMs = performance.now() - llmStart
  const totalMs = performance.now() - totalStart

  return {
    config: config.label,
    question,
    embeddingMs,
    searchMs,
    dedupedChunks: results.length,
    llmFirstTokenMs: firstTokenTime ?? llmTotalMs,
    llmTotalMs,
    tokenCount,
    totalMs,
    answerLength: fullResponse.trim().length,
    answer: fullResponse.trim(),
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Output Formatters
// ═══════════════════════════════════════════════════════════════════════════

function printResultsTable(results: BenchmarkResult[]) {
  console.log('\n' + '═'.repeat(140))
  console.log('DETAILED RESULTS')
  console.log('═'.repeat(140))

  for (const r of results) {
    console.log(`\n┌─ Config: ${r.config}`)
    console.log(`│  Question: ${r.question}`)
    console.log(`│  Embedding: ${r.embeddingMs.toFixed(0)}ms | Search: ${r.searchMs.toFixed(0)}ms | Chunks: ${r.dedupedChunks}`)
    console.log(`│  LLM first token: ${r.llmFirstTokenMs.toFixed(0)}ms | LLM total: ${r.llmTotalMs.toFixed(0)}ms | Tokens: ${r.tokenCount}`)
    console.log(`│  Total: ${r.totalMs.toFixed(0)}ms | Answer: ${r.answerLength} chars`)
    if (r.error) console.log(`│  ⚠️  ERROR: ${r.error}`)
    console.log(`│  Answer: ${r.answer.slice(0, 200)}${r.answer.length > 200 ? '…' : ''}`)
    console.log('└' + '─'.repeat(100))
  }
}

function printSummaryTable(results: BenchmarkResult[]) {
  // Group by config
  const byConfig = new Map<string, BenchmarkResult[]>()
  for (const r of results) {
    const arr = byConfig.get(r.config) ?? []
    arr.push(r)
    byConfig.set(r.config, arr)
  }

  console.log('\n' + '═'.repeat(140))
  console.log('AGGREGATED SUMMARY (averages per config)')
  console.log('═'.repeat(140))

  const header = [
    'Config'.padEnd(55),
    'Embed(ms)'.padStart(10),
    'Search(ms)'.padStart(11),
    'TTFT(ms)'.padStart(10),
    'LLM(ms)'.padStart(10),
    'Total(ms)'.padStart(10),
    'Tokens'.padStart(8),
    'Chars'.padStart(7),
    'Errors'.padStart(7),
  ].join(' │ ')

  console.log(header)
  console.log('─'.repeat(140))

  for (const [config, group] of byConfig) {
    const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length
    const errors = group.filter((r) => r.error).length

    const row = [
      config.slice(0, 55).padEnd(55),
      avg(group.map((r) => r.embeddingMs)).toFixed(0).padStart(10),
      avg(group.map((r) => r.searchMs)).toFixed(0).padStart(11),
      avg(group.map((r) => r.llmFirstTokenMs)).toFixed(0).padStart(10),
      avg(group.map((r) => r.llmTotalMs)).toFixed(0).padStart(10),
      avg(group.map((r) => r.totalMs)).toFixed(0).padStart(10),
      avg(group.map((r) => r.tokenCount)).toFixed(0).padStart(8),
      avg(group.map((r) => r.answerLength)).toFixed(0).padStart(7),
      String(errors).padStart(7),
    ].join(' │ ')
    console.log(row)
  }
  console.log('═'.repeat(140))
}

function writeMarkdownReport(results: BenchmarkResult[], filepath: string) {
  const byConfig = new Map<string, BenchmarkResult[]>()
  for (const r of results) {
    const arr = byConfig.get(r.config) ?? []
    arr.push(r)
    byConfig.set(r.config, arr)
  }

  const lines: string[] = []
  lines.push('# RAG Benchmark Report — Dual Prompt Comparison')
  lines.push(`\n**Date:** ${new Date().toISOString()}`)
  lines.push(`**Questions:** ${TEST_QUESTIONS.length}`)
  lines.push(`**Configs:** ${byConfig.size}`)
  lines.push(`**Prompt Variants:** current (production prompt) vs optimized (model-specific)\n`)

  // Summary table
  lines.push('## Summary\n')
  lines.push('| Config | Prompt | Embed (ms) | Search (ms) | TTFT (ms) | LLM (ms) | Total (ms) | Tokens | Chars |')
  lines.push('|--------|--------|-----------|------------|----------|---------|-----------|--------|-------|')

  for (const [config, group] of byConfig) {
    const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length
    const variant = config.includes('[optimized]') ? '✨ optimized' : '📋 current'
    lines.push(`| ${config} | ${variant} | ${avg(group.map(r => r.embeddingMs)).toFixed(0)} | ${avg(group.map(r => r.searchMs)).toFixed(0)} | ${avg(group.map(r => r.llmFirstTokenMs)).toFixed(0)} | ${avg(group.map(r => r.llmTotalMs)).toFixed(0)} | ${avg(group.map(r => r.totalMs)).toFixed(0)} | ${avg(group.map(r => r.tokenCount)).toFixed(0)} | ${avg(group.map(r => r.answerLength)).toFixed(0)} |`)
  }

  // ── Prompt Variant Comparison per model ──
  lines.push('\n## Prompt Comparison by Model\n')
  const models = [...new Set(results.map(r => {
    // extract model from config label: "openai/gpt-5-mini [current]" → "openai/gpt-5-mini"
    return r.config.replace(/ \[(current|optimized)\]$/, '')
  }))]

  for (const model of models) {
    lines.push(`### ${model}\n`)
    const currentResults = results.filter(r => r.config === `${model} [current]`)
    const optimizedResults = results.filter(r => r.config === `${model} [optimized]`)

    if (currentResults.length && optimizedResults.length) {
      const avgMs = (arr: BenchmarkResult[]) => arr.reduce((a, b) => a + b.llmTotalMs, 0) / arr.length
      const avgChars = (arr: BenchmarkResult[]) => arr.reduce((a, b) => a + b.answerLength, 0) / arr.length
      const avgTTFT = (arr: BenchmarkResult[]) => arr.reduce((a, b) => a + b.llmFirstTokenMs, 0) / arr.length

      const diffMs = avgMs(optimizedResults) - avgMs(currentResults)
      const diffTTFT = avgTTFT(optimizedResults) - avgTTFT(currentResults)

      lines.push(`| Metric | Current | Optimized | Δ |`)
      lines.push(`|--------|---------|-----------|---|`)
      lines.push(`| Avg LLM (ms) | ${avgMs(currentResults).toFixed(0)} | ${avgMs(optimizedResults).toFixed(0)} | ${diffMs > 0 ? '+' : ''}${diffMs.toFixed(0)} |`)
      lines.push(`| Avg TTFT (ms) | ${avgTTFT(currentResults).toFixed(0)} | ${avgTTFT(optimizedResults).toFixed(0)} | ${diffTTFT > 0 ? '+' : ''}${diffTTFT.toFixed(0)} |`)
      lines.push(`| Avg Chars | ${avgChars(currentResults).toFixed(0)} | ${avgChars(optimizedResults).toFixed(0)} | — |`)
      lines.push('')
    }

    // Show side-by-side answers for each question
    lines.push('| Question | Current Answer | Optimized Answer |')
    lines.push('|----------|---------------|-----------------|')
    const questions = [...new Set(currentResults.map(r => r.question))]
    for (const q of questions) {
      const cur = currentResults.find(r => r.question === q)
      const opt = optimizedResults.find(r => r.question === q)
      const curAnswer = cur?.answer?.slice(0, 150) ?? '—'
      const optAnswer = opt?.answer?.slice(0, 150) ?? '—'
      lines.push(`| ${q.slice(0, 50)} | ${curAnswer.replace(/\|/g, '\\|').replace(/\n/g, ' ')} | ${optAnswer.replace(/\|/g, '\\|').replace(/\n/g, ' ')} |`)
    }
    lines.push('')
  }

  // Detailed answers
  lines.push('\n## Detailed Answers\n')
  for (const r of results) {
    lines.push(`### ${r.config}\n`)
    lines.push(`**Q:** ${r.question}\n`)
    lines.push(`**A:** ${r.answer}\n`)
    lines.push(`*Embed: ${r.embeddingMs.toFixed(0)}ms | Search: ${r.searchMs.toFixed(0)}ms | TTFT: ${r.llmFirstTokenMs.toFixed(0)}ms | LLM: ${r.llmTotalMs.toFixed(0)}ms | Total: ${r.totalMs.toFixed(0)}ms | ${r.tokenCount} tokens*\n`)
    if (r.error) lines.push(`> ⚠️ Error: ${r.error}\n`)
  }

  const { writeFileSync } = require('fs')
  writeFileSync(filepath, lines.join('\n'), 'utf-8')
  console.log(`\n📄 Report written to ${filepath}`)
}

// ═══════════════════════════════════════════════════════════════════════════
// Main
// ═══════════════════════════════════════════════════════════════════════════

async function main() {
  console.log('🔬 RAG Benchmark Tool')
  console.log('═'.repeat(60))

  // Parse CLI args
  const args = process.argv.slice(2)
  const runsArg = args.indexOf('--runs')
  const runs = runsArg !== -1 ? parseInt(args[runsArg + 1], 10) : 1
  const modelsArg = args.indexOf('--models')
  const modelFilter = modelsArg !== -1 ? args[modelsArg + 1] : undefined
  const questionsArg = args.indexOf('--questions')
  const questionLimit = questionsArg !== -1 ? parseInt(args[questionsArg + 1], 10) : TEST_QUESTIONS.length

  if (!process.env.OPENROUTER_API_KEY) {
    console.error('❌ OPENROUTER_API_KEY not set in .env.local')
    process.exit(1)
  }

  // Initialize shared components (embedding + search)
  console.log('\n⏳ Initializing embedding manager...')
  const embeddingManager = new EmbeddingManager()
  if (!embeddingManager.initialize()) {
    console.error('❌ Failed to initialize embedding manager')
    process.exit(1)
  }

  console.log('⏳ Initializing vector search...')
  const searchManager = new VectorSearchManager()
  if (!(await searchManager.initialize())) {
    console.error('❌ Failed to initialize vector search')
    process.exit(1)
  }

  // Build configs
  const configs = buildDefaultConfigs(modelFilter)
  const questions = TEST_QUESTIONS.slice(0, questionLimit)
  console.log(`\n📋 ${configs.length} models × ${questions.length} questions × ${runs} run(s) = ${configs.length * questions.length * runs} total benchmarks`)
  console.log('\nModels:')
  configs.forEach((c, i) => console.log(`  ${i + 1}. ${c.model}`))
  console.log()

  // Run benchmarks
  const allResults: BenchmarkResult[] = []
  let completed = 0
  const total = configs.length * questions.length * runs

  for (const config of configs) {
    console.log(`\n🏃 Running model: ${config.model}`)

    for (const question of questions) {
      for (let run = 0; run < runs; run++) {
        completed++
        process.stdout.write(`  [${completed}/${total}] ${question.slice(0, 50)}... `)

        const result = await runSingleBenchmark(config, question, embeddingManager, searchManager)
        allResults.push(result)

        if (result.error) {
          console.log(`❌ ${result.error}`)
        } else {
          console.log(`✅ ${result.totalMs.toFixed(0)}ms (TTFT: ${result.llmFirstTokenMs.toFixed(0)}ms)`)
        }
      }
    }
  }

  // Output
  printResultsTable(allResults)
  printSummaryTable(allResults)

  const reportPath = resolve(__dirname, '..', 'benchmark-report.md')
  writeMarkdownReport(allResults, reportPath)

  console.log('\n✅ Benchmark complete!')
}

main().catch((e) => {
  console.error('Fatal error:', e)
  process.exit(1)
})
