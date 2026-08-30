import { app } from 'electron'
import { isProviderEnabled, type ProviderId, type SettingsState } from '../../shared/domain'
import { hasApiKey, setApiKey as persistApiKey } from '../config/secrets'
import { getActiveProvider, setActiveProvider as persistActiveProvider } from '../config/store'

function userDataDir(): string {
  return app.getPath('userData')
}

export async function getSettings(): Promise<SettingsState> {
  const dir = userDataDir()
  const activeProvider = getActiveProvider(dir)
  return { activeProvider, apiKeyConfigured: hasApiKey(dir, activeProvider) }
}

export async function saveApiKey(provider: ProviderId, key: string): Promise<void> {
  persistApiKey(userDataDir(), provider, key)
}

export async function saveActiveProvider(provider: ProviderId): Promise<void> {
  if (!isProviderEnabled(provider)) {
    throw new Error(`${provider} is not enabled yet`)
  }
  persistActiveProvider(userDataDir(), provider)
}
