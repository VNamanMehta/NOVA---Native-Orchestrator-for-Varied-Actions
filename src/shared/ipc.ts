import { isProviderId, type ProviderId, type SettingsState } from './domain'

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

export interface ContentHeightReport {
  height: number
  // True only for the report following a deliberate structural UI change —
  // lets main resize a pinned window for exactly that report.
  structuralChange: boolean
}

export interface RendererToMainPayloads {
  [RendererToMainChannels.contentHeight]: ContentHeightReport
}

// --- 2. renderer → main, request/response ------------------------------------

export const RequestChannels = {
  chatSend: 'renderer->main:chat-send',
  chatRetry: 'renderer->main:chat-retry',
  settingsGet: 'renderer->main:settings-get',
  settingsSetApiKey: 'renderer->main:settings-set-api-key',
  settingsSetActiveProvider: 'renderer->main:settings-set-active-provider'
} as const

export type RequestChannel = (typeof RequestChannels)[keyof typeof RequestChannels]

export interface RequestPayloads {
  [RequestChannels.chatSend]: string
  [RequestChannels.chatRetry]: undefined
  [RequestChannels.settingsGet]: undefined
  [RequestChannels.settingsSetApiKey]: { provider: ProviderId; key: string }
  [RequestChannels.settingsSetActiveProvider]: { provider: ProviderId }
}

export interface ResponsePayloads {
  [RequestChannels.chatSend]: IpcResult<Message>
  [RequestChannels.chatRetry]: IpcResult<Message>
  [RequestChannels.settingsGet]: IpcResult<SettingsState>
  [RequestChannels.settingsSetApiKey]: IpcResult<void>
  [RequestChannels.settingsSetActiveProvider]: IpcResult<void>
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
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
  },
  [RequestChannels.chatRetry]: (payload) => {
    if (payload !== undefined) {
      throw new Error('chat:retry expects no payload')
    }
    return undefined
  },
  [RequestChannels.settingsGet]: (payload) => {
    if (payload !== undefined) {
      throw new Error('settings:get expects no payload')
    }
    return undefined
  },
  [RequestChannels.settingsSetApiKey]: (payload) => {
    if (
      !isRecord(payload) ||
      !isProviderId(payload.provider) ||
      typeof payload.key !== 'string' ||
      payload.key.trim().length === 0
    ) {
      throw new Error('settings:setApiKey expects { provider, key }')
    }
    return { provider: payload.provider, key: payload.key }
  },
  [RequestChannels.settingsSetActiveProvider]: (payload) => {
    if (!isRecord(payload) || !isProviderId(payload.provider)) {
      throw new Error('settings:setActiveProvider expects { provider }')
    }
    return { provider: payload.provider }
  }
}

// --- 3. main → renderer, push --------------------------------------------------

export const MainToRendererChannels = {
  chatToken: 'main->renderer:chat-token',
  confirmationRequest: 'main->renderer:confirmation-request',
  openSettings: 'main->renderer:open-settings'
} as const

export type MainToRendererChannel =
  (typeof MainToRendererChannels)[keyof typeof MainToRendererChannels]

export interface MainToRendererPayloads {
  [MainToRendererChannels.chatToken]: { token: string }
  [MainToRendererChannels.confirmationRequest]: {
    toolName: string
    params: Record<string, unknown>
  }
  [MainToRendererChannels.openSettings]: undefined
}

// TODO(Phase 2): confirmation-request still needs a renderer->main approve/deny
// channel and a correlation id (concurrent tasks, Phase 4).

// --- The bridge surface exposed to the renderer as `window.api` --------------

export interface NovaApi {
  window: {
    reportContentHeight: (
      report: RendererToMainPayloads[typeof RendererToMainChannels.contentHeight]
    ) => void
  }
  chat: {
    send: (
      text: RequestPayloads[typeof RequestChannels.chatSend]
    ) => Promise<ResponsePayloads[typeof RequestChannels.chatSend]>
    retry: () => Promise<ResponsePayloads[typeof RequestChannels.chatRetry]>
  }
  settings: {
    get: () => Promise<ResponsePayloads[typeof RequestChannels.settingsGet]>
    setApiKey: (
      provider: ProviderId,
      key: string
    ) => Promise<ResponsePayloads[typeof RequestChannels.settingsSetApiKey]>
    setActiveProvider: (
      provider: ProviderId
    ) => Promise<ResponsePayloads[typeof RequestChannels.settingsSetActiveProvider]>
  }
  events: {
    on: <C extends MainToRendererChannel>(
      channel: C,
      handler: (payload: MainToRendererPayloads[C]) => void
    ) => () => void
  }
}
