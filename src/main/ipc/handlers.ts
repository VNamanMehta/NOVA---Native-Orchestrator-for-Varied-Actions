import { ipcMain, type IpcMainEvent } from 'electron'
import { RendererToMainChannels, RequestChannels } from '../../shared/ipc'
import { resizeToContent } from '../window'
import { handleRequest, unregisterRequestHandlers } from './handleRequest'
import { echo } from './chat'
import { getSettings, saveActiveProvider, saveApiKey } from './settings'

function isContentHeightReport(
  value: unknown
): value is { height: number; structuralChange: boolean } {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { height: unknown }).height === 'number' &&
    Number.isFinite((value as { height: number }).height) &&
    typeof (value as { structuralChange: unknown }).structuralChange === 'boolean'
  )
}

export function registerIpcHandlers(): void {
  ipcMain.on(RendererToMainChannels.contentHeight, (_event: IpcMainEvent, report: unknown) => {
    if (isContentHeightReport(report)) {
      resizeToContent(report.height, report.structuralChange)
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
