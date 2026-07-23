import type { ChatMessage } from '../types/chat'
import { MessageItem } from './MessageItem'

interface MessageListProps {
  messages: ChatMessage[]
  onRetry: (id: string) => void
}

export function MessageList({ messages, onRetry }: MessageListProps): React.JSX.Element | null {
  if (messages.length === 0) return null

  const newestFirst = [...messages].reverse()

  return (
    <div data-testid="message-list" className="flex flex-col gap-2 px-3 py-2">
      {newestFirst.map((message) => (
        <MessageItem key={message.id} message={message} onRetry={onRetry} />
      ))}
    </div>
  )
}
