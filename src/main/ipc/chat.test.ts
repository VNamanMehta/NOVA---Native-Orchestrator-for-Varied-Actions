import { describe, expect, it } from 'vitest'
import { echo } from './chat'
import { runSafely } from './safeHandle'

describe('echo', () => {
  it('returns the text as an assistant message', async () => {
    expect(await echo('hi')).toEqual({ role: 'assistant', content: 'hi' })
  })

  it('produces an IpcResult<Message> envelope when run through runSafely', async () => {
    expect(await runSafely(() => echo('hi'))).toEqual({
      ok: true,
      value: { role: 'assistant', content: 'hi' }
    })
  })
})
