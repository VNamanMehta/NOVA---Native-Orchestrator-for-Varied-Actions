import { shell, screen, BrowserWindow } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { getTrayBounds, pointInRect } from './utils/trayBounds'

let mainWindow: BrowserWindow | null = null
let pinned = false
let quitting = false

function cursorOverTray(): boolean {
  const bounds = getTrayBounds()
  if (!bounds) return false
  return pointInRect(screen.getCursorScreenPoint(), bounds)
}

function raiseWindow(): void {
  mainWindow?.moveTop()
  mainWindow?.focus()
}

export function createWindow(): BrowserWindow {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    icon,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  mainWindow.on('close', (event) => {
    if (quitting) return
    event.preventDefault()
    mainWindow?.hide()
  })

  mainWindow.on('blur', () => {
    if (!mainWindow || !mainWindow.isVisible()) return
    if (cursorOverTray()) return
    if (pinned) {
      mainWindow.moveTop()
      return
    }
    mainWindow.hide()
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return mainWindow
}

export function getMainWindow(): BrowserWindow | null {
  return mainWindow
}

export function setQuitting(value: boolean): void {
  quitting = value
}

export function isPinned(): boolean {
  return pinned
}

export function setPinned(value: boolean): void {
  pinned = value
  if (value && mainWindow?.isVisible()) raiseWindow()
}

export function showWindow(): void {
  mainWindow?.show()
  raiseWindow()
}

export function hideIfMenuDismissed(): void {
  setTimeout(() => {
    if (!mainWindow || pinned) return
    if (mainWindow.isVisible() && !mainWindow.isFocused()) mainWindow.hide()
  }, 0)
}

// Shared by the tray and the global hotkey so both trigger identical behavior.
export function toggleWindowVisibility(): void {
  const window = getMainWindow()
  if (!window) return
  if (window.isVisible()) {
    window.hide()
  } else {
    showWindow()
  }
}
