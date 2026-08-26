import { safeStorage } from 'electron'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import type { ProviderId } from '../../shared/domain'

function secretsDir(baseDir: string): string {
  return join(baseDir, 'secrets')
}

function secretPath(baseDir: string, provider: ProviderId): string {
  return join(secretsDir(baseDir), `${provider}.enc`)
}

// A saved-but-undecryptable file (OS keychain reset, profile restored onto a
// different machine/user) is treated the same as "no key saved" by both
// functions below, rather than surfacing a raw decrypt error to the caller.
// hasApiKey has its own try/catch instead of delegating to getApiKey so a
// boolean-only caller (e.g. every settings:get) never has the decrypted
// plaintext pass through its return value, even transiently.

export function getApiKey(baseDir: string, provider: ProviderId): string | null {
  const path = secretPath(baseDir, provider)
  if (!existsSync(path)) return null
  try {
    return safeStorage.decryptString(readFileSync(path))
  } catch {
    return null
  }
}

export function hasApiKey(baseDir: string, provider: ProviderId): boolean {
  const path = secretPath(baseDir, provider)
  if (!existsSync(path)) return false
  try {
    safeStorage.decryptString(readFileSync(path))
    return true
  } catch {
    return false
  }
}

export function setApiKey(baseDir: string, provider: ProviderId, key: string): void {
  mkdirSync(secretsDir(baseDir), { recursive: true })
  writeFileSync(secretPath(baseDir, provider), safeStorage.encryptString(key))
}
