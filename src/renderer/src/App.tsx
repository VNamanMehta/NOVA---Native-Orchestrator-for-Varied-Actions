import { useRef } from 'react'
import { useReportContentHeight } from './hooks/useReportContentHeight'
import { useConversation } from './hooks/useConversation'
import { ChatWindow } from './components/ChatWindow'

function App(): React.JSX.Element {
  const contentRef = useRef<HTMLDivElement>(null)
  useReportContentHeight(contentRef)
  const { messages, isPending, send, retry } = useConversation()

  return (
    <div ref={contentRef}>
      <ChatWindow messages={messages} isPending={isPending} onSend={send} onRetry={retry} />
    </div>
  )
}

export default App
