import type { Message } from '../../shared/ipc'

let history: Message[] = []
let lastTurnFailed = false

export function getHistory(): Message[] {
  return history
}

export function appendUser(content: string): void {
  history = [...history, { role: 'user', content }]
}

export function appendAssistant(content: string): void {
  history = [...history, { role: 'assistant', content }]
  lastTurnFailed = false
}

export function markLastTurnFailed(partialContent: string): void {
  history = [...history, { role: 'assistant', content: partialContent }]
  lastTurnFailed = true
}

export function wasLastTurnFailed(): boolean {
  return lastTurnFailed
}

export function popFailedAssistant(): void {
  if (!lastTurnFailed) return
  history = history.slice(0, -1)
  lastTurnFailed = false
}
