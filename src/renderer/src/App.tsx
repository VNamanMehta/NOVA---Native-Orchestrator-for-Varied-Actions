import { useRef } from 'react'
import { useReportContentHeight } from './hooks/useReportContentHeight'

function App(): React.JSX.Element {
  const contentRef = useRef<HTMLDivElement>(null)
  useReportContentHeight(contentRef)

  return <div ref={contentRef}>Nova</div>
}

export default App
