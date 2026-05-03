import { BlobReader, ZipReader, type Entry } from '@zip.js/zip.js'
import { getProperties } from 'properties-file'
import type { AiaProject, AiaScreen, AiaAsset, AiaExtension, AixManifest } from '#/types.js'
import type { ComponentDescriptor } from '#/component-descriptor/descriptors.js'
import { AiaZipError, AiaStructureError } from '#/errors.js'
import { extractClassName } from '#/utils/package-names.js'
import { parseProjectProperties } from '#/project-properties/index.js'
import { readZipEntryBlob, readZipEntryText, toBlob } from '#/utils/zip-io.js'

export async function readAia(input: Uint8Array | ArrayBuffer | Blob): Promise<AiaProject> {
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

  const propsText = await readZipEntryText(propsEntry)
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
      if (ext === 'scm') screen.scm = await readZipEntryText(entry)
      else if (ext === 'bky') screen.bky = await readZipEntryText(entry)
      else if (ext === 'yail') screen.yail = await readZipEntryText(entry)
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
      const blobData = await readZipEntryBlob(entry)
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
      const text = await readZipEntryText(componentEntry)
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
      loadClasses: async () => jarEntry ? new Uint8Array(await (await readZipEntryBlob(jarEntry)).arrayBuffer()) : new Uint8Array(),
      loadAssets: async () => [],
    })
  }
  return extensions
}
