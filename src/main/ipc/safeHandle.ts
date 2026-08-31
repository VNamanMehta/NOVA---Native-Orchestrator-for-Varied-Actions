import { ProviderError } from '../agent/providers/types'
import type { IpcResult } from '../../shared/ipc'

// Converts a thrown error into { ok: false } rather than a mangled invoke rejection.
// A ProviderError's code crosses the wire too, so the renderer can distinguish
// failure kinds without parsing message text; anything else keeps the plain
// message-only shape, since only providers/agent code throws ProviderError.
export async function runSafely<Res>(fn: () => Promise<Res>): Promise<IpcResult<Res>> {
  try {
    return { ok: true, value: await fn() }
  } catch (err) {
    if (err instanceof ProviderError) {
      return { ok: false, error: { message: err.message, code: err.code } }
    }
    return { ok: false, error: { message: err instanceof Error ? err.message : String(err) } }
  }
}
