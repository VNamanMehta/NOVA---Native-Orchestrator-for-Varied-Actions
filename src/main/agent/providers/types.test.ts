import { describe, expect, it } from 'vitest'
import { ProviderError } from './types'

describe('ProviderError', () => {
  it('is a real Error carrying a provider error code', () => {
    const err = new ProviderError('AUTH', 'No API key configured for grok.')

    expect(err).toBeInstanceOf(Error)
    expect(err.code).toBe('AUTH')
    expect(err.message).toBe('No API key configured for grok.')
  })

  it.each(['AUTH', 'RATE_LIMIT', 'NETWORK', 'PROVIDER_ERROR', 'UNKNOWN'] as const)(
    'accepts the %s code',
    (code) => {
      expect(new ProviderError(code, 'x').code).toBe(code)
    }
  )
})
