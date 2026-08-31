import { describe, expect, it } from 'vitest'
import { MainToRendererChannels, RequestChannels, RequestValidators } from './ipc'

describe('RequestValidators', () => {
  describe(RequestChannels.chatSend, () => {
    const validate = RequestValidators[RequestChannels.chatSend]

    it('passes a string through unchanged', () => {
      expect(validate('hi')).toBe('hi')
    })

    it('accepts the empty string', () => {
      expect(validate('')).toBe('')
    })

    it.each([
      ['undefined', undefined],
      ['null', null],
      ['a number', 42],
      ['an object', {}],
      ['an array', ['hi']],
      ['a boolean', true]
    ])('rejects %s rather than coercing it', (_label, payload) => {
      expect(() => validate(payload)).toThrow(/expects a string payload/)
    })
  })

  describe(RequestChannels.chatRetry, () => {
    const validate = RequestValidators[RequestChannels.chatRetry]

    it('accepts undefined (no payload)', () => {
      expect(validate(undefined)).toBeUndefined()
    })

    it('rejects a non-undefined payload', () => {
      expect(() => validate({})).toThrow(/expects no payload/)
    })
  })

  describe(RequestChannels.settingsGet, () => {
    const validate = RequestValidators[RequestChannels.settingsGet]

    it('accepts undefined (no payload)', () => {
      expect(validate(undefined)).toBeUndefined()
    })

    it('rejects a non-undefined payload', () => {
      expect(() => validate({})).toThrow(/expects no payload/)
    })
  })

  describe(RequestChannels.settingsSetApiKey, () => {
    const validate = RequestValidators[RequestChannels.settingsSetApiKey]

    it('passes a valid { provider, key } through unchanged', () => {
      expect(validate({ provider: 'grok', key: 'sk-test' })).toEqual({
        provider: 'grok',
        key: 'sk-test'
      })
    })

    it.each([
      ['not an object', 'grok'],
      ['missing provider', { key: 'sk-test' }],
      ['unknown provider', { provider: 'bard', key: 'sk-test' }],
      ['missing key', { provider: 'grok' }],
      ['non-string key', { provider: 'grok', key: 42 }],
      ['empty key', { provider: 'grok', key: '   ' }]
    ])('rejects %s', (_label, payload) => {
      expect(() => validate(payload)).toThrow(/expects \{ provider, key \}/)
    })
  })

  describe(RequestChannels.settingsSetActiveProvider, () => {
    const validate = RequestValidators[RequestChannels.settingsSetActiveProvider]

    it('passes a valid { provider } through unchanged', () => {
      expect(validate({ provider: 'anthropic' })).toEqual({ provider: 'anthropic' })
    })

    it.each([
      ['not an object', 'grok'],
      ['missing provider', {}],
      ['unknown provider', { provider: 'bard' }]
    ])('rejects %s', (_label, payload) => {
      expect(() => validate(payload)).toThrow(/expects \{ provider \}/)
    })
  })

  it('declares a validator for every request channel', () => {
    for (const channel of Object.values(RequestChannels)) {
      expect(typeof RequestValidators[channel]).toBe('function')
    }
  })
})

describe('MainToRendererChannels', () => {
  it('includes the open-settings push channel', () => {
    expect(MainToRendererChannels.openSettings).toBe('main->renderer:open-settings')
  })
})
