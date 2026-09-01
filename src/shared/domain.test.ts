import { describe, expect, it } from 'vitest'
import { ENABLED_PROVIDERS, isProviderEnabled, isProviderId } from './domain'

describe('isProviderId', () => {
  it('accepts every known provider id', () => {
    expect(isProviderId('groq')).toBe(true)
    expect(isProviderId('anthropic')).toBe(true)
    expect(isProviderId('openai')).toBe(true)
    expect(isProviderId('ollama')).toBe(true)
  })

  it('rejects unknown strings and non-strings', () => {
    expect(isProviderId('bard')).toBe(false)
    expect(isProviderId(42)).toBe(false)
    expect(isProviderId(undefined)).toBe(false)
    expect(isProviderId(null)).toBe(false)
  })
})

describe('isProviderEnabled', () => {
  it('is true only for providers in ENABLED_PROVIDERS', () => {
    expect(isProviderEnabled('groq')).toBe(true)
    expect(isProviderEnabled('anthropic')).toBe(false)
    expect(isProviderEnabled('openai')).toBe(false)
    expect(isProviderEnabled('ollama')).toBe(false)
  })

  it('ENABLED_PROVIDERS currently contains only groq', () => {
    expect(ENABLED_PROVIDERS).toEqual(['groq'])
  })
})
