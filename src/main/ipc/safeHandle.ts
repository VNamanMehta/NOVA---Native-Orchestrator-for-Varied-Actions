import type { IpcResult } from '../../shared/ipc'

// Converts a thrown error into { ok: false } rather than a mangled invoke rejection.
//
// TODO(Phase 1): forwards err.message verbatim. Provider SDKs embed request URLs,
// bodies, and sometimes credentials in messages — map those onto IpcResult.code
// before the first provider adapter lands.
export async function runSafely<Res>(fn: () => Promise<Res>): Promise<IpcResult<Res>> {
  try {
    return { ok: true, value: await fn() }
  } catch (err) {
    return { ok: false, error: { message: err instanceof Error ? err.message : String(err) } }
  }
}
