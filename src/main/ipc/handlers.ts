import { ipcMain, type IpcMainEvent } from 'electron'
import { RendererToMainChannels, RequestChannels } from '../../shared/ipc'
import { resizeToContent } from '../window'
import { runSafely } from './safeHandle'
import { echo } from './chat'

export function registerIpcHandlers(): void {
  ipcMain.on(RendererToMainChannels.contentHeight, (_event: IpcMainEvent, height: unknown) => {
    if (typeof height === 'number' && Number.isFinite(height)) {
      resizeToContent(height)
    }
  })

  ipcMain.handle(RequestChannels.chatSend, (_event, text: unknown) =>
    runSafely(() => echo(String(text)))
  )
}

export function unregisterIpcHandlers(): void {
  ipcMain.removeAllListeners(RendererToMainChannels.contentHeight)
  ipcMain.removeHandler(RequestChannels.chatSend)
}
