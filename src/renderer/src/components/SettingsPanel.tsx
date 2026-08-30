import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import {
  ALL_PROVIDERS,
  ENABLED_PROVIDERS,
  isProviderEnabled,
  type ProviderId
} from '../../../shared/domain'
import { useAppStore } from '../store/appStore'
import { cn } from '../lib/utils'

const PROVIDER_LABELS: Record<ProviderId, string> = {
  grok: 'Grok',
  anthropic: 'Anthropic',
  openai: 'OpenAI',
  ollama: 'Ollama (local)'
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export function SettingsPanel(): React.JSX.Element {
  const settings = useAppStore((state) => state.settings)
  const setSettings = useAppStore((state) => state.setSettings)
  const closeSettings = useAppStore((state) => state.closeSettings)

  const [replacing, setReplacing] = useState(false)
  const [draftKey, setDraftKey] = useState('')
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [saveErrorMessage, setSaveErrorMessage] = useState('')
  const [returnToChatOnDismiss, setReturnToChatOnDismiss] = useState(false)
  const [tabStop, setTabStop] = useState(settings.activeProvider)
  const [syncedProvider, setSyncedProvider] = useState(settings.activeProvider)
  const radioRefs = useRef<Partial<Record<ProviderId, HTMLButtonElement | null>>>({})

  // Tab stop tracks focus, not the async-confirmed selection, so a failed
  // setActiveProvider can't strand it — adjusted during render, not an effect.
  if (settings.activeProvider !== syncedProvider) {
    setSyncedProvider(settings.activeProvider)
    setTabStop(settings.activeProvider)
  }

  const showEditableField = !settings.apiKeyConfigured || replacing

  useEffect(() => {
    if (saveStatus !== 'saved') return
    const timer = setTimeout(() => {
      setSaveStatus('idle')
      if (returnToChatOnDismiss) closeSettings()
    }, 2000)
    return () => clearTimeout(timer)
  }, [saveStatus, returnToChatOnDismiss, closeSettings])

  async function handleSelectProvider(provider: ProviderId): Promise<void> {
    if (!isProviderEnabled(provider) || provider === settings.activeProvider) return
    const result = await window.api.settings.setActiveProvider(provider)
    if (result.ok) setSettings({ ...settings, activeProvider: provider })
  }

  // Roving-tabindex radiogroup: arrow keys move selection and focus among
  // enabled rows only, wrapping at the ends.
  function handleRadioKeyDown(event: KeyboardEvent<HTMLButtonElement>): void {
    if (ENABLED_PROVIDERS.length === 0) return
    const direction =
      event.key === 'ArrowDown' || event.key === 'ArrowRight'
        ? 1
        : event.key === 'ArrowUp' || event.key === 'ArrowLeft'
          ? -1
          : 0
    if (direction === 0) return
    event.preventDefault()
    const currentIndex = ENABLED_PROVIDERS.indexOf(tabStop)
    const base = currentIndex === -1 ? 0 : currentIndex
    const next =
      ENABLED_PROVIDERS[(base + direction + ENABLED_PROVIDERS.length) % ENABLED_PROVIDERS.length]
    setTabStop(next)
    radioRefs.current[next]?.focus()
    void handleSelectProvider(next)
  }

  async function handleSave(): Promise<void> {
    const trimmed = draftKey.trim()
    if (trimmed.length === 0) return
    const isFirstConfiguration = !settings.apiKeyConfigured
    setSaveStatus('saving')
    const result = await window.api.settings.setApiKey(settings.activeProvider, trimmed)
    if (result.ok) {
      setSettings({ ...settings, apiKeyConfigured: true })
      setDraftKey('')
      setReplacing(false)
      setReturnToChatOnDismiss(isFirstConfiguration)
      setSaveStatus('saved')
    } else {
      setSaveErrorMessage(result.error.message)
      setSaveStatus('error')
    }
  }

  return (
    <div data-testid="settings-panel" className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center justify-between p-4 pb-0">
        <h2 className="text-sm font-medium text-foreground">Settings</h2>
        <button
          type="button"
          onClick={closeSettings}
          className="text-xs text-muted-foreground underline"
        >
          Close
        </button>
      </div>

      {/* Shares App's height clamp with chat now, so this needs the same
          internal-scroll escape hatch MessageList already has. */}
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4 scrollbar-gutter-stable">
        <div role="radiogroup" aria-label="Provider" className="flex flex-col gap-1">
          {ALL_PROVIDERS.map((provider) => {
            const enabled = isProviderEnabled(provider)
            const selected = provider === settings.activeProvider
            return (
              <button
                key={provider}
                ref={(el) => {
                  radioRefs.current[provider] = el
                }}
                type="button"
                role="radio"
                aria-checked={selected}
                disabled={!enabled}
                tabIndex={provider === tabStop ? 0 : -1}
                onClick={() => handleSelectProvider(provider)}
                onKeyDown={handleRadioKeyDown}
                className={cn(
                  'flex items-center justify-between rounded-md px-3 py-2 text-left text-sm',
                  selected ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground',
                  !enabled && 'cursor-not-allowed opacity-50'
                )}
              >
                <span>{PROVIDER_LABELS[provider]}</span>
                {!enabled && <span className="text-xs text-muted-foreground">Coming soon</span>}
              </button>
            )
          })}
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="api-key" className="text-xs text-muted-foreground">
            {PROVIDER_LABELS[settings.activeProvider]} API key
          </label>

          {showEditableField ? (
            <input
              id="api-key"
              type="password"
              value={draftKey}
              onChange={(event) => {
                setDraftKey(event.target.value)
                setSaveStatus('idle')
              }}
              placeholder="Paste your API key"
              className="rounded-md border border-border bg-transparent px-3 py-2 text-sm outline-none"
            />
          ) : (
            <div className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm text-muted-foreground">
              <span>API key configured</span>
              <button
                type="button"
                onClick={() => setReplacing(true)}
                className="text-xs text-foreground underline"
              >
                Replace
              </button>
            </div>
          )}

          {showEditableField && (
            <button
              type="button"
              onClick={handleSave}
              disabled={draftKey.trim().length === 0 || saveStatus === 'saving'}
              className="self-start rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground disabled:opacity-50"
            >
              {saveStatus === 'saving' ? 'Saving…' : 'Save'}
            </button>
          )}

          {saveStatus === 'saved' && (
            <p data-testid="save-confirmation" className="text-xs text-primary">
              Saved
            </p>
          )}
          {saveStatus === 'error' && (
            <p data-testid="save-error" className="text-xs text-destructive">
              {saveErrorMessage || "Couldn't save the key. Try again."}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
