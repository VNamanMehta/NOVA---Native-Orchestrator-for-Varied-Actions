import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { ChatMessage } from '../types/chat'
import { MessageItem } from './MessageItem'

const base: ChatMessage = { id: '1', role: 'user', content: 'hello', status: 'complete' }

describe('MessageItem', () => {
  it('renders a completed user message with its content and role', () => {
    render(<MessageItem message={base} onRetry={vi.fn()} />)
    const item = screen.getByTestId('message-item')
    expect(item).toHaveAttribute('data-role', 'user')
    expect(item).toHaveTextContent('hello')
  })

  it('renders the error text and a Retry button that fires onRetry with the id', () => {
    const onRetry = vi.fn()
    const msg: ChatMessage = { id: '3', role: 'assistant', content: 'boom', status: 'error' }
    render(<MessageItem message={msg} onRetry={onRetry} />)

    expect(screen.getByText('boom')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
    expect(onRetry).toHaveBeenCalledWith('3')
  })

  it('disables the Retry button and ignores clicks when retryDisabled is set', () => {
    const onRetry = vi.fn()
    const msg: ChatMessage = { id: '3', role: 'assistant', content: 'boom', status: 'error' }
    render(<MessageItem message={msg} onRetry={onRetry} retryDisabled />)

    const button = screen.getByRole('button', { name: 'Retry' })
    expect(button).toBeDisabled()
    fireEvent.click(button)
    expect(onRetry).not.toHaveBeenCalled()
  })
})
