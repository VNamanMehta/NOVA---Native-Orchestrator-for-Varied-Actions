// Node's require() of a pure-ESM package returns the module namespace object
// (default export under .default), unlike a real `import x from 'y'`.
export function unwrapDefaultExport<T>(imported: T | { default: T }): T {
  return typeof imported === 'function' ? imported : (imported as { default: T }).default
}
