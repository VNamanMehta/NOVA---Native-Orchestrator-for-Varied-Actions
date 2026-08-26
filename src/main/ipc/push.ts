import {
  MainToRendererChannels,
  type MainToRendererChannel,
  type MainToRendererPayloads
} from '../../shared/ipc'
import { getMainWindow } from '../window'

export function pushToRenderer<C extends MainToRendererChannel>(
  channel: C,
  payload: MainToRendererPayloads[C]
): void {
  getMainWindow()?.webContents.send(channel, payload)
}

export function pushOpenSettings(): void {
  pushToRenderer(MainToRendererChannels.openSettings, undefined)
}
