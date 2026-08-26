import { useEffect, useRef } from 'react'
import type { ChatMessage } from '../types/chat'
import { MessageItem } from './MessageItem'

interface MessageListProps {
  messages: ChatMessage[]
  isPending: boolean
  onRetry: (id: string) => void
}

export function MessageList({
  messages,
  isPending,
  onRetry
}: MessageListProps): React.JSX.Element | null {
  const scrollRef = useRef<HTMLDivElement>(null)
  const visible = messages.filter((message) => message.status !== 'pending')

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages])

  if (visible.length === 0) return null

  return (
    <div
      ref={scrollRef}
      data-testid="message-list"
      className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-3 py-3 scrollbar-gutter-stable"
    >
      {visible.map((message) => (
        <MessageItem
          key={message.id}
          message={message}
          onRetry={onRetry}
          retryDisabled={isPending}
        />
      ))}
    </div>
  )
}
