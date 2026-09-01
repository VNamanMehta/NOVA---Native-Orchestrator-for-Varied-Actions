import StoreImport from 'electron-store'
import type { ProviderId } from '../../shared/domain'
import { unwrapDefaultExport } from '../utils/esmInterop'

// electron-store is ESM-only and externalized by electron-vite's main
// build, which hits the require(esm) case unwrapDefaultExport handles.
const Store = unwrapDefaultExport(StoreImport)

interface StoreSchema {
  activeProvider: ProviderId
}

function openStore(cwd: string): InstanceType<typeof Store<StoreSchema>> {
  return new Store<StoreSchema>({ cwd, defaults: { activeProvider: 'groq' } })
}

export function getActiveProvider(cwd: string): ProviderId {
  return openStore(cwd).get('activeProvider')
}

export function setActiveProvider(cwd: string, provider: ProviderId): void {
  openStore(cwd).set('activeProvider', provider)
}
