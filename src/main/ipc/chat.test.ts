import { describe, expect, it, vi } from 'vitest'

const runTurn = vi.fn()
const retryLastTurnInLoop = vi.fn()

vi.mock('../agent/loop', () => ({
  runTurn: (...args: unknown[]) => runTurn(...args),
  retryLastTurn: (...args: unknown[]) => retryLastTurnInLoop(...args)
}))

import { ProviderError } from '../agent/providers/types'
import { retryLastTurn, sendMessage } from './chat'
import { runSafely } from './safeHandle'

describe('sendMessage', () => {
  it('delegates to the agent loop', async () => {
    runTurn.mockResolvedValue({ role: 'assistant', content: 'hi' })

    expect(await sendMessage('hello')).toEqual({ role: 'assistant', content: 'hi' })
    expect(runTurn).toHaveBeenCalledWith('hello')
  })

  it('wraps a thrown ProviderError with its code when run through runSafely', async () => {
    runTurn.mockRejectedValue(new ProviderError('AUTH', 'No API key configured for groq.'))

    expect(await runSafely(() => sendMessage('hello'))).toEqual({
      ok: false,
      error: { message: 'No API key configured for groq.', code: 'AUTH' }
    })
  })
})

describe('retryLastTurn', () => {
  it('delegates to the agent loop', async () => {
    retryLastTurnInLoop.mockResolvedValue({ role: 'assistant', content: 'ok now' })

    expect(await retryLastTurn()).toEqual({ role: 'assistant', content: 'ok now' })
    expect(retryLastTurnInLoop).toHaveBeenCalled()
  })
})
