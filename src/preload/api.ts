import { ipcRenderer } from 'electron'
import {
  MainToRendererChannels,
  RendererToMainChannels,
  RequestChannels,
  type NovaApi
} from '../shared/ipc'

const ALLOWED_PUSH_CHANNELS = new Set<string>(Object.values(MainToRendererChannels))

export const api: NovaApi = {
  window: {
    reportContentHeight(report) {
      ipcRenderer.send(RendererToMainChannels.contentHeight, report)
    }
  },
  chat: {
    send(text) {
      return ipcRenderer.invoke(RequestChannels.chatSend, text)
    }
  },
  settings: {
    get() {
      return ipcRenderer.invoke(RequestChannels.settingsGet)
    },
    setApiKey(provider, key) {
      return ipcRenderer.invoke(RequestChannels.settingsSetApiKey, { provider, key })
    },
    setActiveProvider(provider) {
      return ipcRenderer.invoke(RequestChannels.settingsSetActiveProvider, { provider })
    }
  },
  events: {
    on(channel, handler) {
      if (!ALLOWED_PUSH_CHANNELS.has(channel)) {
        throw new Error(`events.on: channel not allowed: ${channel}`)
      }
      const listener = (_event: unknown, payload: unknown): void =>
        (handler as (payload: unknown) => void)(payload)
      ipcRenderer.on(channel, listener)
      return () => ipcRenderer.removeListener(channel, listener)
    }
  }
}
