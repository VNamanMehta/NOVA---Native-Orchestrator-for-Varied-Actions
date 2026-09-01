import type { ChatMessage } from '../types/chat'
import { InputBar } from './InputBar'
import { MessageList } from './MessageList'

interface ChatWindowProps {
  messages: ChatMessage[]
  isPending: boolean
  isAwaitingReply: boolean
  onSend: (text: string) => void
  onRetry: (id: string) => void
}

export function ChatWindow({
  messages,
  isPending,
  isAwaitingReply,
  onSend,
  onRetry
}: ChatWindowProps): React.JSX.Element {
  return (
    <>
      <MessageList messages={messages} isPending={isPending} onRetry={onRetry} />
      <InputBar onSend={onSend} disabled={isAwaitingReply} isPending={isPending} />
    </>
  )
}
