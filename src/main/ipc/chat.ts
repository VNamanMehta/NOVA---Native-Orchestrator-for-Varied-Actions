import type { Message } from '../../shared/ipc'

// Phase 0 stand-in for the chat pipeline. Phase 1 replaces this body with the
// agent loop; the signature and the chat:send contract stay identical.
export async function echo(text: string): Promise<Message> {
  return { role: 'assistant', content: text }
}
