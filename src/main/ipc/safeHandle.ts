import type { IpcResult } from '../../shared/ipc'

/**
 * Runs an async handler and converts the outcome into an IpcResult envelope.
 * A thrown error becomes { ok: false } instead of a mangled invoke rejection.
 * Every renderer->main request handler funnels through this.
 */
export async function runSafely<Res>(fn: () => Promise<Res>): Promise<IpcResult<Res>> {
  try {
    return { ok: true, value: await fn() }
  } catch (err) {
    return { ok: false, error: { message: err instanceof Error ? err.message : String(err) } }
  }
}
