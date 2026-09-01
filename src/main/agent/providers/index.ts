import { app } from 'electron'
import { getApiKey } from '../../config/secrets'
import { getActiveProvider } from '../../config/store'
import { createGroqProvider } from './groq'
import { ProviderError } from './types'
import type { LLMProvider } from './types'

export function createProvider(): LLMProvider {
  const dir = app.getPath('userData')
  const provider = getActiveProvider(dir)
  const apiKey = getApiKey(dir, provider)

  if (!apiKey) {
    throw new ProviderError('AUTH', `No API key configured for ${provider}.`)
  }

  switch (provider) {
    case 'groq':
      return createGroqProvider(apiKey)
    default:
      throw new ProviderError('UNKNOWN', `${provider} is not implemented yet.`)
  }
}
