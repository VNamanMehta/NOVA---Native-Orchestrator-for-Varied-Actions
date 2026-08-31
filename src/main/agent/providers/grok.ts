import { ProviderError, type ProviderErrorCode } from './types'
import type { LLMProvider, NormalizedMessage, ProviderEvent, ToolSchema } from './types'

const GROK_API_URL = 'https://api.x.ai/v1/chat/completions'
const GROK_MODEL = 'grok-4-fast'
const REQUEST_TIMEOUT_MS = 30000

function mapStatusToErrorCode(status: number): ProviderErrorCode {
  if (status === 401 || status === 403) return 'AUTH'
  if (status === 429) return 'RATE_LIMIT'
  return 'PROVIDER_ERROR'
}

interface GrokStreamFrame {
  choices?: Array<{ delta?: { content?: string } }>
}

export function createGrokProvider(apiKey: string): LLMProvider {
  return {
    async *chat(
      messages: NormalizedMessage[],
      _tools: ToolSchema[],
      signal?: AbortSignal
    ): AsyncIterable<ProviderEvent> {
      const timeoutSignal = AbortSignal.timeout(REQUEST_TIMEOUT_MS)
      const requestSignal = signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal

      let response: Response
      try {
        response = await fetch(GROK_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`
          },
          body: JSON.stringify({ model: GROK_MODEL, messages, stream: true }),
          signal: requestSignal
        })
      } catch (err) {
        throw new ProviderError('NETWORK', `Could not reach Grok: ${(err as Error).message}`)
      }

      if (!response.ok) {
        throw new ProviderError(
          mapStatusToErrorCode(response.status),
          `Grok returned HTTP ${response.status}.`
        )
      }

      const body = response.body
      if (!body) {
        throw new ProviderError('PROVIDER_ERROR', 'Grok returned an empty stream body.')
      }

      const reader = body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let accumulated = ''

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })

          let boundary = buffer.indexOf('\n\n')
          while (boundary !== -1) {
            const frame = buffer.slice(0, boundary).trim()
            buffer = buffer.slice(boundary + 2)
            boundary = buffer.indexOf('\n\n')

            if (!frame.startsWith('data:')) continue
            const data = frame.slice('data:'.length).trim()
            if (data === '[DONE]') {
              yield { type: 'done', message: { role: 'assistant', content: accumulated } }
              return
            }

            let parsed: GrokStreamFrame
            try {
              parsed = JSON.parse(data) as GrokStreamFrame
            } catch {
              throw new ProviderError('PROVIDER_ERROR', 'Grok sent a malformed stream frame.')
            }

            const delta = parsed.choices?.[0]?.delta?.content
            if (delta) {
              accumulated += delta
              yield { type: 'text_delta', delta }
            }
          }
        }
      } catch (err) {
        if (err instanceof ProviderError) throw err
        throw new ProviderError(
          'NETWORK',
          `Grok stream connection dropped: ${(err as Error).message}`
        )
      }

      throw new ProviderError('PROVIDER_ERROR', 'Grok stream ended without a [DONE] sentinel.')
    }
  }
}
