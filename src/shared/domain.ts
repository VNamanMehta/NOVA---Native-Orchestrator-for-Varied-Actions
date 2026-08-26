export type ProviderId = 'grok' | 'anthropic' | 'openai' | 'ollama'

const PROVIDER_IDS: readonly ProviderId[] = ['grok', 'anthropic', 'openai', 'ollama']

export function isProviderId(value: unknown): value is ProviderId {
  return typeof value === 'string' && (PROVIDER_IDS as readonly string[]).includes(value)
}

export const ENABLED_PROVIDERS: readonly ProviderId[] = ['grok']

export function isProviderEnabled(provider: ProviderId): boolean {
  return ENABLED_PROVIDERS.includes(provider)
}

export type AppView = 'chat' | 'settings'

export interface SettingsState {
  activeProvider: ProviderId
  apiKeyConfigured: boolean
}
