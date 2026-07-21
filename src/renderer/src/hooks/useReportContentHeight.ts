import { useEffect, type RefObject } from 'react'

export function useReportContentHeight(ref: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const element = ref.current
    if (!element) return

    const report = (): void => {
      window.api?.window?.reportContentHeight?.(element.getBoundingClientRect().height)
    }

    report()

    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(report)
    observer.observe(element)
    return () => observer.disconnect()
  }, [ref])
}
