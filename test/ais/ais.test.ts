import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { exportScreenAsAis, readAis } from '#/ais/index.js'
import { readAia } from '#/aia/read-archive.js'

const FIXTURES = join(import.meta.dirname, '../fixtures')

describe('aia-kit/ais', () => {
  it('readAis matches readAia for HelloPurr.aia', async () => {
    const bytes = readFileSync(join(FIXTURES, 'HelloPurr.aia'))
    const viaAis = await readAis(new Uint8Array(bytes))
    const viaAia = await readAia(new Uint8Array(bytes))
    expect(viaAis.screens.map(s => s.name)).toEqual(viaAia.screens.map(s => s.name))
    expect(viaAis.properties.main).toBe(viaAia.properties.main)
  })

  it('exportScreenAsAis yields one screen and round-trips readable', async () => {
    const bytes = readFileSync(join(FIXTURES, 'HelloPurr.aia'))
    const project = await readAia(new Uint8Array(bytes))
    const firstName = project.screens[0]?.name
    expect(firstName).toBeTruthy()
    const blob = await exportScreenAsAis(project, firstName!)
    const out = await readAia(new Uint8Array(await blob.arrayBuffer()))
    expect(out.screens).toHaveLength(1)
    expect(out.screens[0].name).toBe(firstName)
    expect(out.screens[0].scm).toBe(project.screens.find(s => s.name === firstName)!.scm)
    expect(out.screens[0].bky).toBe(project.screens.find(s => s.name === firstName)!.bky)
  })
})
