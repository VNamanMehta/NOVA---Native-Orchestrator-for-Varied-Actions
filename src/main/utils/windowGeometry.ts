import type { Rectangle } from 'electron'
import { MAX_HEIGHT_FRACTION } from '../../shared/layout'

export const VERTICAL_ANCHOR = 1 / 3 // launcher sits in the upper third of the display
export const MIN_WINDOW_HEIGHT = 64
export const MIN_WINDOW_WIDTH = 480

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(value, max))
}

interface Size {
  width: number
  height: number
}

interface Position {
  x: number
  y: number
}

export function computeWindowPosition(
  workArea: Rectangle,
  size: Size,
  verticalAnchor: number = VERTICAL_ANCHOR
): Position {
  const x = workArea.x + (workArea.width - size.width) / 2
  const y = workArea.y + (workArea.height - size.height) * verticalAnchor
  return {
    x: Math.round(clamp(x, workArea.x, workArea.x + workArea.width - size.width)),
    y: Math.round(clamp(y, workArea.y, workArea.y + workArea.height - size.height))
  }
}

export function clampContentHeight(
  contentHeight: number,
  workArea: Rectangle,
  windowTop: number
): number {
  const maxByFraction = Math.floor(workArea.height * MAX_HEIGHT_FRACTION)
  const maxByBottom = workArea.y + workArea.height - windowTop
  const maxHeight = Math.max(MIN_WINDOW_HEIGHT, Math.min(maxByFraction, maxByBottom))
  return Math.round(clamp(contentHeight, MIN_WINDOW_HEIGHT, maxHeight))
}

export type SizeAuthority = 'content' | 'manual'

// `bypassPinned` is an escape hatch for deliberate structural UI changes (a
// view swap, a warning appearing) that should still be able to resize a
// pinned window, distinct from organic content growth (a new chat message)
// which pinning is meant to freeze against. Callers scope how long/how
// often the bypass applies; this function only ever sees the resulting bool.
export function shouldApplyContentHeight(
  authority: SizeAuthority,
  pinned: boolean,
  bypassPinned = false
): boolean {
  return authority === 'content' && (!pinned || bypassPinned)
}

export function resetBounds(
  defaultWidth: number,
  contentHeight: number,
  workArea: Rectangle,
  windowTop: number
): { width: number; height: number } {
  return {
    width: defaultWidth,
    height: clampContentHeight(contentHeight, workArea, windowTop)
  }
}
