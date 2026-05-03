import { BlobReader, BlobWriter, ZipReader, ZipWriter, TextWriter, type Entry, type FileEntry } from '@zip.js/zip.js'
import { getProperties } from 'properties-file'
import type { AiaProject, AiaScreen, AiaAsset, AiaExtension, AixManifest, AixAsset, ProjectProperties } from '#/core/types.js'
import type { ComponentDescriptor } from '#/core/descriptors.js'
import { AiaZipError, AiaStructureError } from '#/core/errors.js'
import type { Environment } from '#/environment.js'
import type { ModelProject } from '#/core/model.js'
import { extractClassName, extractPackageName } from '#/utils/package-names.js'

export function parseProjectProperties(raw: Record<string, string>): ProjectProperties {
  const known = new Set([
    'main', 'name', 'versioncode', 'versionname', 'aname', 'sizing', 'theme',
    'color.primary', 'color.primary.dark', 'color.accent',
    'showlistsasjsonarray', 'actionbar',
  ])
  const unknown: Record<string, string> = {}
  for (const [k, v] of Object.entries(raw)) {
    if (!known.has(k.toLowerCase())) unknown[k] = v
  }
  return {
    main: raw['main'] ?? '',
    name: raw['name'] ?? raw['aname'] ?? '',
    versionCode: parseInt(raw['versioncode'] ?? '1', 10) || 1,
    versionName: raw['versionname'] ?? '1.0',
    appName: raw['aname'],
    sizing: raw['sizing'] === 'Fixed' || raw['sizing'] === 'Responsive'
      ? raw['sizing'] as 'Fixed' | 'Responsive'
      : undefined,
    theme: raw['theme'],
    colorPrimary: raw['color.primary'],
    colorPrimaryDark: raw['color.primary.dark'],
    colorAccent: raw['color.accent'],
    showListsAsJsonArray: raw['showlistsasjsonarray'] === 'true' ? true
      : raw['showlistsasjsonarray'] === 'false' ? false : undefined,
    actionBar: raw['actionbar'] === 'true' ? true
      : raw['actionbar'] === 'false' ? false : undefined,
    unknown,
  }
}

export async function parseAia(input: Uint8Array | ArrayBuffer | Blob): Promise<AiaProject> {
  const blob = toBlob(input)
  let entries: Entry[]
  try {
    const zr = new ZipReader(new BlobReader(blob))
    entries = await zr.getEntries()
    await zr.close()
  } catch (e) {
    throw new AiaZipError(`Cannot read AIA archive: ${e}`, e)
  }

  const propsEntry = entries.find(e => e.filename === 'youngandroidproject/project.properties')
  if (!propsEntry) {
    throw new AiaStructureError('Missing youngandroidproject/project.properties', null)
  }

  const propsText = await readText(propsEntry)
  const properties = parseProjectProperties(getProperties(propsText) as Record<string, string>)
  const name = extractClassName(properties.main)

  const screenMap = new Map<string, { scm?: string; bky?: string; yail?: string }>()
  const assetEntries: Entry[] = []
  const extEntries = new Map<string, Entry[]>()

  for (const entry of entries) {
    const parts = entry.filename.split('/')
    if (parts[0] === 'youngandroidproject') continue

    if (parts[0] === 'assets' && parts.length === 2 && parts[1]) {
      assetEntries.push(entry)
      continue
    }

    if (parts[0] === 'assets' && parts[1] === 'external_comps' && parts[2]) {
      const pkg = parts[2]
      if (!extEntries.has(pkg)) extEntries.set(pkg, [])
      extEntries.get(pkg)!.push(entry)
      continue
    }

    if (parts[0] === 'src') {
      const filename = parts[parts.length - 1]
      const dotIdx = filename.lastIndexOf('.')
      if (dotIdx === -1) continue
      const screenName = filename.slice(0, dotIdx)
      const ext = filename.slice(dotIdx + 1)
      if (!screenMap.has(screenName)) screenMap.set(screenName, {})
      const screen = screenMap.get(screenName)!
      if (ext === 'scm') screen.scm = await readText(entry)
      else if (ext === 'bky') screen.bky = await readText(entry)
      else if (ext === 'yail') screen.yail = await readText(entry)
    }
  }

  const screens: AiaScreen[] = []
  for (const [screenName, files] of screenMap) {
    if (files.scm === undefined || files.bky === undefined) continue
    screens.push({ name: screenName, scm: files.scm, bky: files.bky, yail: files.yail ?? null })
  }

  if (screens.length === 0) {
    throw new AiaStructureError('AIA contains no valid screens (missing .scm/.bky pairs)', null)
  }

  const assets: AiaAsset[] = await Promise.all(
    assetEntries.map(async entry => {
      const blobData = await readBlob(entry)
      const assetName = entry.filename.split('/').pop() ?? entry.filename
      const type = assetName.includes('.') ? assetName.split('.').pop() ?? '' : ''
      return {
        name: assetName,
        type,
        sizeBytes: blobData.size,
        data: async () => new Uint8Array(await blobData.arrayBuffer()),
      }
    })
  )

  const extensions: AiaExtension[] = await buildExtensions(extEntries, entries)

  return { _tag: 'AiaProject', name, properties, screens, assets, extensions }
}

async function buildExtensions(
  extEntries: Map<string, Entry[]>,
  allEntries: Entry[]
): Promise<AiaExtension[]> {
  const extensions: AiaExtension[] = []
  for (const [pkg, pkgEntries] of extEntries) {
    const componentEntry = pkgEntries.find(e => {
      const f = e.filename.split('/').pop()
      return f === 'component.json' || f === 'components.json'
    })
    if (!componentEntry) continue
    let components: ComponentDescriptor[]
    try {
      const text = await readText(componentEntry)
      const parsed = JSON.parse(text)
      components = Array.isArray(parsed) ? parsed : [parsed]
    } catch {
      continue
    }
    const first = components[0]
    const manifest: AixManifest = {
      packageName: pkg,
      version: first?.version ?? 1,
      minSdk: 7,
      buildVersion: '1',
      permissions: [],
    }
    const jarEntry = allEntries.find(e => e.filename.includes(pkg) && e.filename.endsWith('classes.jar'))
    extensions.push({
      packageName: pkg,
      version: first?.version ?? 1,
      minSdk: 7,
      components,
      manifest,
      loadClasses: async () => jarEntry ? new Uint8Array(await (await readBlob(jarEntry)).arrayBuffer()) : new Uint8Array(),
      loadAssets: async () => [],
    })
  }
  return extensions
}

export async function parseAix(input: Uint8Array | ArrayBuffer | Blob): Promise<AiaExtension> {
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

  const text = await readText(componentEntry)
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
    loadClasses: async () => jarEntry ? new Uint8Array(await (await readBlob(jarEntry)).arrayBuffer()) : new Uint8Array(),
    loadAssets: async (): Promise<AixAsset[]> =>
      Promise.all(assetFileEntries.map(async entry => ({
        name: entry.filename.split('/').pop() ?? entry.filename,
        data: async () => new Uint8Array(await (await readBlob(entry)).arrayBuffer()),
      }))),
  }
}

export async function parseAndResolve(
  input: Uint8Array | ArrayBuffer | Blob,
  env: Environment
): Promise<ModelProject> {
  const { resolve } = await import('#/resolve.js')
  const project = await parseAia(input)
  return resolve(project, env)
}

function toBlob(input: Uint8Array | ArrayBuffer | Blob): Blob {
  if (input instanceof Blob) return input
  if (input instanceof ArrayBuffer) return new Blob([input])
  return new Blob([input.buffer as ArrayBuffer])
}

async function readText(entry: Entry): Promise<string> {
  return (entry as FileEntry).getData(new TextWriter())
}

async function readBlob(entry: Entry): Promise<Blob> {
  return (entry as FileEntry).getData(new BlobWriter())
}
