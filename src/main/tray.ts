import { app, Menu, Tray } from 'electron'
import icon from '../../resources/icon.png?asset'
import { getMainWindow, toggleWindowVisibility } from './window'

export function createTray(): Tray {
  const tray = new Tray(icon)
  tray.setToolTip('Nova')

  tray.setContextMenu(
    Menu.buildFromTemplate([
      {
        label: 'Show Nova',
        click: () => {
          const mainWindow = getMainWindow()
          mainWindow?.show()
          mainWindow?.focus()
        }
      },
      { type: 'separator' },
      { label: 'Quit', click: () => app.quit() }
    ])
  )

  // Left-click toggles visibility as a quick alternative to the hotkey.
  tray.on('click', () => {
    toggleWindowVisibility()
  })

  return tray
}
