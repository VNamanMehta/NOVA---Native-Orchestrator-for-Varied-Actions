import { ipcRenderer } from 'electron'
import { RendererToMainChannels, RequestChannels, type NovaApi } from '../shared/ipc'

export const api: NovaApi = {
  window: {
    reportContentHeight(height) {
      ipcRenderer.send(RendererToMainChannels.contentHeight, height)
    }
  },
  chat: {
    send(text) {
      return ipcRenderer.invoke(RequestChannels.chatSend, text)
    }
  }
}
