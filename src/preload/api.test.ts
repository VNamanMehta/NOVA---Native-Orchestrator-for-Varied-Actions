import { describe, expect, it, vi } from 'vitest'
import { MainToRendererChannels, RendererToMainChannels, RequestChannels } from '../shared/ipc'

const invoke = vi.fn(async (...args: unknown[]) => {
  void args
  return { ok: true as const, value: undefined }
})
const on = vi.fn()
const removeListener = vi.fn()
const send = vi.fn()

vi.mock('electron', () => ({
  ipcRenderer: {
    invoke: (...args: unknown[]) => invoke(...args),
    on: (...args: unknown[]) => on(...args),
    removeListener: (...args: unknown[]) => removeListener(...args),
    send: (...args: unknown[]) => send(...args)
  }
}))

import { api } from './api'

describe('preload api.window', () => {
  it('notifyStructuralUiChange sends the structural-ui-change channel with no payload', () => {
    api.window.notifyStructuralUiChange()
    expect(send).toHaveBeenCalledWith(RendererToMainChannels.structuralUiChange)
  })
})

describe('preload api.settings', () => {
  it('get() invokes settings:get with no payload', () => {
    api.settings.get()
    expect(invoke).toHaveBeenCalledWith(RequestChannels.settingsGet)
  })

  it('setApiKey wraps provider and key into one payload', () => {
    api.settings.setApiKey('grok', 'sk-test')
    expect(invoke).toHaveBeenCalledWith(RequestChannels.settingsSetApiKey, {
      provider: 'grok',
      key: 'sk-test'
    })
  })

  it('setActiveProvider wraps provider into one payload', () => {
    api.settings.setActiveProvider('anthropic')
    expect(invoke).toHaveBeenCalledWith(RequestChannels.settingsSetActiveProvider, {
      provider: 'anthropic'
    })
  })
})

describe('preload api.events.on', () => {
  it('subscribes to an allowed push channel and returns an unsubscribe function', () => {
    const handler = vi.fn()
    const unsubscribe = api.events.on(MainToRendererChannels.openSettings, handler)

    expect(on).toHaveBeenCalledWith(MainToRendererChannels.openSettings, expect.any(Function))

    unsubscribe()
    expect(removeListener).toHaveBeenCalledWith(
      MainToRendererChannels.openSettings,
      expect.any(Function)
    )
  })

  it('forwards only the payload to the handler, not the ipc event', () => {
    const handler = vi.fn()
    api.events.on(MainToRendererChannels.openSettings, handler)

    const registeredListener = on.mock.calls[on.mock.calls.length - 1][1] as (
      event: unknown,
      payload: unknown
    ) => void
    registeredListener({ fake: 'event' }, { some: 'payload' })

    expect(handler).toHaveBeenCalledWith({ some: 'payload' })
  })

  it('throws for a channel that is not an allowed push channel', () => {
    expect(() =>
      // @ts-expect-error deliberately passing a channel outside MainToRendererChannel
      api.events.on('not-a-real-channel', vi.fn())
    ).toThrow(/not allowed/)
  })
})
