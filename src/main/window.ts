import { shell, screen, BrowserWindow } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { cursorOverTray } from './utils/trayBounds'
import {
  clampContentHeight,
  computeWindowPosition,
  resetBounds,
  shouldApplyContentHeight,
  MIN_WINDOW_HEIGHT,
  MIN_WINDOW_WIDTH,
  type SizeAuthority
} from './utils/windowGeometry'

const WINDOW_WIDTH = 720
const RESIZE_THRESHOLD = 2
const BYPASS_PINNED_WINDOW_MS = 500

let mainWindow: BrowserWindow | null = null
let pinned = false
let quitting = false
let readyToShow = false
let pendingShow = false
let primed = false
let sizeAuthority: SizeAuthority = 'content'
let lastContentHeight = MIN_WINDOW_HEIGHT
let readyCallbacks: Array<() => void> = []
let bypassPinnedUntil = 0

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

function applyResize(contentHeight: number, bypassPinned: boolean): void {
  if (!mainWindow) return
  if (!shouldApplyContentHeight(sizeAuthority, pinned, bypassPinned)) return
  const [x, y] = mainWindow.getPosition()
  const [width, currentHeight] = mainWindow.getSize()
  const { workArea } = screen.getDisplayMatching(mainWindow.getBounds())
  const target = clampContentHeight(contentHeight, workArea, y)
  if (Math.abs(target - currentHeight) < RESIZE_THRESHOLD) return
  mainWindow.setBounds({ x, y, width, height: target })
}

export function resizeToContent(contentHeight: number): void {
  lastContentHeight = contentHeight
  applyResize(contentHeight, Date.now() < bypassPinnedUntil)
}

// Deliberate structural UI changes (a chat<->settings view swap, the no-key
// warning appearing) should still resize a pinned window once, unlike
// organic content growth (a new chat message) which pinning is meant to
// freeze against. Opens a short bypass window and immediately retries with
// the most recently known content height — covers the case where that
// height was already reported and blocked by the pinned gate before this
// fires; if the new content hasn't been measured yet, the still-open window
// covers the resizeToContent call that reports it shortly after.
//
// Time-bounded rather than "consume on the next successful resize": if the
// structural change happens to need no resize (new content is already the
// same height), a consume-on-success design would leave the bypass armed
// indefinitely, silently letting some later, unrelated organic resize
// through the pinned freeze it's supposed to respect. A short window closes
// on its own either way.
export function allowResizeOnce(): void {
  bypassPinnedUntil = Date.now() + BYPASS_PINNED_WINDOW_MS
  applyResize(lastContentHeight, true)
}

export function resetWindowSize(): void {
  if (!mainWindow || pinned) return
  sizeAuthority = 'content'
  const [x, y] = mainWindow.getPosition()
  const { workArea } = screen.getDisplayMatching(mainWindow.getBounds())
  const { width, height } = resetBounds(WINDOW_WIDTH, lastContentHeight, workArea, y)
  mainWindow.setBounds({ x, y, width, height })
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
  readyToShow = false
  pendingShow = false
  primed = false
  sizeAuthority = 'content'
  lastContentHeight = MIN_WINDOW_HEIGHT
  readyCallbacks = []
  bypassPinnedUntil = 0

  mainWindow = new BrowserWindow({
    width: WINDOW_WIDTH,
    height: MIN_WINDOW_HEIGHT,
    minWidth: MIN_WINDOW_WIDTH,
    minHeight: MIN_WINDOW_HEIGHT,
    show: false,
    frame: false,
    resizable: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    icon,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: true,
      backgroundThrottling: false
    }
  })

  mainWindow.once('ready-to-show', () => {
    readyToShow = true
    readyCallbacks.splice(0).forEach((callback) => callback())
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

  mainWindow.on('will-resize', () => {
    sizeAuthority = 'manual'
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

// Runs `callback` once the window's content has actually painted at least
// once — immediately if that's already happened, otherwise queued to run
// when it does. Use this to gate anything that assumes the renderer has
// mounted (e.g. a main->renderer push whose only listener is set up in a
// React effect), the same way showWindow() itself defers via pendingShow.
export function whenReady(callback: () => void): void {
  if (readyToShow) {
    callback()
  } else {
    readyCallbacks.push(callback)
  }
}

export function setQuitting(value: boolean): void {
  quitting = value
}

export function isPinned(): boolean {
  return pinned
}

export function setPinned(value: boolean): void {
  pinned = value
  mainWindow?.setResizable(!value)
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
