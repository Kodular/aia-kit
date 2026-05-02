import { describe, it, expect } from 'vitest'
import {
  AiaKitError,
  AiaParseError,
  AiaZipError,
  AiaStructureError,
  AiaWriteError
} from '#/core/errors.js'

describe('error hierarchy', () => {
  it('AiaZipError is instanceof AiaParseError and AiaKitError', () => {
    const e = new AiaZipError('bad zip', new Error('cause'))
    expect(e).toBeInstanceOf(AiaZipError)
    expect(e).toBeInstanceOf(AiaParseError)
    expect(e).toBeInstanceOf(AiaKitError)
    expect(e).toBeInstanceOf(Error)
  })

  it('AiaStructureError is instanceof AiaParseError and AiaKitError', () => {
    const e = new AiaStructureError('bad structure', new Error('cause'))
    expect(e).toBeInstanceOf(AiaStructureError)
    expect(e).toBeInstanceOf(AiaParseError)
    expect(e).toBeInstanceOf(AiaKitError)
  })

  it('AiaWriteError is instanceof AiaKitError but not AiaParseError', () => {
    const e = new AiaWriteError('write failed')
    expect(e).toBeInstanceOf(AiaWriteError)
    expect(e).toBeInstanceOf(AiaKitError)
    expect(e).not.toBeInstanceOf(AiaParseError)
  })

  it('preserves cause', () => {
    const cause = new Error('original')
    const e = new AiaZipError('wrapped', cause)
    expect(e.cause).toBe(cause)
  })
})