import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApiStub } from '../../../../vitest.setup'
import { assertPreloadBridge } from './assertPreloadBridge'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('assertPreloadBridge', () => {
  it('returns without touching the container when the bridge is present', () => {
    const container = document.createElement('div')

    expect(() => assertPreloadBridge(container)).not.toThrow()
    expect(container.textContent).toBe('')
  })

  it('throws when window.api is absent', () => {
    vi.stubGlobal('api', undefined)
    const container = document.createElement('div')

    expect(() => assertPreloadBridge(container)).toThrow(/preload bridge/i)
  })

  it('renders a visible failure message into the container', () => {
    vi.stubGlobal('api', undefined)
    const container = document.createElement('div')

    expect(() => assertPreloadBridge(container)).toThrow()
    expect(container.textContent).toMatch(/Nova failed to start/i)
  })

  it('throws when a namespace is missing entirely', () => {
    const { window: windowApi } = createApiStub()
    vi.stubGlobal('api', { window: windowApi })
    const container = document.createElement('div')

    expect(() => assertPreloadBridge(container)).toThrow(/chat\.send/)
  })

  it('throws when a namespace exists but its method does not', () => {
    vi.stubGlobal('api', { ...createApiStub(), chat: {} })
    const container = document.createElement('div')

    expect(() => assertPreloadBridge(container)).toThrow(/chat\.send/)
  })

  it('throws when a leaf is present but is not callable', () => {
    vi.stubGlobal('api', { ...createApiStub(), chat: { send: 'nope' } })
    const container = document.createElement('div')

    expect(() => assertPreloadBridge(container)).toThrow(/chat\.send/)
  })

  it('requires the chat.retry leaf', () => {
    vi.stubGlobal('api', { ...createApiStub(), chat: { send: createApiStub().chat.send } })
    const container = document.createElement('div')

    expect(() => assertPreloadBridge(container)).toThrow(/chat\.retry/)
  })

  it('names every missing leaf, not just the first', () => {
    vi.stubGlobal('api', {})
    const container = document.createElement('div')

    expect(() => assertPreloadBridge(container)).toThrow(/window\.reportContentHeight, chat\.send/)
  })

  it('requires the new settings and events leaves', () => {
    vi.stubGlobal('api', {})
    const container = document.createElement('div')

    expect(() => assertPreloadBridge(container)).toThrow(
      /settings\.get, settings\.setApiKey, settings\.setActiveProvider, events\.on/
    )
  })
})
