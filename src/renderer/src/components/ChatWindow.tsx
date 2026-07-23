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
    <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-background/80 backdrop-blur-xl">
      <InputBar onSend={onSend} disabled={isPending} />
      <MessageList messages={messages} onRetry={onRetry} />
    </div>
  )
}
