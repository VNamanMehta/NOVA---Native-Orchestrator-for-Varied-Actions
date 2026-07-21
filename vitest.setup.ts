import '@testing-library/jest-dom/vitest'
import { beforeEach, vi } from 'vitest'
import type { NovaApi } from './src/shared/ipc'

/**
 * The preload bridge is a boot invariant in the real app (main.tsx asserts it),
 * so renderer code calls window.api directly with no defensive chaining.
 * Tests get an equivalent guarantee from this stub. Override per-test with
 * vi.stubGlobal('api', ...) when a specific response is needed.
 */
function createApiStub(): NovaApi {
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
