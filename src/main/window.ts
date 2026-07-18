import { shell, screen, BrowserWindow } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { cursorOverTray } from './utils/trayBounds'
import { computeWindowPosition } from './utils/windowPosition'

let mainWindow: BrowserWindow | null = null
let pinned = false
let quitting = false
let readyToShow = false
let pendingShow = false
let primed = false

function raiseWindow(): void {
  mainWindow?.moveTop()
  mainWindow?.focus()
}

function positionWindow(): void {
  if (!mainWindow) return
  const cursor = screen.getCursorScreenPoint()
  const { workArea } = screen.getDisplayNearestPoint(cursor)
  const { width, height } = mainWindow.getBounds()
  const { x, y } = computeWindowPosition(workArea, { width, height })
  mainWindow.setPosition(x, y)
}

function isTrulyVisible(): boolean {
  return !!mainWindow && mainWindow.isVisible() && mainWindow.getOpacity() > 0
}

function primePaint(): void {
  if (!mainWindow || primed || mainWindow.isVisible()) return
  primed = true
  mainWindow.setOpacity(0)
  mainWindow.showInactive()
  setTimeout(() => {
    if (!mainWindow) return
    if (!isTrulyVisible()) {
      mainWindow.hide()
      mainWindow.setOpacity(1)
    }
  }, 80)
}

export function createWindow(): BrowserWindow {
  mainWindow = new BrowserWindow({
    width: 720,
    height: 64,
    show: false,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    icon,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      backgroundThrottling: false
    }
  })

  mainWindow.once('ready-to-show', () => {
    readyToShow = true
    if (pendingShow) {
      pendingShow = false
      showWindow()
    } else {
      primePaint()
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
  if (!value) return
  setTimeout(() => {
    if (!pinned) return
    showWindow()
  }, 0)
}

export function showWindow(): void {
  if (!mainWindow) return
  if (!readyToShow) {
    pendingShow = true
    return
  }

  if (!pinned) positionWindow()
  mainWindow.setOpacity(1)
  mainWindow.show()
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
  if (!mainWindow) return
  if (isTrulyVisible()) {
    mainWindow.hide()
  } else {
    showWindow()
  }
}
