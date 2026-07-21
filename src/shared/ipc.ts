// --- Shared domain types ------------------------------------------------------

export interface Message {
  role: 'user' | 'assistant'
  content: string
}

// --- Request/response envelope ------------------------------------------------

export type IpcResult<T> =
  { ok: true; value: T } | { ok: false; error: { message: string; code?: string } }

export type IpcResultValue<R> = R extends { ok: true; value: infer V } ? V : never

// --- 1. renderer → main, fire-and-forget -------------------------------------

export const RendererToMainChannels = {
  contentHeight: 'renderer->main:content-height'
} as const

export type RendererToMainChannel =
  (typeof RendererToMainChannels)[keyof typeof RendererToMainChannels]

export interface RendererToMainPayloads {
  [RendererToMainChannels.contentHeight]: number
}

// --- 2. renderer → main, request/response ------------------------------------

export const RequestChannels = {
  chatSend: 'renderer->main:chat-send'
} as const

export type RequestChannel = (typeof RequestChannels)[keyof typeof RequestChannels]

export interface RequestPayloads {
  [RequestChannels.chatSend]: string
}

export interface ResponsePayloads {
  [RequestChannels.chatSend]: IpcResult<Message>
}

// Renderer payloads arrive as `unknown`. Validators throw on bad input;
// handleRequest applies them so handlers never re-check by hand.
export const RequestValidators: {
  [C in RequestChannel]: (payload: unknown) => RequestPayloads[C]
} = {
  [RequestChannels.chatSend]: (payload) => {
    if (typeof payload !== 'string') {
      throw new Error('chat:send expects a string payload')
    }
    return payload
  }
}

// --- 3. main → renderer, push (reserved — not implemented in Phase 0) --------

export const MainToRendererChannels = {
  chatToken: 'main->renderer:chat-token',
  confirmationRequest: 'main->renderer:confirmation-request'
} as const

export type MainToRendererChannel =
  (typeof MainToRendererChannels)[keyof typeof MainToRendererChannels]

export interface MainToRendererPayloads {
  [MainToRendererChannels.chatToken]: { token: string }
  [MainToRendererChannels.confirmationRequest]: {
    toolName: string
    params: Record<string, unknown>
  }
}

// TODO(Phase 1/2): outbound half only. Still needs a renderer->main approve/deny
// channel, a correlation id (concurrent tasks in Phase 4), and on/off on NovaApi.

// --- The bridge surface exposed to the renderer as `window.api` --------------

export interface NovaApi {
  window: {
    reportContentHeight: (
      height: RendererToMainPayloads[typeof RendererToMainChannels.contentHeight]
    ) => void
  }
  chat: {
    send: (
      text: RequestPayloads[typeof RequestChannels.chatSend]
    ) => Promise<ResponsePayloads[typeof RequestChannels.chatSend]>
  }
}
