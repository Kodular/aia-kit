import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import * as yail from '#/yail/index.js'

const root = join(import.meta.dirname, '..')

describe('retired compatibility APIs', () => {
  it('removes compatibility source files instead of wrapping old APIs', () => {
    expect(existsSync(join(root, 'src/resolve.ts'))).toBe(false)
    expect(existsSync(join(root, 'src/mutations/index.ts'))).toBe(false)
    expect(existsSync(join(root, 'src/yail/create-yail-generator.ts'))).toBe(false)
  })

  it('exposes only YailEmitter from the YAIL public API', () => {
    expect(yail.YailEmitter).toBeTypeOf('function')
    expect('createYailGenerator' in yail).toBe(false)
  })
})
