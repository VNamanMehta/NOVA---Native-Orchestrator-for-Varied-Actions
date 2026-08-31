import type { Message } from '../../shared/ipc'
import { retryLastTurn as retryLastTurnInLoop, runTurn } from '../agent/loop'

export async function sendMessage(text: string): Promise<Message> {
  return runTurn(text)
}

export async function retryLastTurn(): Promise<Message> {
  return retryLastTurnInLoop()
}
