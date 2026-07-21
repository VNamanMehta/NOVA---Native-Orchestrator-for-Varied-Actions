import type { NovaApi } from '../shared/ipc'

declare global {
  interface Window {
    api: NovaApi
  }
}
