import type { AppStore } from '../store/appStore'

export interface Command {
  name: string
  run: (store: AppStore) => void
}

export const commands: Command[] = [
  {
    name: '/settings',
    run: (store) => store.openSettings()
  }
]

export function matchCommand(text: string): Command | undefined {
  return commands.find((command) => command.name === text)
}
