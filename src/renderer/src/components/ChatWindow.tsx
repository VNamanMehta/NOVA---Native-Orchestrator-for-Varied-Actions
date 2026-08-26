import { useEffect, useState } from 'react'
import { MAX_HEIGHT_FRACTION } from '../../../shared/layout'
import type { ChatMessage } from '../types/chat'
import { InputBar } from './InputBar'
import { MessageList } from './MessageList'

interface ChatWindowProps {
  messages: ChatMessage[]
  isPending: boolean
  onSend: (text: string) => void
  onRetry: (id: string) => void
}

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

export function ChatWindow({
  messages,
  isPending,
  onSend,
  onRetry
}: ChatWindowProps): React.JSX.Element {
  const maxPanelHeight = usePanelMaxHeight()

  return (
    <div
      className="flex flex-col overflow-hidden rounded-xl border border-border bg-background"
      style={maxPanelHeight ? { maxHeight: maxPanelHeight } : undefined}
    >
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
    </div>
  )
}
