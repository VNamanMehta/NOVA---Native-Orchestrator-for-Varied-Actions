/**
 * The preload bridge is a boot invariant: if contextBridge never exposed
 * window.api, every feature is broken. Asserting once here is what lets the
 * rest of the renderer call window.api directly, with no defensive chaining
 * that would degrade into a silent no-op.
 *
 * Renders a visible message into the mount container before throwing, so the
 * failure is legible to the user as well as the console.
 */
export function assertPreloadBridge(container: HTMLElement): void {
  if (window.api) return

  container.textContent = 'Nova failed to start: the preload bridge is unavailable.'
  throw new Error('Preload bridge unavailable: window.api was not exposed.')
}
