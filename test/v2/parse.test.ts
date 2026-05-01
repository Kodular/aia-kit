import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parseAia } from '../../src/parse.js'

const FIXTURES = join(import.meta.dirname, '../fixtures')

describe('parseAia', () => {
  it('parses HelloPurr.aia without throwing', async () => {
    const bytes = readFileSync(join(FIXTURES, 'HelloPurr.aia'))
    const project = await parseAia(new Uint8Array(bytes).buffer as ArrayBuffer)
    expect(project._tag).toBe('AiaProject')
    expect(project.name).toBeTruthy()
  })

  it('returns at least one screen', async () => {
    const bytes = readFileSync(join(FIXTURES, 'HelloPurr.aia'))
    const project = await parseAia(new Uint8Array(bytes))
    expect(project.screens.length).toBeGreaterThan(0)
    expect(project.screens[0].name).toBeTruthy()
    expect(typeof project.screens[0].scm).toBe('string')
    expect(typeof project.screens[0].bky).toBe('string')
  })

  it('screen scm contains $JSON block', async () => {
    const bytes = readFileSync(join(FIXTURES, 'HelloPurr.aia'))
    const project = await parseAia(new Uint8Array(bytes))
    expect(project.screens[0].scm).toMatch(/\$JSON/)
  })

  it('asset data() returns Uint8Array', async () => {
    const bytes = readFileSync(join(FIXTURES, 'HelloPurr.aia'))
    const project = await parseAia(new Uint8Array(bytes))
    if (project.assets.length > 0) {
      const data = await project.assets[0].data()
      expect(data).toBeInstanceOf(Uint8Array)
      expect(data.length).toBe(project.assets[0].sizeBytes)
    }
  })

  it('throws AiaZipError for invalid ZIP bytes', async () => {
    const { AiaZipError } = await import('../../src/core/errors.js')
    await expect(parseAia(new Uint8Array([0, 1, 2, 3]))).rejects.toBeInstanceOf(AiaZipError)
  })

  it('throws AiaStructureError for valid ZIP missing project.properties', async () => {
    const { AiaStructureError } = await import('../../src/core/errors.js')
    const { BlobWriter, ZipWriter } = await import('@zip.js/zip.js')
    const bw = new BlobWriter()
    const writer = new ZipWriter(bw)
    const blob = await writer.close()
    const ab = await blob.arrayBuffer()
    await expect(parseAia(new Uint8Array(ab))).rejects.toBeInstanceOf(AiaStructureError)
  })
})
