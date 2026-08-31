import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MainToRendererChannels } from '../../shared/ipc'
import { ProviderError } from './providers/types'
import type { ProviderEvent } from './providers/types'

const appendUser = vi.fn()
const appendAssistant = vi.fn()
const markLastTurnFailed = vi.fn()
const wasLastTurnFailed = vi.fn()
const popFailedAssistant = vi.fn()
const getHistory = vi.fn(() => [])

vi.mock('./conversation', () => ({
  appendUser: (...args: unknown[]) => appendUser(...args),
  appendAssistant: (...args: unknown[]) => appendAssistant(...args),
  markLastTurnFailed: (...args: unknown[]) => markLastTurnFailed(...args),
  wasLastTurnFailed: () => wasLastTurnFailed(),
  popFailedAssistant: () => popFailedAssistant(),
  getHistory: () => getHistory()
}))

const createProvider = vi.fn()
vi.mock('./providers', () => ({ createProvider: () => createProvider() }))

const pushToRenderer = vi.fn()
vi.mock('../ipc/push', () => ({
  pushToRenderer: (...args: unknown[]) => pushToRenderer(...args)
}))

import { abortActiveStream, retryLastTurn, runTurn } from './loop'

function fakeProvider(
  events: ProviderEvent[],
  throwAfter?: Error
): { chat: () => AsyncIterable<ProviderEvent> } {
  return {
    chat: async function* () {
      for (const event of events) yield event
      if (throwAfter) throw throwAfter
    }
  }
}

beforeEach(() => {
  appendUser.mockReset()
  appendAssistant.mockReset()
  markLastTurnFailed.mockReset()
  wasLastTurnFailed.mockReset()
  popFailedAssistant.mockReset()
  getHistory.mockReset().mockReturnValue([])
  createProvider.mockReset()
  pushToRenderer.mockReset()
})

describe('runTurn', () => {
  it('appends the user turn, pushes each delta, and appends the full reply on done', async () => {
    createProvider.mockReturnValue(
      fakeProvider([
        { type: 'text_delta', delta: 'Hel' },
        { type: 'text_delta', delta: 'lo' },
        { type: 'done', message: { role: 'assistant', content: 'Hello' } }
      ])
    )

    const result = await runTurn('hi')

    expect(appendUser).toHaveBeenCalledWith('hi')
    expect(pushToRenderer).toHaveBeenNthCalledWith(1, MainToRendererChannels.chatToken, {
      token: 'Hel'
    })
    expect(pushToRenderer).toHaveBeenNthCalledWith(2, MainToRendererChannels.chatToken, {
      token: 'lo'
    })
    expect(appendAssistant).toHaveBeenCalledWith('Hello')
    expect(result).toEqual({ role: 'assistant', content: 'Hello' })
  })

  it('marks the turn failed with whatever partial text streamed in before the provider threw', async () => {
    createProvider.mockReturnValue(
      fakeProvider([{ type: 'text_delta', delta: 'Hel' }], new ProviderError('NETWORK', 'dropped'))
    )

    await expect(runTurn('hi')).rejects.toMatchObject({ code: 'NETWORK' })
    expect(markLastTurnFailed).toHaveBeenCalledWith('Hel')
    expect(appendAssistant).not.toHaveBeenCalled()
  })

  it('marks the turn failed with empty content when the provider throws before any delta', async () => {
    createProvider.mockReturnValue(fakeProvider([], new ProviderError('AUTH', 'no key')))

    await expect(runTurn('hi')).rejects.toMatchObject({ code: 'AUTH' })
    expect(markLastTurnFailed).toHaveBeenCalledWith('')
  })

  it('throws a PROVIDER_ERROR when the stream ends with no done event', async () => {
    createProvider.mockReturnValue(fakeProvider([{ type: 'text_delta', delta: 'Hel' }]))

    await expect(runTurn('hi')).rejects.toMatchObject({ code: 'PROVIDER_ERROR' })
    expect(markLastTurnFailed).toHaveBeenCalledWith('Hel')
  })
})

describe('retryLastTurn', () => {
  it('throws when the last turn did not fail', async () => {
    wasLastTurnFailed.mockReturnValue(false)

    await expect(retryLastTurn()).rejects.toMatchObject({ code: 'UNKNOWN' })
    expect(popFailedAssistant).not.toHaveBeenCalled()
  })

  it('pops the failed entry and reruns the provider when the last turn failed', async () => {
    wasLastTurnFailed.mockReturnValue(true)
    createProvider.mockReturnValue(
      fakeProvider([{ type: 'done', message: { role: 'assistant', content: 'ok now' } }])
    )

    const result = await retryLastTurn()

    expect(popFailedAssistant).toHaveBeenCalled()
    expect(result).toEqual({ role: 'assistant', content: 'ok now' })
  })
})

describe('abortActiveStream', () => {
  it('aborts the signal passed to the active provider call', async () => {
    let capturedSignal: AbortSignal | undefined
    createProvider.mockReturnValue({
      chat: async function* (
        _messages: unknown,
        _tools: unknown,
        signal?: AbortSignal
      ): AsyncIterable<ProviderEvent> {
        capturedSignal = signal
        yield { type: 'text_delta', delta: 'Hel' }
        await new Promise((resolve) => setTimeout(resolve, 10))
        yield { type: 'done', message: { role: 'assistant', content: 'Hello' } }
      }
    })

    const pending = runTurn('hi')
    await new Promise((resolve) => setTimeout(resolve, 0))
    abortActiveStream()

    expect(capturedSignal?.aborted).toBe(true)
    await pending
  })

  it('is a no-op when no stream is active', () => {
    expect(() => abortActiveStream()).not.toThrow()
  })
})
