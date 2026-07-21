import { useEffect, useState } from 'react'
import type { Message } from '../../../shared/ipc'

/**
 * TEMPORARY Phase 0 probe: fires chat.send once on mount and exposes the typed
 * reply, proving the renderer->main->renderer round-trip end to end.
 * Delete when the real InputBar/ChatWindow consumes chat.send.
 */
export function useEcho(): Message | null {
  const [reply, setReply] = useState<Message | null>(null)

  useEffect(() => {
    let cancelled = false
    const pending = window.api?.chat?.send('ping')
    pending?.then((result) => {
      if (cancelled) return
      if (result.ok) {
        setReply(result.value)
      } else {
        console.error('echo failed:', result.error.message)
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  return reply
}
