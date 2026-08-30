import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useReportContentHeight } from './useReportContentHeight'

function elementRef(height: number): { current: HTMLElement | null } {
  const el = document.createElement('div')
  vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({ height } as DOMRect)
  return { current: el }
}

describe('useReportContentHeight', () => {
  it('reports the measured height with structuralChange from the consume callback', () => {
    const consumeStructuralChange = vi.fn(() => true)
    renderHook(() => useReportContentHeight(elementRef(240), consumeStructuralChange))

    expect(window.api.window.reportContentHeight).toHaveBeenCalledWith({
      height: 240,
      structuralChange: true
    })
  })

  it('reports structuralChange: false when the consume callback says so', () => {
    const consumeStructuralChange = vi.fn(() => false)
    renderHook(() => useReportContentHeight(elementRef(100), consumeStructuralChange))

    expect(window.api.window.reportContentHeight).toHaveBeenCalledWith({
      height: 100,
      structuralChange: false
    })
  })

  it('calls the consume callback exactly once per report', () => {
    const consumeStructuralChange = vi.fn(() => false)
    renderHook(() => useReportContentHeight(elementRef(50), consumeStructuralChange))

    expect(consumeStructuralChange).toHaveBeenCalledTimes(1)
  })
})
