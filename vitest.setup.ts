import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach, vi } from 'vitest'
import type { NovaApi } from './src/shared/ipc'
import { useAppStore } from './src/renderer/src/store/appStore'

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
      })),
      retry: vi.fn(async () => ({
        ok: true as const,
        value: { role: 'assistant' as const, content: '' }
      }))
    },
    settings: {
      get: vi.fn(async () => ({
        ok: true as const,
        value: { activeProvider: 'grok' as const, apiKeyConfigured: true }
      })),
      setApiKey: vi.fn(async () => ({ ok: true as const, value: undefined })),
      setActiveProvider: vi.fn(async () => ({ ok: true as const, value: undefined }))
    },
    events: {
      on: vi.fn(() => () => {})
    }
  }
}

beforeEach(() => {
  vi.stubGlobal('api', createApiStub())
})

afterEach(() => {
  cleanup()
  useAppStore.setState(useAppStore.getInitialState(), true)
})
