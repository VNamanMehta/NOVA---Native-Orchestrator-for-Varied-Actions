export type MessageStatus = 'pending' | 'streaming' | 'complete' | 'error'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  status: MessageStatus
  errorMessage?: string
}
