import { useEffect, useRef, useState, type FormEvent } from 'react'
import { matchCommand } from '../commands/registry'
import { useAppStore } from '../store/appStore'
import { cn } from '../lib/utils'

interface InputBarProps {
  onSend: (text: string) => void
  disabled: boolean
}

const SHAKE_DURATION_MS = 400

export function InputBar({ onSend, disabled }: InputBarProps): React.JSX.Element {
  const [draft, setDraft] = useState('')
  const [shake, setShake] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const store = useAppStore()
  const apiKeyConfigured = store.settings.apiKeyConfigured

  useEffect(() => {
    if (!disabled) inputRef.current?.focus()
  }, [disabled])

  useEffect(() => {
    if (!shake) return
    const timer = setTimeout(() => setShake(false), SHAKE_DURATION_MS)
    return () => clearTimeout(timer)
  }, [shake])

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
      setShake(true)
      return
    }

    onSend(trimmed)
    setDraft('')
  }

  return (
    <div className="shrink-0">
      <form
        onSubmit={submit}
        className={cn(
          'flex h-16 items-center border-t border-border px-4',
          shake && 'animate-shake'
        )}
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
        <p data-testid="no-api-key-nudge" className="px-4 pb-3 text-xs text-destructive">
          Set your Grok API key in /settings to start chatting.
        </p>
      )}
    </div>
  )
}
