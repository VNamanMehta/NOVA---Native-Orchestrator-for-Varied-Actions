// Single source of truth for the chat panel's height cap, shared by main
// (src/main/utils/windowGeometry.ts, which clamps the actual BrowserWindow
// bounds) and the renderer (ChatWindow, which caps the panel's CSS
// max-height so MessageList scrolls internally instead of overflowing).
// Keeping one constant here prevents the two from drifting apart.
export const MAX_HEIGHT_FRACTION = 0.5
