import Store from 'electron-store'
import type { ProviderId } from '../../shared/domain'

interface StoreSchema {
  activeProvider: ProviderId
}

function openStore(cwd: string): Store<StoreSchema> {
  return new Store<StoreSchema>({ cwd, defaults: { activeProvider: 'grok' } })
}

export function getActiveProvider(cwd: string): ProviderId {
  return openStore(cwd).get('activeProvider')
}

export function setActiveProvider(cwd: string, provider: ProviderId): void {
  openStore(cwd).set('activeProvider', provider)
}
