import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parseAia } from '../../src/parse.js'
import { resolve } from '../../src/resolve.js'
import { Environment } from '../../src/core/environment.js'

const FIXTURES = join(import.meta.dirname, '../fixtures')

describe('resolve', () => {
  it('returns a ModelProject with _tag', async () => {
    const bytes = readFileSync(join(FIXTURES, 'HelloPurr.aia'))
    const raw = await parseAia(new Uint8Array(bytes))
    const env = await Environment.kodularCreator()
    const model = resolve(raw, env)
    expect(model._tag).toBe('ModelProject')
  })

  it('model.screens has same count as raw screens', async () => {
    const bytes = readFileSync(join(FIXTURES, 'HelloPurr.aia'))
    const raw = await parseAia(new Uint8Array(bytes))
    const env = await Environment.kodularCreator()
    const model = resolve(raw, env)
    expect(model.screens).toHaveLength(raw.screens.length)
  })

  it('resolves root form component', async () => {
    const bytes = readFileSync(join(FIXTURES, 'HelloPurr.aia'))
    const raw = await parseAia(new Uint8Array(bytes))
    const env = await Environment.kodularCreator()
    const model = resolve(raw, env)
    const screen = model.screens[0]
    expect(screen.form.name).toBeTruthy()
    expect(screen.form.descriptor).toBeTruthy()
  })

  it('never throws, even with empty screens', () => {
    const raw = {
      _tag: 'AiaProject' as const,
      name: 'Empty',
      properties: {},
      screens: [{
        name: 'Screen1',
        scm: `#|\n$JSON\n{"YaVersion":"1","Source":"Form","Properties":{"$Name":"Screen1","$Type":"Form","Uuid":"-1","$Components":[]}}\n|#`,
        bky: '<xml xmlns="https://developers.google.com/blockly/xml"></xml>',
        yail: null,
      }],
      assets: [],
      extensions: [],
    }
    const env = { lookup: () => null, withExtension: () => env, withExtensions: () => env } as any
    expect(() => resolve(raw, env)).not.toThrow()
  })

  it('emits UNRESOLVABLE_COMPONENT diagnostic for unknown type', () => {
    const raw = {
      _tag: 'AiaProject' as const,
      name: 'Test',
      properties: {},
      screens: [{
        name: 'Screen1',
        scm: `#|\n$JSON\n{"YaVersion":"1","Source":"Form","Properties":{"$Name":"Screen1","$Type":"Form","Uuid":"-1","$Components":[{"$Name":"Widget1","$Type":"GhostWidget","Uuid":"abc","$Components":[]}]}}\n|#`,
        bky: '<xml xmlns="https://developers.google.com/blockly/xml"></xml>',
        yail: null,
      }],
      assets: [],
      extensions: [],
    }
    const env = { lookup: () => null, withExtension: () => env, withExtensions: () => env } as any
    const model = resolve(raw, env)
    expect(model.diagnostics.some(d => d.code === 'UNRESOLVABLE_COMPONENT')).toBe(true)
  })
})
