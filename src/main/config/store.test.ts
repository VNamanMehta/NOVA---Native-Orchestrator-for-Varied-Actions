import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdtempSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { getActiveProvider, setActiveProvider } from './store'

describe('store', () => {
  let dir: string

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'nova-store-test-'))
  })

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true })
  })

  it('defaults to groq when nothing has been saved', () => {
    expect(getActiveProvider(dir)).toBe('groq')
  })

  it('persists the active provider across separate calls', () => {
    setActiveProvider(dir, 'anthropic')
    expect(getActiveProvider(dir)).toBe('anthropic')
  })

  it('keeps separate cwds independent', () => {
    const otherDir = mkdtempSync(join(tmpdir(), 'nova-store-test-'))
    try {
      setActiveProvider(dir, 'anthropic')
      expect(getActiveProvider(otherDir)).toBe('groq')
    } finally {
      rmSync(otherDir, { recursive: true, force: true })
    }
  })
})
