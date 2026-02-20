/**
 * Answer Generator (Azure OpenAI)
 * Migrated from: backend/RAG/src/answer_generator.py
 *
 * Generates answers using Azure OpenAI chat models with streaming for timing.
 */

import { AzureOpenAI } from 'openai'
import type { SearchDocument } from './vector-search'

export interface AnswerResult {
  answer: string
  first_token_time_ms?: number
  total_time_ms?: number
  token_count?: number
}

export class AnswerGenerator {
  private apiKey: string
  private apiEndpoint: string
  private apiVersion: string
  private deploymentName: string
  private client: AzureOpenAI | null = null
  public systemPrompt: string

  constructor() {
    this.apiKey = process.env.AZURE_OPENAI_API_KEY ?? ''
    this.apiEndpoint = process.env.AZURE_OPENAI_ENDPOINT ?? ''
    this.apiVersion = process.env.AZURE_OPENAI_API_VERSION ?? ''
    this.deploymentName = process.env.AZURE_OPENAI_CHAT_DEPLOYMENT ?? ''
    this.systemPrompt = `You are a helpful assistant that answers questions based on provided context.
Always use the provided context to answer questions accurately.
If the context doesn't contain enough information, say so clearly.
Keep answers concise and well-structured.
Format your answer in a clear, readable way.`
  }

  /** Initialize Azure OpenAI chat model. */
  initialize(): boolean {
    try {
      this.client = new AzureOpenAI({
        apiKey: this.apiKey,
        apiVersion: this.apiVersion,
        endpoint: this.apiEndpoint,
      })
      console.log(`Chat model '${this.deploymentName}' initialized.`)
      return true
    } catch (e) {
      console.error(`Error initializing chat model: ${e}`)
      return false
    }
  }

  /** Set custom system prompt. */
  setSystemPrompt(prompt: string): void {
    this.systemPrompt = prompt
  }

  /** Generate an answer based on retrieved documents (with streaming for timing). */
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

      // Stream the response to capture first token timing
      const stream = await this.client.chat.completions.create({
        model: this.deploymentName,
        messages,
        max_tokens: maxTokens,
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
          `[TIMING] LLM generation: First token in ${(firstTokenTime / 1000).toFixed(2)}s, ` +
          `All tokens in ${(totalTime / 1000).toFixed(2)}s (${tokenCount} tokens)`,
        )
      } else {
        console.warn(`[TIMING] LLM generation: No tokens received in ${(totalTime / 1000).toFixed(2)}s`)
      }

      return {
        answer: fullResponse.trim(),
        first_token_time_ms: firstTokenTime ?? undefined,
        total_time_ms: totalTime,
        token_count: tokenCount,
      }
    } catch (e) {
      console.error(`Error generating answer: ${e}`)
      return null
    }
  }

  /** Build context string from retrieved documents. */
  private buildContext(documents: SearchDocument[]): string {
    const MAX_CHUNK_CHARS = 600
    const parts = documents.map(
      (doc, i) => {
        const content = doc.content.length > MAX_CHUNK_CHARS
          ? doc.content.slice(0, MAX_CHUNK_CHARS) + '…'
          : doc.content
        return `[Source ${i + 1}: ${doc.source}]\n${content}\n`
      },
    )
    return parts.length > 0 ? parts.join('\n') : 'No relevant context found.'
  }
}
