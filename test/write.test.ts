import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Diagnostic } from '#/core/diagnostics.js'
import { Environment } from '#/core/environment.js'
import type { AiaProject, AiaScreen, ProjectProperties } from '#/core/types.js'
import { parseAia } from '#/parse.js'
import { resolve } from '#/resolve.js'
import { writeAia } from '#/write.js'
import { makeProjectProperties } from './helpers.js'

const FIXTURES = join(import.meta.dirname, 'fixtures')

const EMPTY_BKY = `<xml xmlns="https://developers.google.com/blockly/xml"></xml>`

function scmForScreen(name: string): string {
  return `#|
$JSON
{"authURL":["aia-kit"],"YaVersion":"1","Source":"Form","Properties":{"$Name":"${name}","$Type":"Form","Uuid":"root-${name}","Title":"${name}","$Components":[]}}
|#`
}

function minimalProjectWithNullYail(
  screens: { name: string; scm: string }[],
  properties: ProjectProperties = makeProjectProperties(),
): AiaProject {
  const aiaScreens: AiaScreen[] = screens.map(({ name, scm }) => ({
    name,
    scm,
    bky: EMPTY_BKY,
    yail: null,
  }))
  return {
    _tag: 'AiaProject',
    name: 'Test',
    properties,
    screens: aiaScreens,
    assets: [],
    extensions: [],
  }
}

describe('writeAia', () => {
  it('returns a Blob', async () => {
    const bytes = readFileSync(join(FIXTURES, 'HelloPurr.aia'))
    const project = await parseAia(new Uint8Array(bytes))
    const out = await writeAia(project)
    expect(out).toBeInstanceOf(Blob)
    expect(out.size).toBeGreaterThan(0)
  })

  it('output is a valid ZIP (starts with PK signature)', async () => {
    const bytes = readFileSync(join(FIXTURES, 'HelloPurr.aia'))
    const project = await parseAia(new Uint8Array(bytes))
    const out = await writeAia(project)
    const ab = await out.arrayBuffer()
    const header = new Uint8Array(ab).slice(0, 4)
    expect(header[0]).toBe(0x50)
    expect(header[1]).toBe(0x4B)
  })

  it('output re-parses with same screen names', async () => {
    const bytes = readFileSync(join(FIXTURES, 'HelloPurr.aia'))
    const project = await parseAia(new Uint8Array(bytes))
    const out = await writeAia(project)
    const ab = await out.arrayBuffer()
    const reparsed = await parseAia(new Uint8Array(ab))
    const originalNames = project.screens.map(s => s.name).sort()
    const reparsedNames = reparsed.screens.map(s => s.name).sort()
    expect(reparsedNames).toEqual(originalNames)
  })

  it('accepts a ModelProject by using its source', async () => {
    const bytes = readFileSync(join(FIXTURES, 'HelloPurr.aia'))
    const project = await parseAia(new Uint8Array(bytes))
    const env = await Environment.kodularCreator()
    const model = resolve(project, env)
    const out = await writeAia(model)
    expect(out).toBeInstanceOf(Blob)
  })

  it('writes generated .yail for ModelProject when source screens have yail null', async () => {
    const env = await Environment.mitAppInventor()
    const model = resolve(
      minimalProjectWithNullYail([{ name: 'Screen1', scm: scmForScreen('Screen1') }]),
      env,
    )
    expect(
      model.diagnostics.filter((d: Diagnostic) => d.severity === 'error'),
    ).toHaveLength(0)
    expect(model.source.screens[0].yail).toBeNull()

    const out = await writeAia(model)
    const reparsed = await parseAia(new Uint8Array(await out.arrayBuffer()))
    expect(reparsed.screens).toHaveLength(1)
    const y = reparsed.screens[0].yail
    expect(y).not.toBeNull()
    expect(y!).toMatch(/define-repl-form|init-runtime/)
  })
})