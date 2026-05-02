import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parseAia } from '#/parse.js'
import { writeAia } from '#/write.js'

const FIXTURES = join(import.meta.dirname, 'fixtures')

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
    const { resolve } = await import('#/resolve.js')
    const { Environment } = await import('#/core/environment.js')
    const env = await Environment.kodularCreator()
    const model = resolve(project, env)
    const out = await writeAia(model)
    expect(out).toBeInstanceOf(Blob)
  })
})