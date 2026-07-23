import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { ChatMessage } from '../types/chat'
import { MessageList } from './MessageList'

const chronological: ChatMessage[] = [
  { id: 'a', role: 'user', content: 'first', status: 'complete' },
  { id: 'b', role: 'assistant', content: 'second', status: 'complete' },
  { id: 'c', role: 'user', content: 'third', status: 'complete' }
]

describe('MessageList', () => {
  it('renders nothing when there are no messages', () => {
    const { container } = render(<MessageList messages={[]} onRetry={vi.fn()} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders messages oldest-first, newest last', () => {
    render(<MessageList messages={chronological} onRetry={vi.fn()} />)
    const items = screen.getAllByTestId('message-item')
    expect(items.map((i) => i.textContent)).toEqual(['first', 'second', 'third'])
  })

  it('withholds pending turns (they surface below the input, not in the history)', () => {
    const withPending: ChatMessage[] = [
      { id: 'a', role: 'user', content: 'hi', status: 'complete' },
      { id: 'b', role: 'assistant', content: '', status: 'pending' }
    ]
    render(<MessageList messages={withPending} onRetry={vi.fn()} />)
    const items = screen.getAllByTestId('message-item')
    expect(items).toHaveLength(1)
    expect(items[0]).toHaveTextContent('hi')
  })

  it('renders nothing when the only message is still pending', () => {
    const onlyPending: ChatMessage[] = [
      { id: 'a', role: 'assistant', content: '', status: 'pending' }
    ]
    const { container } = render(<MessageList messages={onlyPending} onRetry={vi.fn()} />)
    expect(container).toBeEmptyDOMElement()
  })
})
