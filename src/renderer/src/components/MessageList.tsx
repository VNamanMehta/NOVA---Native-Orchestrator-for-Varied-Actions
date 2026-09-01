import { useLayoutEffect, useRef } from 'react'
import type { ChatMessage } from '../types/chat'
import { MessageItem } from './MessageItem'

interface MessageListProps {
  messages: ChatMessage[]
  isPending: boolean
  onRetry: (id: string) => void
}

function prefersReducedMotion(): boolean {
  return typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function MessageList({
  messages,
  isPending,
  onRetry
}: MessageListProps): React.JSX.Element | null {
  const scrollRef = useRef<HTMLDivElement>(null)
  const hasScrolledOnceRef = useRef(false)
  const visible = messages.filter((message) => message.status !== 'pending')

  // Smooth after the first paint only — animating through history on
  // initial mount/view-swap would look wrong, so that one jumps instantly.
  useLayoutEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const smooth = hasScrolledOnceRef.current && !prefersReducedMotion()
    hasScrolledOnceRef.current = true
    if (smooth && typeof el.scrollTo === 'function') {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
    } else {
      el.scrollTop = el.scrollHeight
    }
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
