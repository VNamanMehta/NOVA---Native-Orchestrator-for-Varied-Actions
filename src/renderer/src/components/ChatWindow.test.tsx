import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { ChatMessage } from '../types/chat'
import { ChatWindow } from './ChatWindow'

const messages: ChatMessage[] = [
  { id: 'a', role: 'user', content: 'hi', status: 'complete' }
]

describe('ChatWindow', () => {
  it('renders the input bar', () => {
    render(
      <ChatWindow messages={[]} isPending={false} onSend={vi.fn()} onRetry={vi.fn()} />
    )
    expect(screen.getByRole('textbox', { name: 'Message Nova' })).toBeInTheDocument()
  })

  it('renders the message list when there are messages', () => {
    render(
      <ChatWindow messages={messages} isPending={false} onSend={vi.fn()} onRetry={vi.fn()} />
    )
    expect(screen.getByTestId('message-list')).toBeInTheDocument()
    expect(screen.getByText('hi')).toBeInTheDocument()
  })

  it('disables the input when pending', () => {
    render(
      <ChatWindow messages={messages} isPending={true} onSend={vi.fn()} onRetry={vi.fn()} />
    )
    expect(screen.getByRole('textbox', { name: 'Message Nova' })).toBeDisabled()
  })
})
