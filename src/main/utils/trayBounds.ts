import { screen } from 'electron'
import type { Point, Rectangle, Tray } from 'electron'

let tray: Tray | null = null

export function registerTray(instance: Tray): void {
  tray = instance
}

export function destroyTray(): void {
  tray?.destroy()
  tray = null
}

export function getTrayBounds(): Rectangle | null {
  return tray?.getBounds() ?? null
}

export function pointInRect(point: Point, rect: Rectangle): boolean {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  )
}

export function cursorOverTray(): boolean {
  const bounds = getTrayBounds()
  if (!bounds) return false
  return pointInRect(screen.getCursorScreenPoint(), bounds)
}
