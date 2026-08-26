import { useEffect, useRef, useState } from 'react'
import { MainToRendererChannels } from '../../shared/ipc'
import { MAX_HEIGHT_FRACTION } from '../../shared/layout'
import { useReportContentHeight } from './hooks/useReportContentHeight'
import { useConversation } from './hooks/useConversation'
import { useAppStore } from './store/appStore'
import { ChatWindow } from './components/ChatWindow'
import { SettingsPanel } from './components/SettingsPanel'

function computeMaxPanelHeight(): number {
  return Math.floor((globalThis.screen?.availHeight ?? 0) * MAX_HEIGHT_FRACTION)
}

// A move to a same-size display doesn't fire 'resize' (only the window's
// position changes), so also recompute on focus/visibilitychange —
// showWindow() in src/main/window.ts calls show()+focus() on every
// hotkey/tray summon, which is exactly when the window may have landed on a
// new display. Stopgap until main pushes the target display's work area
// over IPC.
function usePanelMaxHeight(): number {
  const [maxHeight, setMaxHeight] = useState(computeMaxPanelHeight)

  useEffect(() => {
    const recompute = (): void => setMaxHeight(computeMaxPanelHeight())
    globalThis.addEventListener?.('resize', recompute)
    globalThis.addEventListener?.('focus', recompute)
    document.addEventListener?.('visibilitychange', recompute)
    return () => {
      globalThis.removeEventListener?.('resize', recompute)
      globalThis.removeEventListener?.('focus', recompute)
      document.removeEventListener?.('visibilitychange', recompute)
    }
  }, [])

  return maxHeight
}

function App(): React.JSX.Element {
  const contentRef = useRef<HTMLDivElement>(null)
  useReportContentHeight(contentRef)
  const { messages, isPending, send, retry } = useConversation()
  const maxPanelHeight = usePanelMaxHeight()

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
      <div
        key={view}
        className="flex flex-col overflow-hidden rounded-xl border border-border bg-background animate-view-enter"
        style={maxPanelHeight ? { maxHeight: maxPanelHeight } : undefined}
      >
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
