import { describe, it, expect } from 'vitest'
import { Environment } from '../../../src/core/environment.js'
import type { AiaExtension } from '../../../src/core/types.js'
import type { ComponentDescriptor } from '../../../src/core/descriptors.js'

describe('Environment', () => {
  describe('kodularCreator', () => {
    it('loads without throwing', async () => {
      const env = await Environment.kodularCreator()
      expect(env).toBeDefined()
    })

    it('looks up a known built-in component type', async () => {
      const env = await Environment.kodularCreator()
      const desc = env.lookup('com.google.appinventor.components.runtime.Button')
      expect(desc).not.toBeNull()
      expect(desc?.name).toBe('Button')
    })

    it('returns null for unknown type', async () => {
      const env = await Environment.kodularCreator()
      expect(env.lookup('com.example.nonexistent.Widget')).toBeNull()
    })
  })

  describe('mitAppInventor', () => {
    it('loads without throwing', async () => {
      const env = await Environment.mitAppInventor()
      expect(env).toBeDefined()
    })

    it('looks up a known built-in component type', async () => {
      const env = await Environment.mitAppInventor()
      const desc = env.lookup('com.google.appinventor.components.runtime.Button')
      expect(desc).not.toBeNull()
    })
  })

  describe('withExtension', () => {
    it('returns a new Environment with the extension components accessible', async () => {
      const env = await Environment.kodularCreator()
      const fakeDesc: ComponentDescriptor = {
        type: 'com.example.MyExt',
        name: 'MyExt',
        external: true,
        version: 1,
        categoryString: 'EXTENSION',
        helpString: '',
        showOnPalette: true,
        nonVisible: false,
        iconName: '',
        properties: [],
        blockProperties: [],
        events: [],
        methods: [],
      }
      const ext: AiaExtension = {
        packageName: 'com.example',
        version: 1,
        minSdk: 7,
        components: [fakeDesc],
        manifest: { packageName: 'com.example', version: 1, minSdk: 7, buildVersion: '1', permissions: [] },
        loadClasses: async () => new Uint8Array(),
        loadAssets: async () => [],
      }
      const extEnv = env.withExtension(ext)
      expect(extEnv.lookup('com.example.MyExt')).toBe(fakeDesc)
      expect(env.lookup('com.example.MyExt')).toBeNull()
    })

    it('withExtensions is equivalent to chaining withExtension', async () => {
      const env = await Environment.kodularCreator()
      const makeExt = (type: string): AiaExtension => ({
        packageName: type,
        version: 1,
        minSdk: 7,
        components: [{ type, name: type, external: true, version: 1, categoryString: 'EXTENSION', helpString: '', showOnPalette: true, nonVisible: false, iconName: '', properties: [], blockProperties: [], events: [], methods: [] }],
        manifest: { packageName: type, version: 1, minSdk: 7, buildVersion: '1', permissions: [] },
        loadClasses: async () => new Uint8Array(),
        loadAssets: async () => [],
      })
      const ext1 = makeExt('com.a.A')
      const ext2 = makeExt('com.b.B')
      const envA = env.withExtensions([ext1, ext2])
      expect(envA.lookup('com.a.A')).toBeDefined()
      expect(envA.lookup('com.b.B')).toBeDefined()
    })
  })
})
