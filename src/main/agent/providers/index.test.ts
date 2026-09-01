import { beforeEach, describe, expect, it, vi } from 'vitest'

const getActiveProvider = vi.fn()
const getApiKey = vi.fn()
const createGroqProviderMock = vi.fn((key: string) => ({ __groqKey: key }))

vi.mock('electron', () => ({ app: { getPath: () => '/fake/userData' } }))
vi.mock('../../config/store', () => ({
  getActiveProvider: (...args: unknown[]) => getActiveProvider(...args)
}))
vi.mock('../../config/secrets', () => ({
  getApiKey: (...args: unknown[]) => getApiKey(...args)
}))
vi.mock('./groq', () => ({
  createGroqProvider: (key: string) => createGroqProviderMock(key)
}))

import { createProvider } from './index'
import { ProviderError } from './types'

beforeEach(() => {
  getActiveProvider.mockReset()
  getApiKey.mockReset()
  createGroqProviderMock.mockClear()
})

describe('createProvider', () => {
  it('creates a groq provider using the stored api key', () => {
    getActiveProvider.mockReturnValue('groq')
    getApiKey.mockReturnValue('sk-test')

    const provider = createProvider()

    expect(getApiKey).toHaveBeenCalledWith('/fake/userData', 'groq')
    expect(createGroqProviderMock).toHaveBeenCalledWith('sk-test')
    expect(provider).toEqual({ __groqKey: 'sk-test' })
  })

  it('throws an AUTH ProviderError when no key is configured', () => {
    getActiveProvider.mockReturnValue('groq')
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
