export type ProviderId = 'groq' | 'anthropic' | 'openai' | 'ollama'

export const ALL_PROVIDERS: readonly ProviderId[] = ['groq', 'anthropic', 'openai', 'ollama']

export function isProviderId(value: unknown): value is ProviderId {
  return typeof value === 'string' && (ALL_PROVIDERS as readonly string[]).includes(value)
}

export const ENABLED_PROVIDERS: readonly ProviderId[] = ['groq']

export function isProviderEnabled(provider: ProviderId): boolean {
  return ENABLED_PROVIDERS.includes(provider)
}

export type AppView = 'chat' | 'settings'

export interface SettingsState {
  activeProvider: ProviderId
  apiKeyConfigured: boolean
}
