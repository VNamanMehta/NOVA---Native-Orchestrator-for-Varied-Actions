import { ipcMain } from 'electron'
import {
  RequestValidators,
  type IpcResultValue,
  type RequestChannel,
  type RequestPayloads,
  type ResponsePayloads
} from '../../shared/ipc'
import { runSafely } from './safeHandle'

// Registers a request handler with validation, the IpcResult envelope, and the
// channel's payload/response types applied. Handlers take a validated payload
// and return a bare value; returning the wrong shape fails to build.
export function handleRequest<C extends RequestChannel>(
  channel: C,
  handler: (payload: RequestPayloads[C]) => Promise<IpcResultValue<ResponsePayloads[C]>>
): void {
  const validate = RequestValidators[channel]

  ipcMain.handle(channel, (_event, payload: unknown) => runSafely(() => handler(validate(payload))))
}
