import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { NovaApi } from '../../../shared/ipc'
import { createApiStub } from '../../../../vitest.setup'
import { useConversation } from './useConversation'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

function stubApi(send: NovaApi['chat']['send']): void {
  vi.stubGlobal('api', { ...createApiStub(), chat: { send } } satisfies NovaApi)
}

describe('useConversation', () => {
  it('appends a user message and a pending assistant placeholder on send', () => {
    let resolveSend!: (value: Awaited<ReturnType<NovaApi['chat']['send']>>) => void
    const send = vi.fn(
      () => new Promise<Awaited<ReturnType<NovaApi['chat']['send']>>>((r) => (resolveSend = r))
    )
    stubApi(send)

    const { result } = renderHook(() => useConversation())
    act(() => result.current.send('hello'))

    expect(result.current.messages).toHaveLength(2)
    expect(result.current.messages[0]).toMatchObject({
      role: 'user',
      content: 'hello',
      status: 'complete'
    })
    expect(result.current.messages[1]).toMatchObject({ role: 'assistant', status: 'pending' })
    expect(result.current.isPending).toBe(true)
    expect(send).toHaveBeenCalledWith('hello')
    // avoid an unhandled resolve after the test
    resolveSend({ ok: true, value: { role: 'assistant', content: 'hi' } })
  })

  it('resolves the placeholder to complete on a successful reply', async () => {
    const send = vi
      .fn()
      .mockResolvedValue({ ok: true, value: { role: 'assistant', content: 'world' } })
    stubApi(send)

    const { result } = renderHook(() => useConversation())
    act(() => result.current.send('hello'))

    await waitFor(() =>
      expect(result.current.messages[1]).toMatchObject({ content: 'world', status: 'complete' })
    )
    expect(result.current.isPending).toBe(false)
  })

  it('marks the placeholder as error when the envelope is not ok', async () => {
    const send = vi.fn().mockResolvedValue({ ok: false, error: { message: 'boom' } })
    stubApi(send)

    const { result } = renderHook(() => useConversation())
    act(() => result.current.send('hello'))

    await waitFor(() =>
      expect(result.current.messages[1]).toMatchObject({ content: 'boom', status: 'error' })
    )
  })

  it('marks the placeholder as error when the invoke itself rejects', async () => {
    const send = vi.fn().mockRejectedValue(new Error('no handler'))
    stubApi(send)

    const { result } = renderHook(() => useConversation())
    act(() => result.current.send('hello'))

    await waitFor(() => expect(result.current.messages[1].status).toBe('error'))
    expect(result.current.messages[1].content.length).toBeGreaterThan(0)
  })

  it('ignores whitespace-only sends', () => {
    const send = vi.fn()
    stubApi(send)

    const { result } = renderHook(() => useConversation())
    act(() => result.current.send('   '))

    expect(result.current.messages).toHaveLength(0)
    expect(send).not.toHaveBeenCalled()
  })

  it('retry re-sends the preceding user message and resolves it', async () => {
    const send = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, error: { message: 'boom' } })
      .mockResolvedValueOnce({ ok: true, value: { role: 'assistant', content: 'ok now' } })
    stubApi(send)

    const { result } = renderHook(() => useConversation())
    act(() => result.current.send('hello'))
    await waitFor(() => expect(result.current.messages[1].status).toBe('error'))

    const assistantId = result.current.messages[1].id
    act(() => result.current.retry(assistantId))

    await waitFor(() =>
      expect(result.current.messages[1]).toMatchObject({ content: 'ok now', status: 'complete' })
    )
    expect(send).toHaveBeenNthCalledWith(2, 'hello')
  })

  it('ignores a second retry while the first retry is still pending', async () => {
    let resolveRetry!: (value: Awaited<ReturnType<NovaApi['chat']['send']>>) => void
    const send = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, error: { message: 'boom' } })
      .mockImplementationOnce(
        () => new Promise<Awaited<ReturnType<NovaApi['chat']['send']>>>((r) => (resolveRetry = r))
      )
    stubApi(send)

    const { result } = renderHook(() => useConversation())
    act(() => result.current.send('hello'))
    await waitFor(() => expect(result.current.messages[1].status).toBe('error'))

    const assistantId = result.current.messages[1].id
    act(() => result.current.retry(assistantId))
    expect(result.current.messages[1].status).toBe('pending')

    act(() => result.current.retry(assistantId))

    expect(send).toHaveBeenCalledTimes(2)

    // avoid an unhandled resolve after the test
    await act(async () => {
      resolveRetry({ ok: true, value: { role: 'assistant', content: 'ok now' } })
      await Promise.resolve()
    })
  })
})
