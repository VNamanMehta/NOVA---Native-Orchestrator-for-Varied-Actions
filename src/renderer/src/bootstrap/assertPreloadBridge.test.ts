import { afterEach, describe, expect, it, vi } from 'vitest'
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
})
