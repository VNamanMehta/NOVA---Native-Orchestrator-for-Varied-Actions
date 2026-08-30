import { describe, expect, it, vi } from 'vitest'
import type { AppStore } from '../store/appStore'
import { matchCommand } from './registry'

function fakeStore(overrides: Partial<AppStore> = {}): AppStore {
  return {
    view: 'chat',
    settings: { activeProvider: 'grok', apiKeyConfigured: false },
    openSettings: vi.fn(),
    closeSettings: vi.fn(),
    setSettings: vi.fn(),
    ...overrides
  }
}

describe('matchCommand', () => {
  it('matches /settings and its run calls openSettings', () => {
    const store = fakeStore()
    const command = matchCommand('/settings')

    expect(command).toBeDefined()
    command?.run(store)
    expect(store.openSettings).toHaveBeenCalledTimes(1)
  })

  it('returns undefined for plain text', () => {
    expect(matchCommand('hello')).toBeUndefined()
  })

  it('returns undefined for an unknown command', () => {
    expect(matchCommand('/unknown')).toBeUndefined()
  })
})
