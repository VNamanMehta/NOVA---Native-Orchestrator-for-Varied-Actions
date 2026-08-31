import { beforeEach, describe, expect, it, vi } from 'vitest'

const getActiveProvider = vi.fn()
const getApiKey = vi.fn()
const createGrokProviderMock = vi.fn((key: string) => ({ __grokKey: key }))

vi.mock('electron', () => ({ app: { getPath: () => '/fake/userData' } }))
vi.mock('../../config/store', () => ({
  getActiveProvider: (...args: unknown[]) => getActiveProvider(...args)
}))
vi.mock('../../config/secrets', () => ({
  getApiKey: (...args: unknown[]) => getApiKey(...args)
}))
vi.mock('./grok', () => ({
  createGrokProvider: (key: string) => createGrokProviderMock(key)
}))

import { createProvider } from './index'
import { ProviderError } from './types'

beforeEach(() => {
  getActiveProvider.mockReset()
  getApiKey.mockReset()
  createGrokProviderMock.mockClear()
})

describe('createProvider', () => {
  it('creates a grok provider using the stored api key', () => {
    getActiveProvider.mockReturnValue('grok')
    getApiKey.mockReturnValue('sk-test')

    const provider = createProvider()

    expect(getApiKey).toHaveBeenCalledWith('/fake/userData', 'grok')
    expect(createGrokProviderMock).toHaveBeenCalledWith('sk-test')
    expect(provider).toEqual({ __grokKey: 'sk-test' })
  })

  it('throws an AUTH ProviderError when no key is configured', () => {
    getActiveProvider.mockReturnValue('grok')
    getApiKey.mockReturnValue(null)

    let caught: unknown
    try {
      createProvider()
    } catch (err) {
      caught = err
    }

    expect(caught).toBeInstanceOf(ProviderError)
    expect((caught as ProviderError).code).toBe('AUTH')
  })

  it('throws an UNKNOWN ProviderError for a provider with no adapter implemented', () => {
    getActiveProvider.mockReturnValue('anthropic')
    getApiKey.mockReturnValue('sk-test')

    let caught: unknown
    try {
      createProvider()
    } catch (err) {
      caught = err
    }

    expect(caught).toBeInstanceOf(ProviderError)
    expect((caught as ProviderError).code).toBe('UNKNOWN')
  })
})
