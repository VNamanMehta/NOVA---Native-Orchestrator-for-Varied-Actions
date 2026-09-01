import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAppStore } from '../store/appStore'
import { InputBar } from './InputBar'

beforeEach(() => {
  useAppStore.setState({ settings: { activeProvider: 'groq', apiKeyConfigured: true } })
})

describe('InputBar', () => {
  it('submits the trimmed text on Enter and clears the input', async () => {
    const user = userEvent.setup()
    const onSend = vi.fn()
    render(<InputBar onSend={onSend} disabled={false} blockedByFailedTurn={false} />)

    const input = screen.getByRole('textbox', { name: 'Message Nova' })
    await user.type(input, 'hello{Enter}')

    expect(onSend).toHaveBeenCalledWith('hello')
    expect(input).toHaveValue('')
  })

  it('does not submit when the input is only whitespace', async () => {
    const user = userEvent.setup()
    const onSend = vi.fn()
    render(<InputBar onSend={onSend} disabled={false} blockedByFailedTurn={false} />)

    const input = screen.getByRole('textbox', { name: 'Message Nova' })
    await user.type(input, '   {Enter}')

    expect(onSend).not.toHaveBeenCalled()
  })

  it('disables the input while pending', () => {
    render(<InputBar onSend={vi.fn()} disabled={true} blockedByFailedTurn={false} />)
    expect(screen.getByRole('textbox', { name: 'Message Nova' })).toBeDisabled()
  })

  it('focuses the input on mount', () => {
    render(<InputBar onSend={vi.fn()} disabled={false} blockedByFailedTurn={false} />)
    expect(screen.getByRole('textbox', { name: 'Message Nova' })).toHaveFocus()
  })

  it('restores focus when it re-enables after a pending turn', () => {
    const { rerender } = render(
      <InputBar onSend={vi.fn()} disabled={true} blockedByFailedTurn={false} />
    )
    const input = screen.getByRole('textbox', { name: 'Message Nova' })
    expect(input).not.toHaveFocus()

    rerender(<InputBar onSend={vi.fn()} disabled={false} blockedByFailedTurn={false} />)
    expect(input).toHaveFocus()
  })

  it('runs the /settings command instead of sending, and clears the input', async () => {
    const user = userEvent.setup()
    const onSend = vi.fn()
    render(<InputBar onSend={onSend} disabled={false} blockedByFailedTurn={false} />)

    const input = screen.getByRole('textbox', { name: 'Message Nova' })
    await user.type(input, '/settings{Enter}')

    expect(onSend).not.toHaveBeenCalled()
    expect(input).toHaveValue('')
    expect(useAppStore.getState().view).toBe('settings')
  })

  it('shows the nudge immediately when no API key is configured, before any send attempt', () => {
    useAppStore.setState({ settings: { activeProvider: 'groq', apiKeyConfigured: false } })
    render(<InputBar onSend={vi.fn()} disabled={false} blockedByFailedTurn={false} />)

    expect(screen.getByTestId('no-api-key-nudge')).toHaveTextContent(
      'Set your Groq API key in /settings to start chatting.'
    )
  })

  it('does not show the nudge when a key is configured', () => {
    render(<InputBar onSend={vi.fn()} disabled={false} blockedByFailedTurn={false} />)
    expect(screen.queryByTestId('no-api-key-nudge')).not.toBeInTheDocument()
  })

  it('blocks sending when no API key is configured', async () => {
    useAppStore.setState({ settings: { activeProvider: 'groq', apiKeyConfigured: false } })
    const user = userEvent.setup()
    const onSend = vi.fn()
    render(<InputBar onSend={onSend} disabled={false} blockedByFailedTurn={false} />)

    const input = screen.getByRole('textbox', { name: 'Message Nova' })
    await user.type(input, 'hello{Enter}')

    expect(onSend).not.toHaveBeenCalled()
  })

  it('the nudge persists while the user keeps typing (no key configured)', async () => {
    useAppStore.setState({ settings: { activeProvider: 'groq', apiKeyConfigured: false } })
    const user = userEvent.setup()
    render(<InputBar onSend={vi.fn()} disabled={false} blockedByFailedTurn={false} />)

    const input = screen.getByRole('textbox', { name: 'Message Nova' })
    await user.type(input, 'hello')

    expect(screen.getByTestId('no-api-key-nudge')).toBeInTheDocument()
  })

  it('shakes the input bar on a blocked send attempt', async () => {
    useAppStore.setState({ settings: { activeProvider: 'groq', apiKeyConfigured: false } })
    const user = userEvent.setup()
    render(<InputBar onSend={vi.fn()} disabled={false} blockedByFailedTurn={false} />)

    const input = screen.getByRole('textbox', { name: 'Message Nova' })
    await user.type(input, 'hello{Enter}')

    expect(input.closest('form')).toHaveClass('animate-shake')
  })

  it('restarts the shake animation on a second blocked attempt shortly after the first', async () => {
    useAppStore.setState({ settings: { activeProvider: 'groq', apiKeyConfigured: false } })
    const user = userEvent.setup()
    render(<InputBar onSend={vi.fn()} disabled={false} blockedByFailedTurn={false} />)

    const input = screen.getByRole('textbox', { name: 'Message Nova' })
    const form = input.closest('form') as HTMLFormElement
    const addSpy = vi.spyOn(form.classList, 'add')

    await user.type(input, 'hello{Enter}')
    await user.type(input, 'world{Enter}')

    const shakeAddCalls = addSpy.mock.calls.filter(([className]) => className === 'animate-shake')
    expect(shakeAddCalls).toHaveLength(2)
  })

  it('exposes the nudge as a status region for assistive tech', () => {
    useAppStore.setState({ settings: { activeProvider: 'groq', apiKeyConfigured: false } })
    render(<InputBar onSend={vi.fn()} disabled={false} blockedByFailedTurn={false} />)

    expect(screen.getByTestId('no-api-key-nudge')).toHaveAttribute('role', 'status')
  })

  it('announces a blocked send attempt for screen readers', async () => {
    useAppStore.setState({ settings: { activeProvider: 'groq', apiKeyConfigured: false } })
    const user = userEvent.setup()
    render(<InputBar onSend={vi.fn()} disabled={false} blockedByFailedTurn={false} />)

    const input = screen.getByRole('textbox', { name: 'Message Nova' })
    await user.type(input, 'hello{Enter}')

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        "Can't send — set your Groq API key in /settings first."
      )
    })
  })

  it('clears the draft on a blocked send, so a follow-up /settings routes cleanly', async () => {
    useAppStore.setState({ settings: { activeProvider: 'groq', apiKeyConfigured: false } })
    const user = userEvent.setup()
    const onSend = vi.fn()
    render(<InputBar onSend={onSend} disabled={false} blockedByFailedTurn={false} />)

    const input = screen.getByRole('textbox', { name: 'Message Nova' })
    await user.type(input, 'hello{Enter}')
    expect(input).toHaveValue('')

    await user.type(input, '/settings{Enter}')
    expect(useAppStore.getState().view).toBe('settings')
  })

  it('does not shake on a normal successful send', async () => {
    const user = userEvent.setup()
    const onSend = vi.fn()
    render(<InputBar onSend={onSend} disabled={false} blockedByFailedTurn={false} />)

    const input = screen.getByRole('textbox', { name: 'Message Nova' })
    await user.type(input, 'hello{Enter}')

    expect(onSend).toHaveBeenCalledWith('hello')
    expect(input.closest('form')).not.toHaveClass('animate-shake')
  })

  it('keeps the input enabled and typable when a turn has failed, unlike a pending/streaming reply', () => {
    render(<InputBar onSend={vi.fn()} disabled={false} blockedByFailedTurn={true} />)

    expect(screen.getByRole('textbox', { name: 'Message Nova' })).not.toBeDisabled()
  })

  it('still runs the /settings command while a turn has failed, so the key can be fixed', async () => {
    const user = userEvent.setup()
    const onSend = vi.fn()
    render(<InputBar onSend={onSend} disabled={false} blockedByFailedTurn={true} />)

    const input = screen.getByRole('textbox', { name: 'Message Nova' })
    await user.type(input, '/settings{Enter}')

    expect(onSend).not.toHaveBeenCalled()
    expect(useAppStore.getState().view).toBe('settings')
  })

  it('blocks sending a normal message and shakes when a turn has failed', async () => {
    const user = userEvent.setup()
    const onSend = vi.fn()
    render(<InputBar onSend={onSend} disabled={false} blockedByFailedTurn={true} />)

    const input = screen.getByRole('textbox', { name: 'Message Nova' })
    await user.type(input, 'hello{Enter}')

    expect(onSend).not.toHaveBeenCalled()
    expect(input.closest('form')).toHaveClass('animate-shake')
  })

  it('announces the failed-turn nudge for screen readers', async () => {
    const user = userEvent.setup()
    render(<InputBar onSend={vi.fn()} disabled={false} blockedByFailedTurn={true} />)

    const input = screen.getByRole('textbox', { name: 'Message Nova' })
    await user.type(input, 'hello{Enter}')

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        "Can't send — retry the failed message first, or fix your key in /settings."
      )
    })
  })

  it('shows a persistent failed-turn nudge when a key is configured', () => {
    render(<InputBar onSend={vi.fn()} disabled={false} blockedByFailedTurn={true} />)

    expect(screen.getByTestId('failed-turn-nudge')).toHaveTextContent(
      'Retry the failed message above, or update your key in /settings.'
    )
  })

  it('does not show the failed-turn nudge when there is no failed turn', () => {
    render(<InputBar onSend={vi.fn()} disabled={false} blockedByFailedTurn={false} />)

    expect(screen.queryByTestId('failed-turn-nudge')).not.toBeInTheDocument()
  })

  it('prefers the no-api-key nudge over the failed-turn nudge when both apply', () => {
    useAppStore.setState({ settings: { activeProvider: 'groq', apiKeyConfigured: false } })
    render(<InputBar onSend={vi.fn()} disabled={false} blockedByFailedTurn={true} />)

    expect(screen.getByTestId('no-api-key-nudge')).toBeInTheDocument()
    expect(screen.queryByTestId('failed-turn-nudge')).not.toBeInTheDocument()
  })
})
