import { useState, type FormEvent } from 'react'

interface InputBarProps {
  onSend: (text: string) => void
  disabled: boolean
}

export function InputBar({ onSend, disabled }: InputBarProps): React.JSX.Element {
  const [draft, setDraft] = useState('')

  const submit = (event: FormEvent): void => {
    event.preventDefault()
    const trimmed = draft.trim()
    if (trimmed.length === 0) return
    onSend(trimmed)
    setDraft('')
  }

  return (
    <form onSubmit={submit} className="flex h-16 shrink-0 items-center px-4">
      <input
        aria-label="Message Nova"
        placeholder="Ask Nova…"
        value={draft}
        disabled={disabled}
        onChange={(event) => setDraft(event.target.value)}
        className="h-full w-full bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground"
      />
    </form>
  )
}
