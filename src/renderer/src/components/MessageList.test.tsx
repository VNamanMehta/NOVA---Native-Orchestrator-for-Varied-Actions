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

  it('renders newest first (reverse of chronological order)', () => {
    render(<MessageList messages={chronological} onRetry={vi.fn()} />)
    const items = screen.getAllByTestId('message-item')
    expect(items.map((i) => i.textContent)).toEqual(['third', 'second', 'first'])
  })
})
