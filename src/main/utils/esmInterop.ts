// Node's require() of a pure-ESM package returns its module namespace
// object (default export under .default), not the default export itself —
// unlike a real `import x from 'y'`, which always unwraps it correctly.
export function unwrapDefaultExport<T>(imported: T | { default: T }): T {
  return typeof imported === 'function' ? imported : (imported as { default: T }).default
}
