import type { ChatMessage } from '../types/chat'
import { cn } from '../lib/utils'

interface MessageItemProps {
  message: ChatMessage
  onRetry: (id: string) => void
  retryDisabled?: boolean
}

export function MessageItem({
  message,
  onRetry,
  retryDisabled = false
}: MessageItemProps): React.JSX.Element {
  const isUser = message.role === 'user'

  return (
    <div
      data-testid="message-item"
      data-role={message.role}
      data-status={message.status}
      className={cn('flex w-full', isUser ? 'justify-end' : 'justify-start')}
    >
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-3 py-2 text-sm',
          isUser ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
        )}
      >
        {message.status === 'error' && (
          <span className="flex flex-col items-start gap-1">
            <span className="text-destructive">{message.content}</span>
            {!isUser && (
              <button
                type="button"
                onClick={() => onRetry(message.id)}
                disabled={retryDisabled}
                className="text-xs underline disabled:cursor-not-allowed disabled:opacity-50"
              >
                Retry
              </button>
            )}
          </span>
        )}

        {message.status === 'complete' && message.content}
      </div>
    </div>
  )
}
