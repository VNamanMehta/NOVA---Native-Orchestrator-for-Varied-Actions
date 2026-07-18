import { ipcMain, type IpcMainEvent } from 'electron'
import { RendererToMainChannels } from '../../shared/ipc'
import { resizeToContent } from '../window'

export function registerIpcHandlers(): void {
  ipcMain.on(RendererToMainChannels.contentHeight, (_event: IpcMainEvent, height: unknown) => {
    if (typeof height === 'number' && Number.isFinite(height)) {
      resizeToContent(height)
    }
  })
}

export function unregisterIpcHandlers(): void {
  ipcMain.removeAllListeners(RendererToMainChannels.contentHeight)
}
