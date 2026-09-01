import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { useAppStore } from './appStore'

afterEach(() => {
  useAppStore.setState(useAppStore.getInitialState(), true)
})

describe('useAppStore', () => {
  it('starts on the chat view with no api key configured', () => {
    const { result } = renderHook(() => useAppStore())
    expect(result.current.view).toBe('chat')
    expect(result.current.settings).toEqual({ activeProvider: 'groq', apiKeyConfigured: false })
  })

  it('openSettings switches the view to settings', () => {
    const { result } = renderHook(() => useAppStore())
    act(() => result.current.openSettings())
    expect(result.current.view).toBe('settings')
  })

  it('closeSettings switches the view back to chat', () => {
    const { result } = renderHook(() => useAppStore())
    act(() => result.current.openSettings())
    act(() => result.current.closeSettings())
    expect(result.current.view).toBe('chat')
  })

  it('setSettings replaces the settings state', () => {
    const { result } = renderHook(() => useAppStore())
    act(() => result.current.setSettings({ activeProvider: 'groq', apiKeyConfigured: true }))
    expect(result.current.settings).toEqual({ activeProvider: 'groq', apiKeyConfigured: true })
  })
})
