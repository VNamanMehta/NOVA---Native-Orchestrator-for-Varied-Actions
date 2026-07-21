// --- Shared domain types ------------------------------------------------------

export interface Message {
  role: 'user' | 'assistant'
  content: string
}

// --- Request/response envelope ------------------------------------------------

export type IpcResult<T> =
  { ok: true; value: T } | { ok: false; error: { message: string; code?: string } }

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

// --- The bridge surface exposed to the renderer as `window.api` --------------

export interface NovaApi {
  reportContentHeight: (height: RendererToMainPayloads['renderer->main:content-height']) => void
}
