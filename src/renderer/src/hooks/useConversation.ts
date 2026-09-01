import { useCallback, useEffect, useState } from 'react'
import { MainToRendererChannels, type IpcResult, type Message } from '../../../shared/ipc'
import type { ChatMessage } from '../types/chat'

export interface UseConversation {
  messages: ChatMessage[]
  isPending: boolean
  isAwaitingReply: boolean
  send: (text: string) => void
  retry: (assistantMessageId: string) => void
}

const GENERIC_ERROR = 'Something went wrong. Please try again.'

export function useConversation(): UseConversation {
  const [messages, setMessages] = useState<ChatMessage[]>([])

  useEffect(() => {
    return window.api.events.on(MainToRendererChannels.chatToken, ({ token }) => {
      setMessages((prev) => {
        const index = prev.findIndex(
          (m) => m.role === 'assistant' && (m.status === 'pending' || m.status === 'streaming')
        )
        if (index === -1) return prev
        const next = [...prev]
        const current = next[index]
        next[index] = { ...current, status: 'streaming', content: current.content + token }
        return next
      })
    })
  }, [])

  const settle = useCallback((assistantId: string, result: IpcResult<Message>) => {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== assistantId) return m
        if (result.ok) return { ...m, status: 'complete', content: result.value.content }
        return { ...m, status: 'error', errorMessage: result.error.message || GENERIC_ERROR }
      })
    )
  }, [])

  const trailing = messages.length > 0 ? messages[messages.length - 1] : undefined
  // Only an in-flight reply blocks a new send — an errored trailing turn is
  // resolved (main discards it and starts fresh on the next chat:send).
  const isAwaitingReply =
    trailing !== undefined && (trailing.status === 'pending' || trailing.status === 'streaming')

  const send = useCallback(
    (text: string) => {
      const trimmed = text.trim()
      if (trimmed.length === 0 || isAwaitingReply) return

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
      window.api.chat.send(trimmed).then(
        (result) => settle(assistantMessage.id, result),
        () => settle(assistantMessage.id, { ok: false, error: { message: GENERIC_ERROR } })
      )
    },
    [isAwaitingReply, settle]
  )

  const retry = useCallback(
    (assistantMessageId: string) => {
      const last = messages[messages.length - 1]
      if (!last || last.id !== assistantMessageId || last.status !== 'error') return

      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMessageId
            ? { ...m, status: 'pending', content: '', errorMessage: undefined }
            : m
        )
      )
      window.api.chat.retry().then(
        (result) => settle(assistantMessageId, result),
        () => settle(assistantMessageId, { ok: false, error: { message: GENERIC_ERROR } })
      )
    },
    [messages, settle]
  )

  const isPending = messages.some((m) => m.status === 'pending')

  return { messages, isPending, isAwaitingReply, send, retry }
}
