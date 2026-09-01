import type { ChatMessage } from '../types/chat'
import { InputBar } from './InputBar'
import { MessageList } from './MessageList'

interface ChatWindowProps {
  messages: ChatMessage[]
  isPending: boolean
  isAwaitingReply: boolean
  hasFailedTurn: boolean
  onSend: (text: string) => void
  onRetry: (id: string) => void
}

export function ChatWindow({
  messages,
  isPending,
  isAwaitingReply,
  hasFailedTurn,
  onSend,
  onRetry
}: ChatWindowProps): React.JSX.Element {
  const lastMessage = messages.length > 0 ? messages[messages.length - 1] : undefined
  const retryFailedTurn = (): void => {
    if (hasFailedTurn && lastMessage) onRetry(lastMessage.id)
  }

  return (
    <>
      <MessageList messages={messages} isPending={isPending} onRetry={onRetry} />
      <InputBar
        onSend={onSend}
        disabled={isAwaitingReply}
        blockedByFailedTurn={hasFailedTurn}
        onRetryFailedTurn={retryFailedTurn}
      />
      {isPending && (
        <div
          data-testid="pending-indicator"
          className="shrink-0 animate-pulse px-4 pb-3 text-sm text-muted-foreground"
        >
          Nova is thinking…
        </div>
      )}
    </>
  )
}
