import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { InputBar } from './InputBar'

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
})
