import { describe, expect, it } from 'vitest'
import { BlobWriter, TextReader, Uint8ArrayReader, ZipWriter } from '@zip.js/zip.js'
import { readAix } from '#/aix.js'

describe('AIX domain API', () => {
  it('readAix parses component metadata and packaged assets', async () => {
    const bytes = await makeAix()
    const extension = await readAix(bytes)

    expect(extension.packageName).toBe('com.example')
    expect(extension.version).toBe(2)
    expect(extension.components).toHaveLength(1)
    expect(extension.components[0].name).toBe('ExtensionComponent')
    expect(await extension.loadClasses()).toBeInstanceOf(Uint8Array)

    const assets = await extension.loadAssets()
    expect(assets).toHaveLength(1)
    expect(assets[0].name).toBe('icon.png')
    await expect(assets[0].data()).resolves.toBeInstanceOf(Uint8Array)
  })
})

async function makeAix(): Promise<Uint8Array> {
  const writer = new ZipWriter(new BlobWriter('application/zip'))
  await writer.add(
    'component.json',
    new TextReader(JSON.stringify({
      type: 'com.example.ExtensionComponent',
      name: 'ExtensionComponent',
      external: true,
      version: 2,
      categoryString: 'EXTENSION',
      helpString: '',
      showOnPalette: true,
      nonVisible: true,
      iconName: '',
      properties: [],
      blockProperties: [],
      events: [],
      methods: [],
    })),
  )
  await writer.add('classes.jar', new Uint8ArrayReader(new Uint8Array([1, 2, 3])))
  await writer.add('assets/icon.png', new Uint8ArrayReader(new Uint8Array([4, 5, 6])))
  const blob = await writer.close()
  return new Uint8Array(await blob.arrayBuffer())
}
