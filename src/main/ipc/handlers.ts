import { ipcMain, type IpcMainEvent } from 'electron'
import { RendererToMainChannels, RequestChannels } from '../../shared/ipc'
import { resizeToContent } from '../window'
import { handleRequest, unregisterRequestHandlers } from './handleRequest'
import { echo } from './chat'
import { getSettings, saveActiveProvider, saveApiKey } from './settings'

export function registerIpcHandlers(): void {
  ipcMain.on(RendererToMainChannels.contentHeight, (_event: IpcMainEvent, height: unknown) => {
    if (typeof height === 'number' && Number.isFinite(height)) {
      resizeToContent(height)
    }
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
  unregisterRequestHandlers()
}
