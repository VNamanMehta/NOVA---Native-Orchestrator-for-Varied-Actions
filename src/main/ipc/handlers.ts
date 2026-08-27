import { ipcMain, type IpcMainEvent } from 'electron'
import { RendererToMainChannels, RequestChannels } from '../../shared/ipc'
import { allowResizeOnce, resizeToContent } from '../window'
import { handleRequest, unregisterRequestHandlers } from './handleRequest'
import { echo } from './chat'
import { getSettings, saveActiveProvider, saveApiKey } from './settings'

export function registerIpcHandlers(): void {
  ipcMain.on(RendererToMainChannels.contentHeight, (_event: IpcMainEvent, height: unknown) => {
    if (typeof height === 'number' && Number.isFinite(height)) {
      resizeToContent(height)
    }
  })

  ipcMain.on(RendererToMainChannels.structuralUiChange, () => {
    allowResizeOnce()
  })

  handleRequest(RequestChannels.chatSend, (text) => echo(text))
  handleRequest(RequestChannels.settingsGet, () => getSettings())
  handleRequest(RequestChannels.settingsSetApiKey, ({ provider, key }) => saveApiKey(provider, key))
  handleRequest(RequestChannels.settingsSetActiveProvider, ({ provider }) =>
    saveActiveProvider(provider)
  )
}

export function unregisterIpcHandlers(): void {
  ipcMain.removeAllListeners(RendererToMainChannels.contentHeight)
  ipcMain.removeAllListeners(RendererToMainChannels.structuralUiChange)
  unregisterRequestHandlers()
}
