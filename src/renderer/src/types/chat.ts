export type MessageStatus = 'pending' | 'complete' | 'error'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  status: MessageStatus
}
