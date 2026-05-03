import type { Entry } from '@zip.js/zip.js'
import type { AiaExtension, AixAsset, AixManifest } from '#/types.js'
import type { ComponentDescriptor } from '#/component-descriptor/descriptors.js'
import { AiaStructureError } from '#/errors.js'
import { extractPackageName } from '#/utils/package-names.js'
import { readZipEntryBlob, readZipEntryText } from '#/utils/zip-io.js'

function findComponentJsonEntry(entries: Entry[]): Entry | undefined {
  return entries.find(e => {
    const f = e.filename.split('/').pop()
    return f === 'component.json' || f === 'components.json'
  })
}

async function loadExtensionComponentDescriptors(
  entries: Entry[],
  missingMessage = 'Missing component.json or components.json',
): Promise<ComponentDescriptor[]> {
  const componentEntry = findComponentJsonEntry(entries)
  if (!componentEntry) {
    throw new AiaStructureError(missingMessage, null)
  }
  const text = await readZipEntryText(componentEntry)
  const parsed = JSON.parse(text) as unknown
  return Array.isArray(parsed) ? (parsed as ComponentDescriptor[]) : [parsed as ComponentDescriptor]
}

function isClassesJarEntry(filename: string): boolean {
  if (filename.endsWith('/')) return false
  return filename.endsWith('classes.jar')
}

function isAixAssetFileEntry(filename: string): boolean {
  if (filename.endsWith('/')) return false
  return filename.includes('/assets/')
}

function buildAiaExtensionBody(
  entries: Entry[],
  packageName: string,
  components: ComponentDescriptor[],
): AiaExtension {
  const first = components[0]
  const manifest: AixManifest = {
    packageName,
    version: first?.version ?? 1,
    minSdk: 7,
    buildVersion: '1',
    permissions: [],
  }

  const jarEntry = entries.find(e => isClassesJarEntry(e.filename))
  const assetFileEntries = entries
    .filter(e => isAixAssetFileEntry(e.filename))
    .toSorted((a, b) => a.filename.localeCompare(b.filename))

  return {
    packageName,
    version: first?.version ?? 1,
    minSdk: 7,
    components,
    manifest,
    loadClassesJar: async () =>
      jarEntry ? new Uint8Array(await (await readZipEntryBlob(jarEntry)).arrayBuffer()) : new Uint8Array(),
    loadAssets: async (): Promise<AixAsset[]> =>
      Promise.all(
        assetFileEntries.map(async entry => ({
          name: entry.filename.split('/').pop() ?? entry.filename,
          data: async () => new Uint8Array(await (await readZipEntryBlob(entry)).arrayBuffer()),
        })),
      ),
  }
}

/**
 * Build an {@link AiaExtension} from zip entries (one extension tree).
 * Throws {@link AiaStructureError} if component descriptor JSON is missing or invalid.
 */
export async function extensionFromZipEntries(entries: Entry[], packageName: string): Promise<AiaExtension> {
  const components = await loadExtensionComponentDescriptors(entries)
  return buildAiaExtensionBody(entries, packageName, components)
}

/** Standalone `.aix`: infer {@link AiaExtension.packageName} from the first component's type. */
export async function extensionFromStandaloneAixEntries(entries: Entry[]): Promise<AiaExtension> {
  const components = await loadExtensionComponentDescriptors(
    entries,
    'AIX missing component.json or components.json',
  )
  const packageName = components[0]?.type ? extractPackageName(components[0].type) : 'unknown'
  return buildAiaExtensionBody(entries, packageName, components)
}
