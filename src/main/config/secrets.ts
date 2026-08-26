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

export function hasApiKey(baseDir: string, provider: ProviderId): boolean {
  return existsSync(secretPath(baseDir, provider))
}

export function getApiKey(baseDir: string, provider: ProviderId): string | null {
  const path = secretPath(baseDir, provider)
  if (!existsSync(path)) return null
  return safeStorage.decryptString(readFileSync(path))
}

export function setApiKey(baseDir: string, provider: ProviderId, key: string): void {
  mkdirSync(secretsDir(baseDir), { recursive: true })
  writeFileSync(secretPath(baseDir, provider), safeStorage.encryptString(key))
}
