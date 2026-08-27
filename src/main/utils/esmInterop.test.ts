import { describe, expect, it } from 'vitest'
import { unwrapDefaultExport } from './esmInterop'

class RealClass {}

describe('unwrapDefaultExport', () => {
  it('returns the value directly when it is already the class/function', () => {
    expect(unwrapDefaultExport(RealClass)).toBe(RealClass)
  })

  it('unwraps .default when given a module namespace object instead', () => {
    expect(unwrapDefaultExport({ default: RealClass })).toBe(RealClass)
  })
})
