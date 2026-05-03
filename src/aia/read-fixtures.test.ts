import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { readAia } from '#/aia/index.js'
import { FIXTURES_DIR } from '#/test-helpers.js'

const MIT_DEMO_AIA_DIR = join(FIXTURES_DIR, 'mit-extension-demos')

/**
 * Curated MIT extension demo AIAs under {@link MIT_DEMO_AIA_DIR}.
 *
 * | Column | Meaning |
 * |--------|---------|
 * | `filename` | Basename on disk |
 * | `extensionPackage` | Expected `AiaExtension.packageName` under `assets/external_comps/<pkg>/` |
 */
const MIT_DEMO_AIA_MATRIX: ReadonlyArray<readonly [filename: string, extensionPackage: string]> = [
  ['Facemesh_StarterProject.aia', 'edu.mit.appinventor.ai.facemesh'],
  ['ImageProcessorDemo.aia', 'ai.cdk.justus.ImageProcessor'],
  ['LookTest_20181124.aia', 'edu.mit.appinventor.ai.look'],
  ['PosenetTest.aia', 'edu.mit.appinventor.ai.posenet'],
  ['TophatMe.aia', 'edu.mit.appinventor.ai.posenet'],
]

describe('readAia — MIT extension demo fixture corpus (read-only)', () => {
  it('LookTest_20181124.aia — bundled Look extension and Screen1 project shape', async () => {
    const bytes = readFileSync(join(MIT_DEMO_AIA_DIR, 'LookTest_20181124.aia'))
    const project = await readAia(new Uint8Array(bytes))

    expect(project._tag).toBe('AiaProject')
    expect(project.name).toBe('Screen1')
    expect(project.properties.name).toBe('LookTestUpdated')
    expect(project.screens.map(s => s.name).sort()).toEqual(['Screen1'])

    const ext = project.extensions.find(e => e.packageName === 'edu.mit.appinventor.ai.look')!
    expect(ext.components).toHaveLength(1)
    const c = ext.components[0]!
    expect(c.type).toBe('edu.mit.appinventor.ai.look.Look')
    expect(c.name).toBe('Look')
    expect(c.categoryString).toBe('EXTENSION')
    expect(c.iconName).toBe('aiwebres/glasses.png')
    expect(c.version).toBe('20181124')
    expect(c.methods.map(m => m.name)).toEqual([
      'ClassifyImageData',
      'ClassifyVideoData',
      'ToggleCameraFacingMode',
    ])
    expect(c.events.map(e => e.name)).toEqual(['ClassifierReady', 'Error', 'GotClassification'])

    const jar = await ext.loadClasses()
    expect(jar.byteLength).toBeGreaterThan(0)
  })

  it.each(MIT_DEMO_AIA_MATRIX)(
    'parses %s (bundled extension %s)',
    async (filename, extensionPackage) => {
      const bytes = readFileSync(join(MIT_DEMO_AIA_DIR, filename))
      const project = await readAia(new Uint8Array(bytes))

      expect(project._tag).toBe('AiaProject')
      expect(project.screens.length).toBeGreaterThanOrEqual(1)
      const pkgs = project.extensions.map(e => e.packageName).sort()
      expect(pkgs).toContain(extensionPackage)

      const ext = project.extensions.find(e => e.packageName === extensionPackage)!
      expect(ext.components.length).toBeGreaterThanOrEqual(1)
      expect(await ext.loadClasses()).toBeInstanceOf(Uint8Array)
      expect((await ext.loadClasses()).byteLength).toBeGreaterThan(0)
    },
  )
})
