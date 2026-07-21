import '@testing-library/jest-dom/vitest'
import { beforeEach, vi } from 'vitest'
import type { NovaApi } from './src/shared/ipc'

// Renderer code calls window.api with no defensive chaining, so tests need the
// bridge present. Typed as NovaApi so the stub can't drift from the real shape.
export function createApiStub(): NovaApi {
  return {
    window: {
      reportContentHeight: vi.fn()
    },
    chat: {
      send: vi.fn(async (text: string) => ({
        ok: true as const,
        value: { role: 'assistant' as const, content: text }
      }))
    }
  }
}

beforeEach(() => {
  vi.stubGlobal('api', createApiStub())
})
