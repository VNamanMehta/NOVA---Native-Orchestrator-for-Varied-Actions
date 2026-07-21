import { beforeEach, describe, expect, it, vi } from 'vitest'
import { RequestChannels, type IpcResult, type Message } from '../../shared/ipc'
import { handleRequest, unregisterRequestHandlers } from './handleRequest'

const handlers = new Map<string, (event: unknown, payload: unknown) => unknown>()

vi.mock('electron', () => ({
  ipcMain: {
    handle: (channel: string, listener: (event: unknown, payload: unknown) => unknown) => {
      handlers.set(channel, listener)
    },
    removeHandler: (channel: string) => {
      handlers.delete(channel)
    }
  }
}))

// Invokes a registered channel the way ipcRenderer.invoke would.
function invoke(channel: string, payload: unknown): Promise<IpcResult<Message>> {
  const listener = handlers.get(channel)
  if (!listener) throw new Error(`no handler registered for ${channel}`)
  return listener({}, payload) as Promise<IpcResult<Message>>
}

beforeEach(() => {
  // The channel registry is module state; clear it so tests don't leak.
  unregisterRequestHandlers()
  handlers.clear()
})

describe('handleRequest', () => {
  it('validates the payload before the handler sees it', async () => {
    const handler = vi.fn()
    handleRequest(RequestChannels.chatSend, handler)

    expect(await invoke(RequestChannels.chatSend, 42)).toEqual({
      ok: false,
      error: { message: 'chat:send expects a string payload' }
    })
    expect(handler).not.toHaveBeenCalled()
  })

  it('wraps a handler result in the ok envelope', async () => {
    handleRequest(RequestChannels.chatSend, async (text) => ({
      role: 'assistant' as const,
      content: text
    }))

    expect(await invoke(RequestChannels.chatSend, 'hi')).toEqual({
      ok: true,
      value: { role: 'assistant', content: 'hi' }
    })
  })

  it('converts a throwing handler into the not-ok envelope rather than rejecting', async () => {
    handleRequest(RequestChannels.chatSend, async () => {
      throw new Error('handler exploded')
    })

    await expect(invoke(RequestChannels.chatSend, 'hi')).resolves.toEqual({
      ok: false,
      error: { message: 'handler exploded' }
    })
  })
})

describe('unregisterRequestHandlers', () => {
  it('removes every channel that was registered', () => {
    handleRequest(RequestChannels.chatSend, async (text) => ({
      role: 'assistant' as const,
      content: text
    }))
    expect(handlers.has(RequestChannels.chatSend)).toBe(true)

    unregisterRequestHandlers()

    expect(handlers.size).toBe(0)
  })

  it('is a no-op when nothing is registered', () => {
    expect(() => unregisterRequestHandlers()).not.toThrow()
  })

  it('forgets channels, so a second teardown does not re-remove them', () => {
    handleRequest(RequestChannels.chatSend, async (text) => ({
      role: 'assistant' as const,
      content: text
    }))
    unregisterRequestHandlers()

    // Re-register out of band: a stale registry would wrongly remove this.
    handlers.set(RequestChannels.chatSend, () => undefined)
    unregisterRequestHandlers()

    expect(handlers.has(RequestChannels.chatSend)).toBe(true)
  })
})
