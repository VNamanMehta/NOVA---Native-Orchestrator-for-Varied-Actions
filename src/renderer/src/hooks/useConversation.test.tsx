import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { NovaApi } from '../../../shared/ipc'
import { MainToRendererChannels } from '../../../shared/ipc'
import { createApiStub } from '../../../../vitest.setup'
import { useConversation } from './useConversation'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

function stubApi(overrides: {
  send?: NovaApi['chat']['send']
  retry?: NovaApi['chat']['retry']
  onToken?: (handler: (payload: { token: string }) => void) => () => void
}): void {
  const stub = createApiStub()
  vi.stubGlobal('api', {
    ...stub,
    chat: {
      send: overrides.send ?? stub.chat.send,
      retry: overrides.retry ?? stub.chat.retry
    },
    events: {
      on: vi.fn((channel: string, handler: (payload: unknown) => void) => {
        if (channel === MainToRendererChannels.chatToken && overrides.onToken) {
          return overrides.onToken(handler as (payload: { token: string }) => void)
        }
        return () => {}
      }) as unknown as NovaApi['events']['on']
    }
  } satisfies NovaApi)
}

describe('useConversation', () => {
  it('appends a user message and a pending assistant placeholder on send', () => {
    let resolveSend!: (value: Awaited<ReturnType<NovaApi['chat']['send']>>) => void
    const send = vi.fn(
      () => new Promise<Awaited<ReturnType<NovaApi['chat']['send']>>>((r) => (resolveSend = r))
    )
    stubApi({ send })

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
    expect(result.current.isAwaitingReply).toBe(true)
    expect(send).toHaveBeenCalledWith('hello')
    resolveSend({ ok: true, value: { role: 'assistant', content: 'hi' } })
  })

  it('flips the placeholder to streaming and accumulates content as chat-token events arrive', async () => {
    let tokenHandler!: (payload: { token: string }) => void
    let resolveSend!: (value: Awaited<ReturnType<NovaApi['chat']['send']>>) => void
    const send = vi.fn(
      () => new Promise<Awaited<ReturnType<NovaApi['chat']['send']>>>((r) => (resolveSend = r))
    )
    stubApi({
      send,
      onToken: (handler) => {
        tokenHandler = handler
        return () => {}
      }
    })

    const { result } = renderHook(() => useConversation())
    act(() => result.current.send('hello'))

    act(() => tokenHandler({ token: 'Hel' }))
    expect(result.current.messages[1]).toMatchObject({ status: 'streaming', content: 'Hel' })

    act(() => tokenHandler({ token: 'lo' }))
    expect(result.current.messages[1]).toMatchObject({ status: 'streaming', content: 'Hello' })

    act(() => resolveSend({ ok: true, value: { role: 'assistant', content: 'Hello' } }))
    await waitFor(() =>
      expect(result.current.messages[1]).toMatchObject({ status: 'complete', content: 'Hello' })
    )
  })

  it('resolves the placeholder to complete on a successful reply with no streamed tokens', async () => {
    const send = vi
      .fn()
      .mockResolvedValue({ ok: true, value: { role: 'assistant', content: 'world' } })
    stubApi({ send })

    const { result } = renderHook(() => useConversation())
    act(() => result.current.send('hello'))

    await waitFor(() =>
      expect(result.current.messages[1]).toMatchObject({ content: 'world', status: 'complete' })
    )
    expect(result.current.isPending).toBe(false)
    expect(result.current.isAwaitingReply).toBe(false)
  })

  it('marks the placeholder as error, keeping any partial streamed content, when the envelope is not ok', async () => {
    let tokenHandler!: (payload: { token: string }) => void
    let resolveSend!: (value: Awaited<ReturnType<NovaApi['chat']['send']>>) => void
    const send = vi.fn(
      () => new Promise<Awaited<ReturnType<NovaApi['chat']['send']>>>((r) => (resolveSend = r))
    )
    stubApi({
      send,
      onToken: (handler) => {
        tokenHandler = handler
        return () => {}
      }
    })

    const { result } = renderHook(() => useConversation())
    act(() => result.current.send('hello'))
    act(() => tokenHandler({ token: 'Hel' }))

    act(() => resolveSend({ ok: false, error: { message: 'boom' } }))
    await waitFor(() =>
      expect(result.current.messages[1]).toMatchObject({
        status: 'error',
        content: 'Hel',
        errorMessage: 'boom'
      })
    )
  })

  it('marks the placeholder as error when the invoke itself rejects', async () => {
    const send = vi.fn().mockRejectedValue(new Error('no handler'))
    stubApi({ send })

    const { result } = renderHook(() => useConversation())
    act(() => result.current.send('hello'))

    await waitFor(() => expect(result.current.messages[1].status).toBe('error'))
    expect(result.current.messages[1].errorMessage?.length).toBeGreaterThan(0)
  })

  it('ignores whitespace-only sends', () => {
    const send = vi.fn()
    stubApi({ send })

    const { result } = renderHook(() => useConversation())
    act(() => result.current.send('   '))

    expect(result.current.messages).toHaveLength(0)
    expect(send).not.toHaveBeenCalled()
  })

  it('blocks a second send while the previous turn is still pending', () => {
    const send = vi.fn(() => new Promise<Awaited<ReturnType<NovaApi['chat']['send']>>>(() => {}))
    stubApi({ send })

    const { result } = renderHook(() => useConversation())
    act(() => result.current.send('first'))
    act(() => result.current.send('second'))

    expect(send).toHaveBeenCalledTimes(1)
    expect(result.current.messages).toHaveLength(2)
  })

  it('allows a new send after the previous turn errored, as a fresh attempt', async () => {
    const send = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, error: { message: 'boom' } })
      .mockResolvedValueOnce({ ok: true, value: { role: 'assistant', content: 'ok now' } })
    stubApi({ send })

    const { result } = renderHook(() => useConversation())
    act(() => result.current.send('first'))
    await waitFor(() => expect(result.current.messages[1].status).toBe('error'))

    expect(result.current.isAwaitingReply).toBe(false)
    act(() => result.current.send('second'))

    expect(send).toHaveBeenCalledTimes(2)
    expect(send).toHaveBeenNthCalledWith(2, 'second')
    expect(result.current.messages).toHaveLength(4)
    await waitFor(() =>
      expect(result.current.messages[3]).toMatchObject({ status: 'complete', content: 'ok now' })
    )
  })

  it('retry calls chat.retry with no arguments and resolves the trailing errored message', async () => {
    const send = vi.fn().mockResolvedValue({ ok: false, error: { message: 'boom' } })
    const retry = vi
      .fn()
      .mockResolvedValue({ ok: true, value: { role: 'assistant', content: 'ok now' } })
    stubApi({ send, retry })

    const { result } = renderHook(() => useConversation())
    act(() => result.current.send('hello'))
    await waitFor(() => expect(result.current.messages[1].status).toBe('error'))

    const assistantId = result.current.messages[1].id
    act(() => result.current.retry(assistantId))

    expect(result.current.messages[1]).toMatchObject({ status: 'pending', content: '' })

    await waitFor(() =>
      expect(result.current.messages[1]).toMatchObject({ content: 'ok now', status: 'complete' })
    )
    expect(retry).toHaveBeenCalledWith()
    expect(send).toHaveBeenCalledTimes(1)
  })

  it('ignores retrying a message that is not the trailing errored one', async () => {
    const send = vi.fn().mockResolvedValueOnce({ ok: false, error: { message: 'boom' } })
    const retry = vi.fn()
    stubApi({ send, retry })

    const { result } = renderHook(() => useConversation())
    act(() => result.current.send('hello'))
    await waitFor(() => expect(result.current.messages[1].status).toBe('error'))

    act(() => result.current.retry('not-a-real-id'))

    expect(retry).not.toHaveBeenCalled()
  })

  it('ignores a second retry while the first retry is still pending', async () => {
    let resolveRetry!: (value: Awaited<ReturnType<NovaApi['chat']['retry']>>) => void
    const send = vi.fn().mockResolvedValueOnce({ ok: false, error: { message: 'boom' } })
    const retry = vi.fn(
      () => new Promise<Awaited<ReturnType<NovaApi['chat']['retry']>>>((r) => (resolveRetry = r))
    )
    stubApi({ send, retry })

    const { result } = renderHook(() => useConversation())
    act(() => result.current.send('hello'))
    await waitFor(() => expect(result.current.messages[1].status).toBe('error'))

    const assistantId = result.current.messages[1].id
    act(() => result.current.retry(assistantId))
    expect(result.current.messages[1].status).toBe('pending')

    act(() => result.current.retry(assistantId))

    expect(retry).toHaveBeenCalledTimes(1)

    await act(async () => {
      resolveRetry({ ok: true, value: { role: 'assistant', content: 'ok now' } })
      await Promise.resolve()
    })
  })
})
