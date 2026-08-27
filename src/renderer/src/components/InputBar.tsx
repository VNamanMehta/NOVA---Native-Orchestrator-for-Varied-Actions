import { useEffect, useRef, useState, type FormEvent } from 'react'
import { matchCommand } from '../commands/registry'
import { useAppStore } from '../store/appStore'

interface InputBarProps {
  onSend: (text: string) => void
  disabled: boolean
}

const SHAKE_DURATION_MS = 400

const BLOCKED_SEND_MESSAGE = "Can't send — set your Grok API key in /settings first."

export function InputBar({ onSend, disabled }: InputBarProps): React.JSX.Element {
  const [draft, setDraft] = useState('')
  const [shakeCount, setShakeCount] = useState(0)
  const [announcement, setAnnouncement] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const store = useAppStore()
  const apiKeyConfigured = store.settings.apiKeyConfigured

  useEffect(() => {
    if (!disabled) inputRef.current?.focus()
  }, [disabled])

  // Imperative classList + forced reflow, not a boolean state flag — a
  // true->true update would be a React no-op and never replay the animation.
  useEffect(() => {
    if (shakeCount === 0) return
    const el = formRef.current
    if (!el) return
    el.classList.remove('animate-shake')
    void el.offsetWidth // force a reflow so the browser notices the removal
    el.classList.add('animate-shake')
    const timer = setTimeout(() => el.classList.remove('animate-shake'), SHAKE_DURATION_MS)
    return () => clearTimeout(timer)
  }, [shakeCount])

  // submit() clears the announcement; this effect only re-sets it deferred,
  // so a repeated identical message still triggers a real DOM mutation.
  useEffect(() => {
    if (shakeCount === 0) return
    const raf = requestAnimationFrame(() => setAnnouncement(BLOCKED_SEND_MESSAGE))
    return () => cancelAnimationFrame(raf)
  }, [shakeCount])

  const submit = (event: FormEvent): void => {
    event.preventDefault()
    const trimmed = draft.trim()
    if (trimmed.length === 0) return

    const command = matchCommand(trimmed)
    if (command) {
      command.run(store)
      setDraft('')
      return
    }

    if (!apiKeyConfigured) {
      setAnnouncement('')
      setShakeCount((count) => count + 1)
      setDraft('')
      return
    }

    onSend(trimmed)
    setDraft('')
  }

  return (
    <div className="shrink-0">
      <form
        ref={formRef}
        onSubmit={submit}
        className="flex h-16 items-center border-t border-border px-4"
      >
        <input
          ref={inputRef}
          aria-label="Message Nova"
          placeholder="Ask Nova…"
          value={draft}
          disabled={disabled}
          onChange={(event) => setDraft(event.target.value)}
          className="h-full w-full bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground"
        />
      </form>
      {!apiKeyConfigured && (
        <p
          data-testid="no-api-key-nudge"
          role="status"
          className="px-4 pb-3 text-xs text-destructive"
        >
          Set your Grok API key in /settings to start chatting.
        </p>
      )}
      <p role="alert" aria-live="assertive" className="sr-only">
        {announcement}
      </p>
    </div>
  )
}
