import type { Rectangle } from 'electron'

export const VERTICAL_ANCHOR = 1 / 3

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
