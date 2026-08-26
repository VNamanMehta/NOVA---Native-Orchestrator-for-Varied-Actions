// src/renderer/src/App.tsx
import { useEffect, useRef } from 'react'
import { MainToRendererChannels } from '../../shared/ipc'
import { useReportContentHeight } from './hooks/useReportContentHeight'
import { useConversation } from './hooks/useConversation'
import { useAppStore } from './store/appStore'
import { ChatWindow } from './components/ChatWindow'
import { SettingsPanel } from './components/SettingsPanel'

function App(): React.JSX.Element {
  const contentRef = useRef<HTMLDivElement>(null)
  useReportContentHeight(contentRef)
  const { messages, isPending, send, retry } = useConversation()

  const view = useAppStore((state) => state.view)
  const openSettings = useAppStore((state) => state.openSettings)
  const closeSettings = useAppStore((state) => state.closeSettings)
  const setSettings = useAppStore((state) => state.setSettings)

  useEffect(() => {
    window.api.settings.get().then((result) => {
      if (result.ok) setSettings(result.value)
    })
  }, [setSettings])

  useEffect(() => {
    return window.api.events.on(MainToRendererChannels.openSettings, () => openSettings())
  }, [openSettings])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') closeSettings()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [closeSettings])

  return (
    <div ref={contentRef}>
      <div key={view} className="animate-view-enter">
        {view === 'settings' ? (
          <SettingsPanel />
        ) : (
          <ChatWindow messages={messages} isPending={isPending} onSend={send} onRetry={retry} />
        )}
      </div>
    </div>
  )
}

export default App
