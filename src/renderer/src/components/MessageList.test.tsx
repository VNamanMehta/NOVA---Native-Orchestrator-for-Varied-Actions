import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ChatMessage } from '../types/chat'
import { MessageList } from './MessageList'

afterEach(() => {
  vi.unstubAllGlobals()
  Reflect.deleteProperty(HTMLElement.prototype, 'scrollTo')
})

const chronological: ChatMessage[] = [
  { id: 'a', role: 'user', content: 'first', status: 'complete' },
  { id: 'b', role: 'assistant', content: 'second', status: 'complete' },
  { id: 'c', role: 'user', content: 'third', status: 'complete' }
]

describe('MessageList', () => {
  it('renders nothing when there are no messages', () => {
    const { container } = render(<MessageList messages={[]} isPending={false} onRetry={vi.fn()} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders messages oldest-first, newest last', () => {
    render(<MessageList messages={chronological} isPending={false} onRetry={vi.fn()} />)
    const items = screen.getAllByTestId('message-item')
    expect(items.map((i) => i.textContent)).toEqual(['first', 'second', 'third'])
  })

  it('withholds pending turns (they surface below the input, not in the history)', () => {
    const withPending: ChatMessage[] = [
      { id: 'a', role: 'user', content: 'hi', status: 'complete' },
      { id: 'b', role: 'assistant', content: '', status: 'pending' }
    ]
    render(<MessageList messages={withPending} isPending onRetry={vi.fn()} />)
    const items = screen.getAllByTestId('message-item')
    expect(items).toHaveLength(1)
    expect(items[0]).toHaveTextContent('hi')
  })

  it('renders nothing when the only message is still pending', () => {
    const onlyPending: ChatMessage[] = [
      { id: 'a', role: 'assistant', content: '', status: 'pending' }
    ]
    const { container } = render(<MessageList messages={onlyPending} isPending onRetry={vi.fn()} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('does not animate the initial scroll on mount', () => {
    const scrollTo = vi.fn()
    Object.defineProperty(HTMLElement.prototype, 'scrollTo', {
      configurable: true,
      value: scrollTo
    })

    render(<MessageList messages={chronological} isPending={false} onRetry={vi.fn()} />)

    expect(scrollTo).not.toHaveBeenCalled()
  })

  it('scrolls smoothly to the bottom when a later message arrives', () => {
    const scrollTo = vi.fn()
    Object.defineProperty(HTMLElement.prototype, 'scrollTo', {
      configurable: true,
      value: scrollTo
    })

    const { rerender } = render(
      <MessageList messages={chronological} isPending={false} onRetry={vi.fn()} />
    )
    const withNewMessage: ChatMessage[] = [
      ...chronological,
      { id: 'd', role: 'assistant', content: 'fourth', status: 'complete' }
    ]
    rerender(<MessageList messages={withNewMessage} isPending={false} onRetry={vi.fn()} />)

    expect(scrollTo).toHaveBeenCalledWith(expect.objectContaining({ behavior: 'smooth' }))
  })

  it('scrolls instantly instead of smoothly when the user prefers reduced motion', () => {
    const scrollTo = vi.fn()
    Object.defineProperty(HTMLElement.prototype, 'scrollTo', {
      configurable: true,
      value: scrollTo
    })
    vi.stubGlobal(
      'matchMedia',
      vi.fn((query: string) => ({ matches: query.includes('reduce') }) as MediaQueryList)
    )

    const { rerender } = render(
      <MessageList messages={chronological} isPending={false} onRetry={vi.fn()} />
    )
    const withNewMessage: ChatMessage[] = [
      ...chronological,
      { id: 'd', role: 'assistant', content: 'fourth', status: 'complete' }
    ]
    rerender(<MessageList messages={withNewMessage} isPending={false} onRetry={vi.fn()} />)

    expect(scrollTo).not.toHaveBeenCalled()
  })
})
