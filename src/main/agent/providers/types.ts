export type ProviderErrorCode = 'AUTH' | 'RATE_LIMIT' | 'NETWORK' | 'PROVIDER_ERROR' | 'UNKNOWN'

export class ProviderError extends Error {
  code: ProviderErrorCode

  constructor(code: ProviderErrorCode, message: string) {
    super(message)
    this.name = 'ProviderError'
    this.code = code
  }
}

export interface NormalizedMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

// Unused until Phase 2's tool registry lands — kept now so LLMProvider.chat()'s
// signature doesn't change again when tools arrive.
export interface ToolSchema {
  name: string
  description: string
  parameters: Record<string, unknown>
}

export type ProviderEvent =
  | { type: 'text_delta'; delta: string }
  | { type: 'tool_call'; name: string; params: Record<string, unknown> }
  | { type: 'done'; message: NormalizedMessage }

export interface LLMProvider {
  chat(
    messages: NormalizedMessage[],
    tools: ToolSchema[],
    signal?: AbortSignal
  ): AsyncIterable<ProviderEvent>
}
