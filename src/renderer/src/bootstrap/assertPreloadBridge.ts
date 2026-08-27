// Asserting the bridge once at boot is what lets the rest of the renderer call
// window.api with no defensive chaining. Checks leaves, not just `api`, since a
// partial bridge would otherwise pass here and crash at the call site.
// Keep in sync with NovaApi.
const REQUIRED_LEAVES = [
  'window.reportContentHeight',
  'window.notifyStructuralUiChange',
  'chat.send',
  'settings.get',
  'settings.setApiKey',
  'settings.setActiveProvider',
  'events.on'
] as const

export function assertPreloadBridge(container: HTMLElement): void {
  const missing = REQUIRED_LEAVES.filter((path) => typeof resolve(window.api, path) !== 'function')

  if (missing.length === 0) return

  container.textContent = 'Nova failed to start: the preload bridge is unavailable.'
  throw new Error(`Preload bridge unavailable: window.api is missing ${missing.join(', ')}.`)
}

function resolve(root: unknown, path: string): unknown {
  return path
    .split('.')
    .reduce<unknown>(
      (value, key) => (value == null ? undefined : (value as Record<string, unknown>)[key]),
      root
    )
}
