import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Diagnostic } from '#/core/diagnostics.js'
import { Platform, getEnvironmentFor } from '#/core/environment.js'
import type { AiaProject, AiaScreen, ProjectProperties } from '#/core/types.js'
import { AiaWriteError, AiaZipError, AiaStructureError } from '#/core/errors.js'
import {
  getScreen,
  readAia,
  replaceScreenBky,
  replaceScreenScm,
  writeAia,
} from '#/aia.js'
import { buildModel } from '#/model.js'
import { makeMinimalProject, makeProjectProperties } from './helpers.js'

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

describe('AIA domain API', () => {
  it('readAia parses HelloPurr.aia without throwing', async () => {
    const bytes = readFileSync(join(FIXTURES, 'HelloPurr.aia'))
    const project = await readAia(new Uint8Array(bytes).buffer as ArrayBuffer)
    expect(project._tag).toBe('AiaProject')
    expect(project.name).toBeTruthy()
  })

  it('readAia returns screens with raw SCM and BKY content', async () => {
    const bytes = readFileSync(join(FIXTURES, 'HelloPurr.aia'))
    const project = await readAia(new Uint8Array(bytes))
    expect(project.screens.length).toBeGreaterThan(0)
    expect(project.screens[0].name).toBeTruthy()
    expect(project.screens[0].scm).toMatch(/\$JSON/)
    expect(typeof project.screens[0].bky).toBe('string')
  })

  it('asset data() returns Uint8Array', async () => {
    const bytes = readFileSync(join(FIXTURES, 'HelloPurr.aia'))
    const project = await readAia(new Uint8Array(bytes))
    if (project.assets.length > 0) {
      const data = await project.assets[0].data()
      expect(data).toBeInstanceOf(Uint8Array)
      expect(data.length).toBe(project.assets[0].sizeBytes)
    }
  })

  it('readAia throws AiaZipError for invalid ZIP bytes', async () => {
    await expect(readAia(new Uint8Array([0, 1, 2, 3]))).rejects.toBeInstanceOf(AiaZipError)
  })

  it('readAia throws AiaStructureError for valid ZIP missing project.properties', async () => {
    const { BlobWriter, ZipWriter } = await import('@zip.js/zip.js')
    const bw = new BlobWriter()
    const writer = new ZipWriter(bw)
    const blob = await writer.close()
    const ab = await blob.arrayBuffer()
    await expect(readAia(new Uint8Array(ab))).rejects.toBeInstanceOf(AiaStructureError)
  })

  it("getScreen(project, 'Screen1') returns screen", () => {
    const project = makeMinimalProject()
    expect(getScreen(project, 'Screen1')).toBe(project.screens[0])
  })

  it("replaceScreenScm(project, 'Screen1', newScm) updates SCM and sets yail: null", () => {
    const project = makeMinimalProject({
      screens: [{ ...makeMinimalProject().screens[0], yail: 'existing yail' }],
    })
    const newScm = scmForScreen('Screen1')
    const result = replaceScreenScm(project, 'Screen1', newScm)
    expect(result.diagnostics).toEqual([])
    expect(result.project.screens[0].scm).toBe(newScm)
    expect(result.project.screens[0].yail).toBeNull()
  })

  it("replaceScreenBky(project, 'Screen1', newBky) updates BKY and sets yail: null", () => {
    const project = makeMinimalProject({
      screens: [{ ...makeMinimalProject().screens[0], yail: 'existing yail' }],
    })
    const newBky = '<xml><block type="text" /></xml>'
    const result = replaceScreenBky(project, 'Screen1', newBky)
    expect(result.diagnostics).toEqual([])
    expect(result.project.screens[0].bky).toBe(newBky)
    expect(result.project.screens[0].yail).toBeNull()
  })

  it('replaceScreenScm emits MISSING_SCREEN_FILE for unknown screen', () => {
    const project = makeMinimalProject()
    const result = replaceScreenScm(project, 'NoSuch', scmForScreen('NoSuch'))
    expect(result.project).toBe(project)
    expect(result.diagnostics[0].code).toBe('MISSING_SCREEN_FILE')
  })

  it('writeAia(project, { withYail: false }) is allowed', async () => {
    const project = makeMinimalProject()
    const out = await writeAia(project, { withYail: false })
    expect(out).toBeInstanceOf(Blob)
    expect(out.size).toBeGreaterThan(0)
  })

  it('writeAia rejects withYail: true for raw AiaProject', async () => {
    const project = makeMinimalProject()
    // @ts-expect-error YAIL generation requires a ModelProject.
    await expect(writeAia(project, { withYail: true })).rejects.toBeInstanceOf(AiaWriteError)
  })

  it('writeAia returns a valid ZIP that re-parses with same screen names', async () => {
    const bytes = readFileSync(join(FIXTURES, 'HelloPurr.aia'))
    const project = await readAia(new Uint8Array(bytes))
    const out = await writeAia(project)
    const ab = await out.arrayBuffer()
    const header = new Uint8Array(ab).slice(0, 4)
    expect(header[0]).toBe(0x50)
    expect(header[1]).toBe(0x4B)

    const reparsed = await readAia(new Uint8Array(ab))
    const originalNames = project.screens.map(s => s.name).sort()
    const reparsedNames = reparsed.screens.map(s => s.name).sort()
    expect(reparsedNames).toEqual(originalNames)
  })

  it('writeAia accepts a ModelProject without generating missing YAIL by default', async () => {
    const env = await getEnvironmentFor(Platform.MitAppInventor)
    const model = buildModel(
      minimalProjectWithNullYail([{ name: 'Screen1', scm: scmForScreen('Screen1') }]),
      env,
    )
    expect(
      model.diagnostics.filter((d: Diagnostic) => d.severity === 'error'),
    ).toHaveLength(0)

    const out = await writeAia(model)
    const reparsed = await readAia(new Uint8Array(await out.arrayBuffer()))
    expect(reparsed.screens[0].yail).toBeNull()
  })

  it('writeAia preserves existing non-null YAIL when withYail is false', async () => {
    const project = makeMinimalProject({
      screens: [{ ...makeMinimalProject().screens[0], yail: 'preserved yail' }],
    })
    const out = await writeAia(project, { withYail: false })
    const reparsed = await readAia(new Uint8Array(await out.arrayBuffer()))
    expect(reparsed.screens[0].yail).toBe('preserved yail')
  })

  it('writeAia writes generated .yail for ModelProject when withYail is true', async () => {
    const env = await getEnvironmentFor(Platform.MitAppInventor)
    const model = buildModel(
      minimalProjectWithNullYail([{ name: 'Screen1', scm: scmForScreen('Screen1') }]),
      env,
    )
    expect(
      model.diagnostics.filter((d: Diagnostic) => d.severity === 'error'),
    ).toHaveLength(0)
    expect(model.source.screens[0].yail).toBeNull()

    const out = await writeAia(model, { withYail: true })
    const reparsed = await readAia(new Uint8Array(await out.arrayBuffer()))
    expect(reparsed.screens).toHaveLength(1)
    const y = reparsed.screens[0].yail
    expect(y).not.toBeNull()
    expect(y!).toMatch(/define-repl-form|init-runtime/)
  })
})
