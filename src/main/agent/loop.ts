import { MainToRendererChannels, type Message } from '../../shared/ipc'
import { pushToRenderer } from '../ipc/push'
import * as conversation from './conversation'
import { createProvider } from './providers'
import { ProviderError } from './providers/types'

const SYSTEM_PROMPT =
  'You are Nova, a desktop assistant that chats with the user and, in later phases, ' +
  'acts on their machine. Keep replies concise.'

let activeAbort: AbortController | undefined

export function abortActiveStream(): void {
  activeAbort?.abort()
}

async function streamProvider(): Promise<Message> {
  const provider = createProvider()
  const messages = [
    { role: 'system' as const, content: SYSTEM_PROMPT },
    ...conversation.getHistory()
  ]
  const controller = new AbortController()
  activeAbort = controller
  let accumulated = ''

  try {
    for await (const event of provider.chat(messages, [], controller.signal)) {
      if (event.type === 'text_delta') {
        accumulated += event.delta
        pushToRenderer(MainToRendererChannels.chatToken, { token: event.delta })
      }
      if (event.type === 'done') {
        conversation.appendAssistant(event.message.content)
        return { role: 'assistant', content: event.message.content }
      }
    }
    throw new ProviderError('PROVIDER_ERROR', 'Stream ended without a reply.')
  } catch (err) {
    conversation.markLastTurnFailed(accumulated)
    throw err
  } finally {
    activeAbort = undefined
  }
}

export async function runTurn(text: string): Promise<Message> {
  // A new send after a failed turn replaces it rather than stacking on top.
  if (conversation.wasLastTurnFailed()) {
    conversation.popFailedAssistant()
  }
  conversation.appendUser(text)
  return streamProvider()
}

export async function retryLastTurn(): Promise<Message> {
  if (!conversation.wasLastTurnFailed()) {
    throw new ProviderError('UNKNOWN', 'Nothing to retry.')
  }
  conversation.popFailedAssistant()
  return streamProvider()
}
