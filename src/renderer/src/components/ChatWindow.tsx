import type { ChatMessage } from '../types/chat'
import { InputBar } from './InputBar'
import { MessageList } from './MessageList'

interface ChatWindowProps {
  messages: ChatMessage[]
  isPending: boolean
  onSend: (text: string) => void
  onRetry: (id: string) => void
}

const MAX_PANEL_HEIGHT = Math.floor((globalThis.screen?.availHeight ?? 0) * 0.5)

export function ChatWindow({
  messages,
  isPending,
  onSend,
  onRetry
}: ChatWindowProps): React.JSX.Element {
  return (
    <div
      className="flex flex-col overflow-hidden rounded-xl border border-border bg-background"
      style={MAX_PANEL_HEIGHT ? { maxHeight: MAX_PANEL_HEIGHT } : undefined}
    >
      <MessageList messages={messages} onRetry={onRetry} />
      <InputBar onSend={onSend} disabled={isPending} />
      {isPending && (
        <div
          data-testid="pending-indicator"
          className="shrink-0 animate-pulse px-4 pb-3 text-sm text-muted-foreground"
        >
          Nova is thinking…
        </div>
      )}
    </div>
  )
}
