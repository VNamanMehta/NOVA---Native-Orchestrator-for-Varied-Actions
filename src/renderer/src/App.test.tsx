import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { createApiStub } from '../../../vitest.setup'
import App from './App'

// The default createApiStub (vitest.setup.ts) echoes the sent text back as the
// assistant reply, so a full send round-trip is observable without extra stubs.
describe('App', () => {
  it('renders the input bar', () => {
    render(<App />)
    expect(screen.getByRole('textbox', { name: 'Message Nova' })).toBeInTheDocument()
  })

  it('shows the user message and the echoed assistant reply after sending', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.type(screen.getByRole('textbox', { name: 'Message Nova' }), 'hello{Enter}')

    await waitFor(() => {
      const completed = screen
        .getAllByTestId('message-item')
        .filter((i) => i.getAttribute('data-role') === 'assistant')
      expect(completed[0]).toHaveAttribute('data-status', 'complete')
      expect(completed[0]).toHaveTextContent('hello')
    })
  })

  it('shows Settings when /settings is submitted, and closes it on Escape', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.type(screen.getByRole('textbox', { name: 'Message Nova' }), '/settings{Enter}')
    expect(await screen.findByTestId('settings-panel')).toBeInTheDocument()

    await user.keyboard('{Escape}')
    await waitFor(() => {
      expect(screen.queryByTestId('settings-panel')).not.toBeInTheDocument()
    })
    expect(screen.getByRole('textbox', { name: 'Message Nova' })).toBeInTheDocument()
  })

  it('opens Settings on boot when no API key is configured yet', async () => {
    vi.stubGlobal('api', {
      ...createApiStub(),
      settings: {
        ...createApiStub().settings,
        get: vi.fn(async () => ({
          ok: true as const,
          value: { activeProvider: 'grok' as const, apiKeyConfigured: false }
        }))
      }
    })

    render(<App />)

    expect(await screen.findByTestId('settings-panel')).toBeInTheDocument()
  })

  it('does not open Settings on boot when a key is already configured', async () => {
    render(<App />)

    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: 'Message Nova' })).toBeInTheDocument()
    })
    expect(screen.queryByTestId('settings-panel')).not.toBeInTheDocument()
  })

  it('switches to Settings when main pushes the open-settings event', async () => {
    let pushedHandler: (() => void) | undefined
    vi.stubGlobal('api', {
      ...createApiStub(),
      events: {
        on: vi.fn((_channel: string, handler: () => void) => {
          pushedHandler = handler
          return () => {}
        })
      }
    })

    render(<App />)
    expect(pushedHandler).toBeDefined()

    act(() => pushedHandler?.())

    expect(await screen.findByTestId('settings-panel')).toBeInTheDocument()
  })
})
