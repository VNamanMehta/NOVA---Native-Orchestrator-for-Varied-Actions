import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { createApiStub } from '../../../../vitest.setup'
import { useAppStore } from '../store/appStore'
import { SettingsPanel } from './SettingsPanel'

describe('SettingsPanel', () => {
  it('renders every provider, with only Grok selectable', () => {
    render(<SettingsPanel />)

    const grok = screen.getByRole('radio', { name: /grok/i })
    expect(grok).toHaveAttribute('aria-checked', 'true')
    expect(grok).toBeEnabled()

    for (const name of [/anthropic/i, /openai/i, /ollama/i]) {
      expect(screen.getByRole('radio', { name })).toBeDisabled()
    }
    expect(screen.getAllByText('Coming soon')).toHaveLength(3)
  })

  it('shows an empty editable key field with Save disabled when no key is configured', () => {
    render(<SettingsPanel />)

    expect(screen.getByPlaceholderText('Paste your API key')).toHaveValue('')
    expect(screen.getByRole('button', { name: /save/i })).toBeDisabled()
  })

  it('saves a typed key, shows confirmation, and switches to the configured view', async () => {
    const setApiKey = vi.fn(async () => ({ ok: true as const, value: undefined }))
    vi.stubGlobal('api', {
      ...createApiStub(),
      settings: { ...createApiStub().settings, setApiKey }
    })
    const user = userEvent.setup()
    render(<SettingsPanel />)

    await user.type(screen.getByPlaceholderText('Paste your API key'), 'sk-test-123')
    await user.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => expect(screen.getByTestId('save-confirmation')).toBeInTheDocument())
    expect(setApiKey).toHaveBeenCalledWith('grok', 'sk-test-123')
    expect(screen.getByText('API key configured')).toBeInTheDocument()
  })

  it('shows a configured placeholder with Replace when a key already exists', () => {
    useAppStore.setState({ settings: { activeProvider: 'grok', apiKeyConfigured: true } })
    render(<SettingsPanel />)

    expect(screen.getByText('API key configured')).toBeInTheDocument()
    expect(screen.queryByPlaceholderText('Paste your API key')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Replace' }))
    expect(screen.getByPlaceholderText('Paste your API key')).toBeInTheDocument()
  })

  it('does not activate a disabled provider on click', () => {
    const setActiveProvider = vi.fn()
    vi.stubGlobal('api', {
      ...createApiStub(),
      settings: { ...createApiStub().settings, setActiveProvider }
    })
    render(<SettingsPanel />)

    fireEvent.click(screen.getByRole('radio', { name: /anthropic/i }))

    expect(setActiveProvider).not.toHaveBeenCalled()
  })

  it('shows an error message when saving the key fails', async () => {
    const setApiKey = vi.fn(async () => ({ ok: false as const, error: { message: 'boom' } }))
    vi.stubGlobal('api', {
      ...createApiStub(),
      settings: { ...createApiStub().settings, setApiKey }
    })
    const user = userEvent.setup()
    render(<SettingsPanel />)

    await user.type(screen.getByPlaceholderText('Paste your API key'), 'sk-test-123')
    await user.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => expect(screen.getByTestId('save-error')).toHaveTextContent('boom'))
  })

  it('auto-dismisses the saved confirmation after 2 seconds', async () => {
    vi.useFakeTimers()
    const setApiKey = vi.fn(async () => ({ ok: true as const, value: undefined }))
    vi.stubGlobal('api', {
      ...createApiStub(),
      settings: { ...createApiStub().settings, setApiKey }
    })
    render(<SettingsPanel />)

    // userEvent hangs under vitest 4's fake timers here; fireEvent +
    // vi.waitFor exercise the same code path and resolve immediately.
    fireEvent.change(screen.getByPlaceholderText('Paste your API key'), {
      target: { value: 'sk-test-123' }
    })
    fireEvent.click(screen.getByRole('button', { name: /save/i }))
    await vi.waitFor(() => expect(screen.getByTestId('save-confirmation')).toBeInTheDocument())

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000)
    })

    expect(screen.queryByTestId('save-confirmation')).not.toBeInTheDocument()
    vi.useRealTimers()
  })

  it('closes settings when Close is clicked', () => {
    render(<SettingsPanel />)
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(useAppStore.getState().view).toBe('chat')
  })
})
