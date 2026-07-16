import { app, BrowserWindow, Tray } from 'electron'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import { createWindow, getMainWindow } from './window'
import { createTray } from './tray'
import { registerHotkey, unregisterHotkey } from './hotkey'

let tray: Tray | null = null

// Prevent a second launch from competing for the global hotkey/tray icon.
const gotSingleInstanceLock = app.requestSingleInstanceLock()

if (!gotSingleInstanceLock) {
  app.quit()
} else {
  // A second launch attempt was blocked — bring the existing window forward.
  app.on('second-instance', () => {
    const mainWindow = getMainWindow()
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.show()
      mainWindow.focus()
    }
  })

  app.whenReady().then(() => {
    electronApp.setAppUserModelId('com.nova.app')

    app.on('browser-window-created', (_, window) => {
      optimizer.watchWindowShortcuts(window)
    })

    createWindow()
    tray = createTray()
    registerHotkey()

    app.on('activate', function () {
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
  })

  // Interim: quits on close everywhere until tray.ts/window.ts add hide-on-close.
  app.on('window-all-closed', () => {
    app.quit()
  })

  app.on('before-quit', () => {
    tray?.destroy()
  })

  app.on('will-quit', () => {
    unregisterHotkey()
  })
}
