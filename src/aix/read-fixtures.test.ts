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

      const jar = await ext.loadClasses()
      expect(jar.byteLength).toBeGreaterThan(0)

      const assets = await ext.loadAssets()
      for (const asset of assets) {
        expect(asset.name).toBeDefined()
        await expect(asset.data()).resolves.toBeInstanceOf(Uint8Array)
      }
    },
  )
})
