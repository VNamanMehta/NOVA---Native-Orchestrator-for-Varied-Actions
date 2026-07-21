import { describe, expect, it } from 'vitest'
import { RequestChannels, RequestValidators } from './ipc'

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

  it('declares a validator for every request channel', () => {
    for (const channel of Object.values(RequestChannels)) {
      expect(typeof RequestValidators[channel]).toBe('function')
    }
  })
})
