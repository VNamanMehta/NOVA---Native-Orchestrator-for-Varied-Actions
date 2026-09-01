import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mkdtempSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

let userDataDir: string

vi.mock('electron', () => ({
  app: {
    getPath: () => userDataDir
  },
  safeStorage: {
    encryptString: (value: string) => Buffer.from(`enc:${value}`),
    decryptString: (buffer: Buffer) => buffer.toString().replace(/^enc:/, ''),
    isEncryptionAvailable: () => true
  }
}))

import { runSafely } from './safeHandle'
import { getSettings, saveActiveProvider, saveApiKey } from './settings'

describe('settings', () => {
  beforeEach(() => {
    userDataDir = mkdtempSync(join(tmpdir(), 'nova-settings-test-'))
  })

  afterEach(() => {
    rmSync(userDataDir, { recursive: true, force: true })
  })

  it('defaults to groq with no key configured', async () => {
    expect(await getSettings()).toEqual({ activeProvider: 'groq', apiKeyConfigured: false })
  })

  it('reflects a saved key in apiKeyConfigured', async () => {
    await saveApiKey('groq', 'sk-test')
    expect(await getSettings()).toEqual({ activeProvider: 'groq', apiKeyConfigured: true })
  })

  it('saves and reads back the active provider', async () => {
    await saveActiveProvider('groq')
    expect((await getSettings()).activeProvider).toBe('groq')
  })

  it('rejects activating a provider that is not enabled', async () => {
    await expect(saveActiveProvider('anthropic')).rejects.toThrow(/not enabled/)
  })

  it('wraps the not-enabled rejection in an IpcResult when run through runSafely', async () => {
    expect(await runSafely(() => saveActiveProvider('anthropic'))).toEqual({
      ok: false,
      error: { message: expect.stringContaining('not enabled') }
    })
  })
})
