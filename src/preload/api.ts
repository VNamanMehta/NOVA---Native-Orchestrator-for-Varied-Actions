import { ipcRenderer } from 'electron'
import { RendererToMainChannels, type NovaApi } from '../shared/ipc'

export const api: NovaApi = {
  reportContentHeight(height) {
    ipcRenderer.send(RendererToMainChannels.contentHeight, height)
  }
}
