import { useEffect, useRef, useState, type FormEvent } from 'react'
import { matchCommand } from '../commands/registry'
import { useAppStore } from '../store/appStore'

interface InputBarProps {
  onSend: (text: string) => void
  disabled: boolean
}

const SHAKE_DURATION_MS = 400

export function InputBar({ onSend, disabled }: InputBarProps): React.JSX.Element {
  const [draft, setDraft] = useState('')
  const [shakeCount, setShakeCount] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const store = useAppStore()
  const apiKeyConfigured = store.settings.apiKeyConfigured

  useEffect(() => {
    if (!disabled) inputRef.current?.focus()
  }, [disabled])

  // Imperative classList toggle with a forced reflow, rather than a boolean
  // React state driving the class: a second blocked Enter within the
  // animation window would otherwise be a true->true no-op React bails on,
  // so the class never actually gets removed+reapplied and the animation
  // silently fails to replay. shakeCount increments unconditionally on
  // every blocked attempt, so this effect always re-runs and always forces
  // a fresh restart, however close together the attempts are.
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
      setShakeCount((count) => count + 1)
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
        <p data-testid="no-api-key-nudge" className="px-4 pb-3 text-xs text-destructive">
          Set your Grok API key in /settings to start chatting.
        </p>
      )}
    </div>
  )
}
