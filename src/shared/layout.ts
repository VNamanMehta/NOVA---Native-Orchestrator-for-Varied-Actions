// Single source of truth for the overlay panel's height cap, shared by main
// (src/main/utils/windowGeometry.ts, which clamps the actual BrowserWindow
// bounds) and the renderer (App.tsx, which caps the panel's CSS max-height
// so its content scrolls internally instead of overflowing).
// Keeping one constant here prevents the two from drifting apart.
export const MAX_HEIGHT_FRACTION = 0.5
