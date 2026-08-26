// src/renderer/src/components/InputBar.tsx
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { matchCommand } from '../commands/registry'
import { useAppStore } from '../store/appStore'

interface InputBarProps {
  onSend: (text: string) => void
  disabled: boolean
}

export function InputBar({ onSend, disabled }: InputBarProps): React.JSX.Element {
  const [draft, setDraft] = useState('')
  const [showNudge, setShowNudge] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const store = useAppStore()

  useEffect(() => {
    if (!disabled) inputRef.current?.focus()
  }, [disabled])

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

    if (!store.settings.apiKeyConfigured) {
      setShowNudge(true)
      return
    }

    onSend(trimmed)
    setDraft('')
  }

  return (
    <div className="shrink-0">
      <form onSubmit={submit} className="flex h-16 items-center border-t border-border px-4">
        <input
          ref={inputRef}
          aria-label="Message Nova"
          placeholder="Ask Nova…"
          value={draft}
          disabled={disabled}
          onChange={(event) => {
            setDraft(event.target.value)
            setShowNudge(false)
          }}
          className="h-full w-full bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground"
        />
      </form>
      {showNudge && (
        <p data-testid="no-api-key-nudge" className="px-4 pb-3 text-xs text-muted-foreground">
          Set your Grok API key in /settings to start chatting.
        </p>
      )}
    </div>
  )
}
