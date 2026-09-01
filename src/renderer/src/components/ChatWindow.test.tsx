import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { ChatMessage } from '../types/chat'
import { ChatWindow } from './ChatWindow'

const messages: ChatMessage[] = [{ id: 'a', role: 'user', content: 'hi', status: 'complete' }]

describe('ChatWindow', () => {
  it('renders the input bar', () => {
    render(
      <ChatWindow
        messages={[]}
        isPending={false}
        isAwaitingReply={false}
        onSend={vi.fn()}
        onRetry={vi.fn()}
      />
    )
    expect(screen.getByRole('textbox', { name: 'Message Nova' })).toBeInTheDocument()
  })

  it('renders the message list when there are messages', () => {
    render(
      <ChatWindow
        messages={messages}
        isPending={false}
        isAwaitingReply={false}
        onSend={vi.fn()}
        onRetry={vi.fn()}
      />
    )
    expect(screen.getByTestId('message-list')).toBeInTheDocument()
    expect(screen.getByText('hi')).toBeInTheDocument()
  })

  it('disables the input while a reply is actively pending or streaming', () => {
    render(
      <ChatWindow
        messages={messages}
        isPending={false}
        isAwaitingReply={true}
        onSend={vi.fn()}
        onRetry={vi.fn()}
      />
    )
    expect(screen.getByRole('textbox', { name: 'Message Nova' })).toBeDisabled()
  })

  it('does not disable the input when there is no in-flight reply', () => {
    render(
      <ChatWindow
        messages={messages}
        isPending={false}
        isAwaitingReply={false}
        onSend={vi.fn()}
        onRetry={vi.fn()}
      />
    )
    expect(screen.getByRole('textbox', { name: 'Message Nova' })).not.toBeDisabled()
  })

  it('renders the input below the message list', () => {
    render(
      <ChatWindow
        messages={messages}
        isPending={false}
        isAwaitingReply={false}
        onSend={vi.fn()}
        onRetry={vi.fn()}
      />
    )
    const list = screen.getByTestId('message-list')
    const input = screen.getByRole('textbox', { name: 'Message Nova' })
    expect(list.compareDocumentPosition(input) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('shows the thinking state as the input placeholder while pending, adding no extra layout height', () => {
    render(
      <ChatWindow
        messages={messages}
        isPending={true}
        isAwaitingReply={true}
        onSend={vi.fn()}
        onRetry={vi.fn()}
      />
    )
    expect(screen.getByPlaceholderText('Nova is thinking…')).toBeInTheDocument()
  })

  it('reverts to the normal placeholder once streaming has started, even though a reply is still awaited', () => {
    render(
      <ChatWindow
        messages={messages}
        isPending={false}
        isAwaitingReply={true}
        onSend={vi.fn()}
        onRetry={vi.fn()}
      />
    )
    expect(screen.getByPlaceholderText('Ask Nova…')).toBeInTheDocument()
  })
})
