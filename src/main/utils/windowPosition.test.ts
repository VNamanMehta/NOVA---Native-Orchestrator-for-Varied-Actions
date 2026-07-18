import { describe, expect, it } from 'vitest'
import { computeWindowPosition } from './windowPosition'

const workArea = { x: 0, y: 0, width: 1920, height: 1080 }

describe('computeWindowPosition', () => {
  it('centers horizontally and anchors in the upper third', () => {
    const { x, y } = computeWindowPosition(workArea, { width: 900, height: 670 })
    expect(x).toBe(Math.round((1920 - 900) / 2))
    expect(y).toBe(Math.round((1080 - 670) / 3))
  })

  it('offsets by the display origin for a secondary monitor', () => {
    const secondary = { x: 1920, y: -120, width: 2560, height: 1440 }
    const { x, y } = computeWindowPosition(secondary, { width: 900, height: 670 })
    expect(x).toBe(1920 + Math.round((2560 - 900) / 2))
    expect(y).toBe(-120 + Math.round((1440 - 670) / 3))
  })

  it('clamps a window larger than the work area to the origin', () => {
    const { x, y } = computeWindowPosition(workArea, { width: 3000, height: 2000 })
    expect(x).toBe(workArea.x)
    expect(y).toBe(workArea.y)
  })

  it('respects a custom vertical anchor', () => {
    const { y } = computeWindowPosition(workArea, { width: 900, height: 670 }, 0.5)
    expect(y).toBe(Math.round((1080 - 670) / 2))
  })
})
