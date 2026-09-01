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

  it('renders a streaming assistant message with its partial content', () => {
    const msg: ChatMessage = { id: '2', role: 'assistant', content: 'partial', status: 'streaming' }
    render(<MessageItem message={msg} onRetry={vi.fn()} />)
    expect(screen.getByText('partial')).toBeInTheDocument()
  })

  it('renders the error caption and a Retry button that fires onRetry with the id', () => {
    const onRetry = vi.fn()
    const msg: ChatMessage = {
      id: '3',
      role: 'assistant',
      content: '',
      status: 'error',
      errorMessage: 'boom'
    }
    render(<MessageItem message={msg} onRetry={onRetry} />)

    expect(screen.getByText('boom')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
    expect(onRetry).toHaveBeenCalledWith('3')
  })

  it('renders both the partial streamed text and the error caption on a mid-stream failure', () => {
    const msg: ChatMessage = {
      id: '4',
      role: 'assistant',
      content: 'Hello wor',
      status: 'error',
      errorMessage: "Couldn't reach Groq — check your connection."
    }
    render(<MessageItem message={msg} onRetry={vi.fn()} />)

    expect(screen.getByText('Hello wor')).toBeInTheDocument()
    expect(screen.getByText("Couldn't reach Groq — check your connection.")).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument()
  })

  it('disables the Retry button and ignores clicks when retryDisabled is set', () => {
    const onRetry = vi.fn()
    const msg: ChatMessage = {
      id: '3',
      role: 'assistant',
      content: '',
      status: 'error',
      errorMessage: 'boom'
    }
    render(<MessageItem message={msg} onRetry={onRetry} retryDisabled />)

    const button = screen.getByRole('button', { name: 'Retry' })
    expect(button).toBeDisabled()
    fireEvent.click(button)
    expect(onRetry).not.toHaveBeenCalled()
  })
})
