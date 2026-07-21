import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { NovaApi } from '../../../shared/ipc'
import { createApiStub } from '../../../../vitest.setup'
import { useEcho } from './useEcho'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

// Spread the shared stub so the override stays a complete NovaApi.
function stubApi(send: NovaApi['chat']['send']): void {
  vi.stubGlobal('api', { ...createApiStub(), chat: { send } } satisfies NovaApi)
}

describe('useEcho', () => {
  it('sends "ping" and exposes the assistant reply on success', async () => {
    const send = vi.fn().mockResolvedValue({
      ok: true,
      value: { role: 'assistant', content: 'ping' }
    })
    stubApi(send)

    const { result } = renderHook(() => useEcho())

    await waitFor(() => expect(result.current).toEqual({ role: 'assistant', content: 'ping' }))
    expect(send).toHaveBeenCalledWith('ping')
  })

  it('logs and stays null when the round-trip fails', async () => {
    const send = vi.fn().mockResolvedValue({ ok: false, error: { message: 'boom' } })
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    stubApi(send)

    const { result } = renderHook(() => useEcho())

    await waitFor(() => expect(errorSpy).toHaveBeenCalled())
    expect(result.current).toBeNull()
  })

  it('handles invoke itself rejecting, without an unhandled rejection', async () => {
    // invoke rejects rather than resolving to an envelope, so runSafely never sees it.
    const send = vi.fn().mockRejectedValue(new Error('No handler registered'))
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    stubApi(send)

    const { result } = renderHook(() => useEcho())

    await waitFor(() =>
      expect(errorSpy).toHaveBeenCalledWith('echo failed to reach main:', expect.any(Error))
    )
    expect(result.current).toBeNull()
  })
})
