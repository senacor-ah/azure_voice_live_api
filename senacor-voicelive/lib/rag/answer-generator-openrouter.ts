/**
 * Answer Generator (OpenRouter)
 * Migrated from: backend/RAG/src/answer_generator_openrouter.py
 *
 * Alternative answer generator using OpenRouter API for various LLM models.
 */

import OpenAI from 'openai'
import type { SearchDocument } from './vector-search'
import type { AnswerResult } from './answer-generator'

export class AnswerGeneratorOpenRouter {
  private apiKey: string
  private model: string
  private client: OpenAI | null = null
  public systemPrompt: string

  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY ?? ''
    this.model = process.env.OPENROUTER_MODEL ?? 'openai/gpt-4o-mini'
    this.systemPrompt = `You are a helpful assistant that answers questions based on provided context.
Always use the provided context to answer questions accurately.
If the context doesn't contain enough information, say so clearly.
Keep answers concise and well-structured.
Format your answer in a clear, readable way.`
  }

  /** Initialize OpenRouter client. */
  initialize(): boolean {
    try {
      if (!this.apiKey) {
        console.error('OPENROUTER_API_KEY not found in environment variables')
        return false
      }

      this.client = new OpenAI({
        baseURL: 'https://openrouter.ai/api/v1',
        apiKey: this.apiKey,
      })

      console.log(`OpenRouter chat model '${this.model}' initialized.`)
      return true
    } catch (e) {
      console.error(`Error initializing OpenRouter client: ${e}`)
      return false
    }
  }

  /** Set custom system prompt. */
  setSystemPrompt(prompt: string): void {
    this.systemPrompt = prompt
  }

  /** Generate an answer based on retrieved documents using OpenRouter (with streaming). */
  async generateAnswer(
    question: string,
    contextDocuments: SearchDocument[],
    maxTokens = 1000,
  ): Promise<AnswerResult | null> {
    try {
      if (!this.client) throw new Error('Not initialized')

      const context = this.buildContext(contextDocuments)

      const messages = [
        { role: 'system' as const, content: this.systemPrompt },
        {
          role: 'user' as const,
          content: `Based on the following context, answer the question.\n\nCONTEXT:\n${context}\n\nQUESTION:\n${question}\n\nANSWER:`,
        },
      ]

      const startTime = performance.now()
      let firstTokenTime: number | null = null
      let fullResponse = ''
      let tokenCount = 0

      const stream = await this.client.chat.completions.create({
        model: this.model,
        messages,
        max_completion_tokens: maxTokens,
        stream: true,
      })

      for await (const chunk of stream) {
        if (chunk.choices && chunk.choices.length > 0) {
          const delta = chunk.choices[0].delta
          if (delta?.content) {
            if (firstTokenTime === null) {
              firstTokenTime = performance.now() - startTime
            }
            fullResponse += delta.content
            tokenCount++
          }
        }
      }

      const totalTime = performance.now() - startTime

      if (firstTokenTime !== null) {
        console.log(
          `[TIMING] OpenRouter LLM generation: First token in ${(firstTokenTime / 1000).toFixed(2)}s, ` +
          `All tokens in ${(totalTime / 1000).toFixed(2)}s (${tokenCount} tokens)`,
        )
      } else {
        console.warn(`[TIMING] OpenRouter LLM generation: No tokens received in ${(totalTime / 1000).toFixed(2)}s`)
      }

      return {
        answer: fullResponse.trim(),
        first_token_time_ms: firstTokenTime ?? undefined,
        total_time_ms: totalTime,
        token_count: tokenCount,
      }
    } catch (e) {
      console.error(`Error generating answer with OpenRouter: ${e}`)
      return null
    }
  }

  /** Build context string from retrieved documents. */
  private buildContext(documents: SearchDocument[]): string {
    const parts = documents.map(
      (doc, i) => `[Source ${i + 1}: ${doc.source}]\n${doc.content}\n`,
    )
    return parts.length > 0 ? parts.join('\n') : 'No relevant context found.'
  }
}
