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
        hasUnresolvedTurn={false}
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
        hasUnresolvedTurn={false}
        onSend={vi.fn()}
        onRetry={vi.fn()}
      />
    )
    expect(screen.getByTestId('message-list')).toBeInTheDocument()
    expect(screen.getByText('hi')).toBeInTheDocument()
  })

  it('disables the input when there is an unresolved turn', () => {
    render(
      <ChatWindow
        messages={messages}
        isPending={false}
        hasUnresolvedTurn={true}
        onSend={vi.fn()}
        onRetry={vi.fn()}
      />
    )
    expect(screen.getByRole('textbox', { name: 'Message Nova' })).toBeDisabled()
  })

  it('does not disable the input when there is no unresolved turn', () => {
    render(
      <ChatWindow
        messages={messages}
        isPending={false}
        hasUnresolvedTurn={false}
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
        hasUnresolvedTurn={false}
        onSend={vi.fn()}
        onRetry={vi.fn()}
      />
    )
    const list = screen.getByTestId('message-list')
    const input = screen.getByRole('textbox', { name: 'Message Nova' })
    expect(list.compareDocumentPosition(input) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('shows the thinking indicator below the input while pending', () => {
    render(
      <ChatWindow
        messages={messages}
        isPending={true}
        hasUnresolvedTurn={true}
        onSend={vi.fn()}
        onRetry={vi.fn()}
      />
    )
    const input = screen.getByRole('textbox', { name: 'Message Nova' })
    const indicator = screen.getByTestId('pending-indicator')
    expect(indicator).toHaveTextContent('Nova is thinking…')
    expect(input.compareDocumentPosition(indicator) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('hides the thinking indicator once streaming has started, even though the turn is still unresolved', () => {
    render(
      <ChatWindow
        messages={messages}
        isPending={false}
        hasUnresolvedTurn={true}
        onSend={vi.fn()}
        onRetry={vi.fn()}
      />
    )
    expect(screen.queryByTestId('pending-indicator')).not.toBeInTheDocument()
  })
})
