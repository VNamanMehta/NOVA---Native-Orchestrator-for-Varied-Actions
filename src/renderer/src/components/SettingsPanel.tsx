import { useEffect, useState } from 'react'
import { isProviderEnabled, type ProviderId } from '../../../shared/domain'
import { useAppStore } from '../store/appStore'
import { cn } from '../lib/utils'

const PROVIDER_LABELS: Record<ProviderId, string> = {
  grok: 'Grok',
  anthropic: 'Anthropic',
  openai: 'OpenAI',
  ollama: 'Ollama (local)'
}

const ALL_PROVIDERS: ProviderId[] = ['grok', 'anthropic', 'openai', 'ollama']

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export function SettingsPanel(): React.JSX.Element {
  const settings = useAppStore((state) => state.settings)
  const setSettings = useAppStore((state) => state.setSettings)
  const closeSettings = useAppStore((state) => state.closeSettings)

  const [replacing, setReplacing] = useState(false)
  const [draftKey, setDraftKey] = useState('')
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')

  const showEditableField = !settings.apiKeyConfigured || replacing

  useEffect(() => {
    if (saveStatus !== 'saved') return
    const timer = setTimeout(() => setSaveStatus('idle'), 2000)
    return () => clearTimeout(timer)
  }, [saveStatus])

  async function handleSelectProvider(provider: ProviderId): Promise<void> {
    if (!isProviderEnabled(provider) || provider === settings.activeProvider) return
    const result = await window.api.settings.setActiveProvider(provider)
    if (result.ok) setSettings({ ...settings, activeProvider: provider })
  }

  async function handleSave(): Promise<void> {
    const trimmed = draftKey.trim()
    if (trimmed.length === 0) return
    setSaveStatus('saving')
    const result = await window.api.settings.setApiKey(settings.activeProvider, trimmed)
    if (result.ok) {
      setSettings({ ...settings, apiKeyConfigured: true })
      setDraftKey('')
      setReplacing(false)
      setSaveStatus('saved')
    } else {
      setSaveStatus('error')
    }
  }

  return (
    <div data-testid="settings-panel" className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-foreground">Settings</h2>
        <button
          type="button"
          onClick={closeSettings}
          className="text-xs text-muted-foreground underline"
        >
          Close
        </button>
      </div>

      <div role="radiogroup" aria-label="Provider" className="flex flex-col gap-1">
        {ALL_PROVIDERS.map((provider) => {
          const enabled = isProviderEnabled(provider)
          const selected = provider === settings.activeProvider
          return (
            <button
              key={provider}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={!enabled}
              onClick={() => handleSelectProvider(provider)}
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
            Couldn&apos;t save the key. Try again.
          </p>
        )}
      </div>
    </div>
  )
}
