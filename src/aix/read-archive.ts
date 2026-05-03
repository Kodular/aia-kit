import { BlobReader, ZipReader, type Entry } from '@zip.js/zip.js'
import type { AiaExtension, AixManifest, AixAsset } from '#/types.js'
import type { ComponentDescriptor } from '#/component-descriptor/descriptors.js'
import { AiaZipError, AiaStructureError } from '#/errors.js'
import { extractPackageName } from '#/utils/package-names.js'
import { readZipEntryBlob, readZipEntryText, toBlob } from '#/utils/zip-io.js'

// TODO: zip members present under test-fixtures/aix (MIT corpus) but not surfaced by readAix (<package>/ = first path segment in that tree)
// <package>/files/AndroidRuntime.jar — not read (loadClassesJar only uses *classes.jar)
// <package>/files/component_build_info.json, <package>/files/component_build_infos.json — not read
// <package>/extension.properties — not read (file exists in every corpus .aix here)
// <package>/aiwebres/… — not read when present (BLE has no aiwebres/; others do); not read unless duplicated under …/assets/
// AixManifest.minSdk / buildVersion / permissions — placeholders, not read from archive
// First match wins: component.json vs components.json zip order; first *classes.jar; loadAssets uses basename only
// Tests (read-fixtures, aix.test.ts): do not assert the above, multi-component packs + build-info pairing, or full zip parity

/** Parse a standalone `.aix` (ZIP) into an {@link AiaExtension}. */
export async function readAix(input: Uint8Array | ArrayBuffer | Blob): Promise<AiaExtension> {
  const blob = toBlob(input)
  let entries: Entry[]
  try {
    const zr = new ZipReader(new BlobReader(blob))
    entries = await zr.getEntries()
    await zr.close()
  } catch (e) {
    throw new AiaZipError(`Cannot read AIX archive: ${e}`, e)
  }

  const componentEntry = entries.find(e => {
    const f = e.filename.split('/').pop()
    return f === 'component.json' || f === 'components.json'
  })
  if (!componentEntry) {
    throw new AiaStructureError('AIX missing component.json or components.json', null)
  }

  const text = await readZipEntryText(componentEntry)
  const parsed = JSON.parse(text)
  const components: ComponentDescriptor[] = Array.isArray(parsed) ? parsed : [parsed]
  const first = components[0]
  const packageName = first?.type ? extractPackageName(first.type) : 'unknown'

  const manifest: AixManifest = {
    packageName,
    version: first?.version ?? 1,
    minSdk: 7,
    buildVersion: '1',
    permissions: [],
  }

  const jarEntry = entries.find(e => e.filename.endsWith('classes.jar'))
  const assetFileEntries = entries
    .filter(e => isAixAssetFileEntry(e.filename))
    .toSorted((a, b) => a.filename.localeCompare(b.filename))

  return {
    packageName,
    version: first?.version ?? 1,
    minSdk: 7,
    components,
    manifest,
    loadClassesJar: async () => jarEntry ? new Uint8Array(await (await readZipEntryBlob(jarEntry)).arrayBuffer()) : new Uint8Array(),
    loadAssets: async (): Promise<AixAsset[]> =>
      Promise.all(assetFileEntries.map(async entry => ({
        name: entry.filename.split('/').pop() ?? entry.filename,
        data: async () => new Uint8Array(await (await readZipEntryBlob(entry)).arrayBuffer()),
      }))),
  }
}

/** File entries under a `…/assets/` directory (package-rooted MIT / App Inventor AIX layout). */
function isAixAssetFileEntry(filename: string): boolean {
  if (filename.endsWith('/')) return false
  return filename.includes('/assets/')
}
