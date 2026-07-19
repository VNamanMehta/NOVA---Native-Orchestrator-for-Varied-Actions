import { ElectronAPI } from '@electron-toolkit/preload'
import type { NovaApi } from '../shared/ipc'

declare global {
  interface Window {
    electron: ElectronAPI
    api: NovaApi
  }
}
