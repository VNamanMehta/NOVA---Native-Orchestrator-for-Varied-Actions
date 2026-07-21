import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useEcho } from './useEcho'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('useEcho', () => {
  it('sends "ping" and exposes the assistant reply on success', async () => {
    const send = vi.fn().mockResolvedValue({
      ok: true,
      value: { role: 'assistant', content: 'ping' }
    })
    vi.stubGlobal('api', { chat: { send } })

    const { result } = renderHook(() => useEcho())

    await waitFor(() => expect(result.current).toEqual({ role: 'assistant', content: 'ping' }))
    expect(send).toHaveBeenCalledWith('ping')
  })

  it('logs and stays null when the round-trip fails', async () => {
    const send = vi.fn().mockResolvedValue({ ok: false, error: { message: 'boom' } })
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.stubGlobal('api', { chat: { send } })

    const { result } = renderHook(() => useEcho())

    await waitFor(() => expect(errorSpy).toHaveBeenCalled())
    expect(result.current).toBeNull()
  })
})
