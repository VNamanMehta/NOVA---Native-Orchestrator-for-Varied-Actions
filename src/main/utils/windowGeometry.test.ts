import { describe, expect, it } from 'vitest'
import {
  clampContentHeight,
  computeWindowPosition,
  resetBounds,
  shouldApplyContentHeight,
  MIN_WINDOW_HEIGHT,
  MIN_WINDOW_WIDTH
} from './windowGeometry'

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

describe('clampContentHeight', () => {
  it('floors short content at the minimum height', () => {
    expect(clampContentHeight(20, workArea, 300)).toBe(MIN_WINDOW_HEIGHT)
  })

  it('passes through a height within range', () => {
    expect(clampContentHeight(400, workArea, 200)).toBe(400)
  })

  it('caps at the display fraction (50% of work area)', () => {
    expect(clampContentHeight(2000, workArea, 0)).toBe(Math.floor(1080 * 0.5))
  })

  it('caps by remaining room below the window top so the bottom stays on-screen', () => {
    expect(clampContentHeight(2000, workArea, 900)).toBe(1080 - 900)
  })
})

describe('shouldApplyContentHeight', () => {
  it('applies content height only when content authority and unpinned', () => {
    expect(shouldApplyContentHeight('content', false)).toBe(true)
  })

  it('ignores content height under manual authority', () => {
    expect(shouldApplyContentHeight('manual', false)).toBe(false)
  })

  it('ignores content height when pinned, even under content authority', () => {
    expect(shouldApplyContentHeight('content', true)).toBe(false)
  })

  it('ignores content height when pinned and manual', () => {
    expect(shouldApplyContentHeight('manual', true)).toBe(false)
  })
})

describe('resetBounds', () => {
  it('restores the default width and the clamped content height', () => {
    expect(resetBounds(720, 400, workArea, 200)).toEqual({ width: 720, height: 400 })
  })

  it('floors the height at the minimum for short content', () => {
    expect(resetBounds(720, 10, workArea, 200)).toEqual({
      width: 720,
      height: MIN_WINDOW_HEIGHT
    })
  })

  it('caps the height at the display fraction for tall content', () => {
    expect(resetBounds(720, 2000, workArea, 0)).toEqual({
      width: 720,
      height: Math.floor(workArea.height * 0.5)
    })
  })
})

describe('MIN_WINDOW_WIDTH', () => {
  it('is a sane floor below the default width', () => {
    expect(MIN_WINDOW_WIDTH).toBeLessThan(720)
    expect(MIN_WINDOW_WIDTH).toBeGreaterThan(0)
  })
})
