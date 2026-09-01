import { beforeEach, describe, expect, it, vi } from 'vitest'
import type * as ConversationModule from './conversation'

let conversation: typeof ConversationModule

beforeEach(async () => {
  vi.resetModules()
  conversation = await import('./conversation')
})

describe('conversation', () => {
  it('starts empty', () => {
    expect(conversation.getHistory()).toEqual([])
  })

  it('appends a user message', () => {
    conversation.appendUser('hi')
    expect(conversation.getHistory()).toEqual([{ role: 'user', content: 'hi' }])
  })

  it('appends an assistant message and clears the failed flag', () => {
    conversation.appendUser('hi')
    conversation.markLastTurnFailed('partial')

    conversation.appendAssistant('full reply')

    expect(conversation.wasLastTurnFailed()).toBe(false)
    expect(conversation.getHistory()).toEqual([
      { role: 'user', content: 'hi' },
      { role: 'assistant', content: 'partial' },
      { role: 'assistant', content: 'full reply' }
    ])
  })

  it('marks the last turn failed and appends whatever partial content arrived', () => {
    conversation.appendUser('hi')
    conversation.markLastTurnFailed('partial reply')

    expect(conversation.wasLastTurnFailed()).toBe(true)
    expect(conversation.getHistory()).toEqual([
      { role: 'user', content: 'hi' },
      { role: 'assistant', content: 'partial reply' }
    ])
  })

  it('accepts an empty partial content on failure', () => {
    conversation.appendUser('hi')
    conversation.markLastTurnFailed('')

    expect(conversation.wasLastTurnFailed()).toBe(true)
    expect(conversation.getHistory()).toEqual([
      { role: 'user', content: 'hi' },
      { role: 'assistant', content: '' }
    ])
  })

  it('pops the failed assistant entry, leaving the user turn intact', () => {
    conversation.appendUser('hi')
    conversation.markLastTurnFailed('partial')

    conversation.popFailedAssistant()

    expect(conversation.wasLastTurnFailed()).toBe(false)
    expect(conversation.getHistory()).toEqual([{ role: 'user', content: 'hi' }])
  })

  it('does nothing when popFailedAssistant is called with no failed turn', () => {
    conversation.appendUser('hi')
    conversation.appendAssistant('reply')

    conversation.popFailedAssistant()

    expect(conversation.getHistory()).toEqual([
      { role: 'user', content: 'hi' },
      { role: 'assistant', content: 'reply' }
    ])
  })
})
