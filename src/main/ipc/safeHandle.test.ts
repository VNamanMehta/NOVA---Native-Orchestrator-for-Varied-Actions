import { describe, expect, it } from 'vitest'
import { runSafely } from './safeHandle'

describe('runSafely', () => {
  it('wraps a resolved value as ok', async () => {
    const result = await runSafely(async () => 42)
    expect(result).toEqual({ ok: true, value: 42 })
  })

  it('wraps a thrown Error as not-ok with its message', async () => {
    const result = await runSafely(async () => {
      throw new Error('boom')
    })
    expect(result).toEqual({ ok: false, error: { message: 'boom' } })
  })

  it('stringifies a non-Error throw', async () => {
    const result = await runSafely(async () => {
      throw 'nope'
    })
    expect(result).toEqual({ ok: false, error: { message: 'nope' } })
  })
})
