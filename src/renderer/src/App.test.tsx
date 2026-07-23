import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
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
})
