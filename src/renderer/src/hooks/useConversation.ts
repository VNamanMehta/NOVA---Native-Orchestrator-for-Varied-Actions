import { useCallback, useState } from 'react'
import type { ChatMessage } from '../types/chat'

export interface UseConversation {
  messages: ChatMessage[]
  isPending: boolean
  send: (text: string) => void
  retry: (assistantMessageId: string) => void
}

const GENERIC_ERROR = 'Something went wrong. Please try again.'

export function useConversation(): UseConversation {
  const [messages, setMessages] = useState<ChatMessage[]>([])

  const runTurn = useCallback((text: string, assistantId: string) => {
    const settle = (patch: Partial<ChatMessage>): void => {
      setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, ...patch } : m)))
    }
    window.api.chat.send(text).then(
      (result) => {
        settle(
          result.ok
            ? { content: result.value.content, status: 'complete' }
            : { content: result.error.message || GENERIC_ERROR, status: 'error' }
        )
      },
      () => settle({ content: GENERIC_ERROR, status: 'error' })
    )
  }, [])

  const send = useCallback(
    (text: string) => {
      const trimmed = text.trim()
      if (trimmed.length === 0) return

      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: trimmed,
        status: 'complete'
      }
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: '',
        status: 'pending'
      }

      setMessages((prev) => [...prev, userMessage, assistantMessage])
      runTurn(trimmed, assistantMessage.id)
    },
    [runTurn]
  )

  const retry = useCallback(
    (assistantMessageId: string) => {
      const index = messages.findIndex((m) => m.id === assistantMessageId)
      if (index <= 0) return
      const userMessage = messages[index - 1]
      if (userMessage.role !== 'user') return
      if (messages[index].status === 'pending') return

      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMessageId ? { ...m, content: '', status: 'pending' } : m
        )
      )
      runTurn(userMessage.content, assistantMessageId)
    },
    [messages, runTurn]
  )

  const isPending = messages.some((m) => m.status === 'pending')

  return { messages, isPending, send, retry }
}
