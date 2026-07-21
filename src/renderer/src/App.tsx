import { useRef } from 'react'
import { useReportContentHeight } from './hooks/useReportContentHeight'
import { useEcho } from './hooks/useEcho'

function App(): React.JSX.Element {
  const contentRef = useRef<HTMLDivElement>(null)
  useReportContentHeight(contentRef)
  const echoReply = useEcho()

  return (
    <div ref={contentRef}>
      Nova
      {echoReply && <span data-testid="echo-reply">{echoReply.content}</span>}
    </div>
  )
}

export default App
