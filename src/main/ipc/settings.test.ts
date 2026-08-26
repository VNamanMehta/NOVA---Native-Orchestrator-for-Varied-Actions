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
    decryptString: (buffer: Buffer) => buffer.toString().replace(/^enc:/, '')
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

  it('defaults to grok with no key configured', async () => {
    expect(await getSettings()).toEqual({ activeProvider: 'grok', apiKeyConfigured: false })
  })

  it('reflects a saved key in apiKeyConfigured', async () => {
    await saveApiKey('grok', 'sk-test')
    expect(await getSettings()).toEqual({ activeProvider: 'grok', apiKeyConfigured: true })
  })

  it('saves and reads back the active provider', async () => {
    await saveActiveProvider('grok')
    expect((await getSettings()).activeProvider).toBe('grok')
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
