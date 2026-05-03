import { BlobReader, ZipReader, type Entry } from '@zip.js/zip.js'
import type { AiaExtension, AixManifest, AixAsset } from '#/types.js'
import type { ComponentDescriptor } from '#/component-descriptor/descriptors.js'
import { AiaZipError, AiaStructureError } from '#/errors.js'
import { extractPackageName } from '#/utils/package-names.js'
import { readZipEntryBlob, readZipEntryText, toBlob } from '#/utils/zip-io.js'

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
  const assetFileEntries = entries.filter(e => e.filename.startsWith('assets/') && !e.filename.endsWith('/'))

  return {
    packageName,
    version: first?.version ?? 1,
    minSdk: 7,
    components,
    manifest,
    loadClasses: async () => jarEntry ? new Uint8Array(await (await readZipEntryBlob(jarEntry)).arrayBuffer()) : new Uint8Array(),
    loadAssets: async (): Promise<AixAsset[]> =>
      Promise.all(assetFileEntries.map(async entry => ({
        name: entry.filename.split('/').pop() ?? entry.filename,
        data: async () => new Uint8Array(await (await readZipEntryBlob(entry)).arrayBuffer()),
      }))),
  }
}
