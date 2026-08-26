import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mkdtempSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

const encryptString = vi.fn((value: string) => Buffer.from(`enc:${value}`))
const decryptString = vi.fn((buffer: Buffer) => buffer.toString().replace(/^enc:/, ''))

vi.mock('electron', () => ({
  safeStorage: {
    encryptString: (value: string) => encryptString(value),
    decryptString: (buffer: Buffer) => decryptString(buffer)
  }
}))

import { getApiKey, hasApiKey, setApiKey } from './secrets'

describe('secrets', () => {
  let dir: string

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'nova-secrets-test-'))
  })

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true })
    encryptString.mockClear()
    decryptString.mockClear()
  })

  it('returns null when no key has been saved for a provider', () => {
    expect(getApiKey(dir, 'grok')).toBeNull()
  })

  it('reports hasApiKey false when nothing is saved', () => {
    expect(hasApiKey(dir, 'grok')).toBe(false)
  })

  it('round-trips a saved key through safeStorage', () => {
    setApiKey(dir, 'grok', 'sk-test-123')

    expect(hasApiKey(dir, 'grok')).toBe(true)
    expect(getApiKey(dir, 'grok')).toBe('sk-test-123')
    expect(encryptString).toHaveBeenCalledWith('sk-test-123')
  })

  it('keeps keys for different providers separate', () => {
    setApiKey(dir, 'grok', 'grok-key')
    setApiKey(dir, 'anthropic', 'anthropic-key')

    expect(getApiKey(dir, 'grok')).toBe('grok-key')
    expect(getApiKey(dir, 'anthropic')).toBe('anthropic-key')
  })
})
