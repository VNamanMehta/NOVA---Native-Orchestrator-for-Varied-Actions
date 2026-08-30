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

// An undecryptable file (OS keychain reset, restored onto a different
// machine) is treated as no key saved, rather than throwing.
export function getApiKey(baseDir: string, provider: ProviderId): string | null {
  const path = secretPath(baseDir, provider)
  if (!existsSync(path)) return null
  try {
    return safeStorage.decryptString(readFileSync(path))
  } catch {
    return null
  }
}

// Own decrypt attempt instead of delegating to getApiKey, so a boolean-only
// caller never has the decrypted plaintext pass through its return value.
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

// A distinct, catchable message so the renderer can tell this apart from a
// generic save failure instead of collapsing every error to one string.
export const ENCRYPTION_UNAVAILABLE_MESSAGE =
  'OS secure storage is unavailable — Nova cannot save an API key on this machine.'

export function setApiKey(baseDir: string, provider: ProviderId, key: string): void {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error(ENCRYPTION_UNAVAILABLE_MESSAGE)
  }
  mkdirSync(secretsDir(baseDir), { recursive: true })
  writeFileSync(secretPath(baseDir, provider), safeStorage.encryptString(key))
}
