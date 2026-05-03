import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { readAix } from '#/aix/index.js'
import { FIXTURES_DIR } from '#/test-helpers.js'

const AIX_FIXTURE_DIR = join(FIXTURES_DIR, 'aix')

/**
 * Curated corpus: one row per checked-in MIT extension under {@link AIX_FIXTURE_DIR}.
 *
 * | Column            | Meaning |
 * |-------------------|---------|
 * | `filename`        | Basename of the `.aix` on disk |
 * | `packageName`     | `readAix` → `AiaExtension.packageName` (prefix of first descriptor `type`) |
 */
const MIT_AIX_READ_FIXTURE_MATRIX: ReadonlyArray<readonly [filename: string, packageName: string]> = [
  ['edu.mit.appinventor.ble-20240822.aix', 'edu.mit.appinventor.ble'],
  ['edu.mit.appinventor.ai.facemesh.aix', 'edu.mit.appinventor.ai.facemesh'],
  ['LookExtension-20181124.aix', 'edu.mit.appinventor.ai.look'],
  ['com.bbc.microbit.profile-20200518.aix', 'com.bbc.microbit.profile'],
  ['PersonalAudioClassifier.aix', 'edu.mit.appinventor.ai.personalaudioclassifier'],
  ['PersonalImageClassifier.aix', 'edu.mit.appinventor.ai.personalimageclassifier'],
  ['edu.mit.appinventor.ai.posenet.aix', 'edu.mit.appinventor.ai.posenet'],
  ['edu.mit.appinventor.ai.teachablemachine.aix', 'edu.mit.appinventor.ai.teachablemachine'],
]

describe('readAix — fixture corpus (read-only)', () => {
  it('LookExtension-20181124.aix — readAix exposes expected descriptor and manifest shape', async () => {
    const bytes = readFileSync(join(AIX_FIXTURE_DIR, 'LookExtension-20181124.aix'))
    const ext = await readAix(bytes)

    expect(ext.packageName).toBe('edu.mit.appinventor.ai.look')
    expect(ext.minSdk).toBe(7)
    // component.json uses a string version stamp for this extension
    expect(ext.version).toBe('20181124')

    expect(ext.components).toHaveLength(1)
    const c = ext.components[0]!
    expect(c.type).toBe('edu.mit.appinventor.ai.look.Look')
    expect(c.name).toBe('Look')
    expect(c.categoryString).toBe('EXTENSION')
    expect(c.iconName).toBe('aiwebres/glasses.png')
    expect(c.methods.map(m => m.name)).toEqual([
      'ClassifyImageData',
      'ClassifyVideoData',
      'ToggleCameraFacingMode',
    ])
    expect(c.events.map(e => e.name)).toEqual(['ClassifierReady', 'Error', 'GotClassification'])
    expect(c.properties.map(p => p.name)).toEqual(['InputMode', 'WebViewer'])
    expect(c.blockProperties.map(b => b.name)).toEqual(['InputMode', 'WebViewer'])

    expect(ext.manifest.packageName).toBe('edu.mit.appinventor.ai.look')
    expect(ext.manifest.version).toBe('20181124')

    const jar = await ext.loadClassesJar()
    expect(jar.byteLength).toBeGreaterThan(0)

    const assets = await ext.loadAssets()
    expect(assets.map(a => a.name).toSorted()).toEqual([
      'group1-shard1of1',
      'look.html',
      'look.js',
      'scavenger_classes.js',
      'tfjs-0.12.4.js',
      'web_model.pb',
      'weights_manifest.json',
    ])
    for (const a of assets) {
      await expect(a.data()).resolves.toBeInstanceOf(Uint8Array)
      expect((await a.data()).byteLength).toBeGreaterThan(0)
    }
  })

  it.each(MIT_AIX_READ_FIXTURE_MATRIX)(
    'parses %s (package %s)',
    async (filename, packageName) => {
      const bytes = readFileSync(join(AIX_FIXTURE_DIR, filename))
      const ext = await readAix(bytes)

      expect(ext.packageName).toBe(packageName)
      expect(ext.components.length).toBeGreaterThanOrEqual(1)
      const type = ext.components[0]?.type
      expect(type).toBeDefined()
      expect(type!.startsWith(`${packageName}.`)).toBe(true)

      const jar = await ext.loadClassesJar()
      expect(jar.byteLength).toBeGreaterThan(0)

      const assets = await ext.loadAssets()
      for (const asset of assets) {
        expect(asset.name).toBeDefined()
        await expect(asset.data()).resolves.toBeInstanceOf(Uint8Array)
      }
    },
  )
})
