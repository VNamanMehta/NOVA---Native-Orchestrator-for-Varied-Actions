import type { ChatMessage } from '../types/chat'
import { InputBar } from './InputBar'
import { MessageList } from './MessageList'

interface ChatWindowProps {
  messages: ChatMessage[]
  isPending: boolean
  onSend: (text: string) => void
  onRetry: (id: string) => void
}

export function ChatWindow({
  messages,
  isPending,
  onSend,
  onRetry
}: ChatWindowProps): React.JSX.Element {
  return (
    <>
      <MessageList messages={messages} isPending={isPending} onRetry={onRetry} />
      <InputBar onSend={onSend} disabled={isPending} />
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
