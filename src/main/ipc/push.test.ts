import { afterEach, describe, expect, it, vi } from 'vitest'
import { MainToRendererChannels } from '../../shared/ipc'

const send = vi.fn()
let mainWindow: { webContents: { send: typeof send } } | null = { webContents: { send } }

vi.mock('../window', () => ({
  getMainWindow: () => mainWindow
}))

import { pushOpenSettings, pushToRenderer } from './push'

describe('pushToRenderer', () => {
  afterEach(() => {
    send.mockClear()
    mainWindow = { webContents: { send } }
  })

  it('sends the channel and payload to the main window webContents', () => {
    pushToRenderer(MainToRendererChannels.openSettings, undefined)
    expect(send).toHaveBeenCalledWith(MainToRendererChannels.openSettings, undefined)
  })

  it('does nothing when there is no main window', () => {
    mainWindow = null
    expect(() => pushToRenderer(MainToRendererChannels.openSettings, undefined)).not.toThrow()
    expect(send).not.toHaveBeenCalled()
  })
})

describe('pushOpenSettings', () => {
  afterEach(() => {
    send.mockClear()
  })

  it('pushes the open-settings channel with no payload', () => {
    pushOpenSettings()
    expect(send).toHaveBeenCalledWith(MainToRendererChannels.openSettings, undefined)
  })
})
