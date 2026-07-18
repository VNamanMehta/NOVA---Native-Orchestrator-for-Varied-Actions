// --- 1. renderer → main, fire-and-forget ------------------------------------

export const RendererToMainChannels = {
  contentHeight: 'renderer->main:content-height'
} as const

export type RendererToMainChannel =
  (typeof RendererToMainChannels)[keyof typeof RendererToMainChannels]

export interface RendererToMainPayloads {
  [RendererToMainChannels.contentHeight]: number
}

// --- The bridge surface exposed to the renderer as `window.api` --------------

export interface NovaApi {
  reportContentHeight: (height: RendererToMainPayloads['renderer->main:content-height']) => void
}
