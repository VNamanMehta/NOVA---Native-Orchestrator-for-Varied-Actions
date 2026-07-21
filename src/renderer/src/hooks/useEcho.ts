import { useEffect, useState } from 'react'
import type { Message } from '../../../shared/ipc'

// TEMPORARY Phase 0 probe proving the round-trip end to end.
// Delete when the real InputBar/ChatWindow consumes chat.send.
export function useEcho(): Message | null {
  const [reply, setReply] = useState<Message | null>(null)

  useEffect(() => {
    let cancelled = false
    window.api.chat.send('ping').then(
      (result) => {
        if (cancelled) return
        if (result.ok) {
          setReply(result.value)
        } else {
          console.error('echo failed:', result.error.message)
        }
      },
      (err: unknown) => {
        if (cancelled) return
        console.error('echo failed to reach main:', err)
      }
    )

    return () => {
      cancelled = true
    }
  }, [])

  return reply
}
