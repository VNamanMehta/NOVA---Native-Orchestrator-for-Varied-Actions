import { globalShortcut } from 'electron'
import { toggleWindowVisibility } from './window'

// Hardcoded until config/store.ts (Phase 1) makes the binding user-configurable.
const ACCELERATOR = 'CommandOrControl+Shift+Space'

export function registerHotkey(): void {
  const ok = globalShortcut.register(ACCELERATOR, toggleWindowVisibility)
  if (!ok) {
    console.error(
      `[hotkey] failed to register ${ACCELERATOR} — likely already claimed by another app`
    )
  }
}

export function unregisterHotkey(): void {
  globalShortcut.unregister(ACCELERATOR)
}
