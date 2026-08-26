// src/renderer/src/components/InputBar.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAppStore } from '../store/appStore'
import { InputBar } from './InputBar'

beforeEach(() => {
  useAppStore.setState({ settings: { activeProvider: 'grok', apiKeyConfigured: true } })
})

describe('InputBar', () => {
  it('submits the trimmed text on Enter and clears the input', async () => {
    const user = userEvent.setup()
    const onSend = vi.fn()
    render(<InputBar onSend={onSend} disabled={false} />)

    const input = screen.getByRole('textbox', { name: 'Message Nova' })
    await user.type(input, 'hello{Enter}')

    expect(onSend).toHaveBeenCalledWith('hello')
    expect(input).toHaveValue('')
  })

  it('does not submit when the input is only whitespace', async () => {
    const user = userEvent.setup()
    const onSend = vi.fn()
    render(<InputBar onSend={onSend} disabled={false} />)

    const input = screen.getByRole('textbox', { name: 'Message Nova' })
    await user.type(input, '   {Enter}')

    expect(onSend).not.toHaveBeenCalled()
  })

  it('disables the input while pending', () => {
    render(<InputBar onSend={vi.fn()} disabled={true} />)
    expect(screen.getByRole('textbox', { name: 'Message Nova' })).toBeDisabled()
  })

  it('focuses the input on mount', () => {
    render(<InputBar onSend={vi.fn()} disabled={false} />)
    expect(screen.getByRole('textbox', { name: 'Message Nova' })).toHaveFocus()
  })

  it('restores focus when it re-enables after a pending turn', () => {
    const { rerender } = render(<InputBar onSend={vi.fn()} disabled={true} />)
    const input = screen.getByRole('textbox', { name: 'Message Nova' })
    expect(input).not.toHaveFocus()

    rerender(<InputBar onSend={vi.fn()} disabled={false} />)
    expect(input).toHaveFocus()
  })

  it('runs the /settings command instead of sending, and clears the input', async () => {
    const user = userEvent.setup()
    const onSend = vi.fn()
    render(<InputBar onSend={onSend} disabled={false} />)

    const input = screen.getByRole('textbox', { name: 'Message Nova' })
    await user.type(input, '/settings{Enter}')

    expect(onSend).not.toHaveBeenCalled()
    expect(input).toHaveValue('')
    expect(useAppStore.getState().view).toBe('settings')
  })

  it('blocks sending and shows a nudge when no API key is configured', async () => {
    useAppStore.setState({ settings: { activeProvider: 'grok', apiKeyConfigured: false } })
    const user = userEvent.setup()
    const onSend = vi.fn()
    render(<InputBar onSend={onSend} disabled={false} />)

    const input = screen.getByRole('textbox', { name: 'Message Nova' })
    await user.type(input, 'hello{Enter}')

    expect(onSend).not.toHaveBeenCalled()
    expect(screen.getByTestId('no-api-key-nudge')).toHaveTextContent(
      'Set your Grok API key in /settings to start chatting.'
    )
  })

  it('clears the nudge once the user starts typing again', async () => {
    useAppStore.setState({ settings: { activeProvider: 'grok', apiKeyConfigured: false } })
    const user = userEvent.setup()
    render(<InputBar onSend={vi.fn()} disabled={false} />)

    const input = screen.getByRole('textbox', { name: 'Message Nova' })
    await user.type(input, 'hello{Enter}')
    expect(screen.getByTestId('no-api-key-nudge')).toBeInTheDocument()

    await user.type(input, 'x')
    expect(screen.queryByTestId('no-api-key-nudge')).not.toBeInTheDocument()
  })
})
