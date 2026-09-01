import { create } from 'zustand'
import type { AppView, SettingsState } from '../../../shared/domain'

export interface AppStore {
  view: AppView
  settings: SettingsState
  openSettings: () => void
  closeSettings: () => void
  setSettings: (next: SettingsState) => void
}

export const useAppStore = create<AppStore>((set) => ({
  view: 'chat',
  settings: { activeProvider: 'groq', apiKeyConfigured: false },
  openSettings: () => set({ view: 'settings' }),
  closeSettings: () => set({ view: 'chat' }),
  setSettings: (next) => set({ settings: next })
}))
