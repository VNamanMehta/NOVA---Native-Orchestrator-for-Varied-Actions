import { app, Menu, Tray } from 'electron'
import icon from '../../resources/icon.png?asset'
import {
  hideIfMenuDismissed,
  isPinned,
  resetWindowSize,
  setPinned,
  showWindow,
  toggleWindowVisibility
} from './window'
import { registerTray } from './utils/trayBounds'

function buildMenu(): Menu {
  return Menu.buildFromTemplate([
    {
      label: 'Show Nova',
      click: () => showWindow()
    },
    {
      label: 'Pin Nova',
      type: 'checkbox',
      checked: isPinned(),
      click: (menuItem) => setPinned(menuItem.checked)
    },
    {
      label: 'Reset window size',
      enabled: !isPinned(),
      click: () => resetWindowSize()
    },
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() }
  ])
}

export function createTray(): void {
  const tray = new Tray(icon)
  registerTray(tray)
  tray.setToolTip('Nova')

  tray.on('click', () => toggleWindowVisibility())
  tray.on('double-click', () => toggleWindowVisibility())
  tray.on('right-click', () => {
    const menu = buildMenu()
    menu.on('menu-will-close', () => hideIfMenuDismissed())
    tray.popUpContextMenu(menu)
  })
}
