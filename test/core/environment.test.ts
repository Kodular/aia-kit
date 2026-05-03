import { describe, expect, it } from 'vitest'
import {
  Platform,
  createEnvironment,
  getEnvironmentFor,
} from '#/core/environment.js'
import { EnvironmentConstructionError } from '#/core/errors.js'
import {
  BuiltinBlockRegistry,
  ComponentRegistry,
  MutableComponentRegistry,
} from '#/core/registries.js'
import type { ComponentDescriptor } from '#/core/descriptors.js'

function makeDescriptor(type: string, name: string): ComponentDescriptor {
  return {
    type,
    name,
    external: false,
    version: 1,
    categoryString: 'BASIC',
    helpString: '',
    showOnPalette: true,
    nonVisible: false,
    iconName: '',
    properties: [],
    blockProperties: [],
    events: [],
    methods: [],
  }
}

describe('createEnvironment', () => {
  it('creates an environment from metadata, components, and builtin blocks', () => {
    const button = makeDescriptor(
      'com.google.appinventor.components.runtime.Button',
      'Button',
    )
    const env = createEnvironment({
      meta: { id: 'test-env', name: 'Test Environment' },
      components: [button],
      builtinBlocks: [{ type: 'logic_boolean', category: 'logic' }],
    })

    expect(env.meta).toEqual({ id: 'test-env', name: 'Test Environment' })
    expect(env.componentRegistry).toBeInstanceOf(ComponentRegistry)
    expect(env.builtinBlockRegistry).toBeInstanceOf(BuiltinBlockRegistry)
    expect(env.componentRegistry.lookup('Button')).toBe(button)
    expect(env.builtinBlockRegistry.lookup('logic_boolean')?.category).toBe('logic')
  })

  it('accepts ComponentRegistry and BuiltinBlockRegistry instances', () => {
    const componentRegistry = ComponentRegistry.of([
      makeDescriptor('com.example.Widget', 'Widget'),
    ])
    const builtinBlockRegistry = BuiltinBlockRegistry.of([
      { type: 'text', category: 'text' },
    ])
    const env = createEnvironment({
      meta: { id: 'registry-env', name: 'Registry Environment' },
      components: componentRegistry,
      builtinBlocks: builtinBlockRegistry,
    })

    expect(env.componentRegistry).toBe(componentRegistry)
    expect(env.builtinBlockRegistry).toBe(builtinBlockRegistry)
  })

  it('snapshots mutable component registries into immutable component registries', () => {
    const widget = makeDescriptor('com.example.Widget', 'Widget')
    const laterWidget = makeDescriptor('com.example.LaterWidget', 'LaterWidget')
    const mutableRegistry = new MutableComponentRegistry([widget])
    const env = createEnvironment({
      meta: { id: 'mutable-env', name: 'Mutable Environment' },
      components: mutableRegistry,
      builtinBlocks: [],
    })

    mutableRegistry.add(laterWidget)

    expect(env.componentRegistry).toBeInstanceOf(ComponentRegistry)
    expect(env.componentRegistry).not.toBeInstanceOf(MutableComponentRegistry)
    expect(env.componentRegistry).not.toBe(mutableRegistry)
    expect(env.componentRegistry.lookup('Widget')).toBe(widget)
    expect(env.componentRegistry.lookup('LaterWidget')).toBeNull()
  })

  it.each([
    ['missing id', { name: 'Missing Id' }],
    ['missing name', { id: 'missing-name' }],
    ['non-string id', { id: 123, name: 'Non-string Id' }],
    ['non-string name', { id: 'non-string-name', name: 123 }],
    ['blank id', { id: '   ', name: 'Blank Id' }],
    ['blank name', { id: 'blank-name', name: '   ' }],
  ])('throws EnvironmentConstructionError for %s metadata', (_case, meta) => {
    expect(() =>
      createEnvironment({
        meta: meta as never,
        components: [],
        builtinBlocks: [],
      }),
    ).toThrow(EnvironmentConstructionError)
  })
})

describe('getEnvironmentFor', () => {
  it('loads and memoizes the MIT App Inventor environment', async () => {
    const env = await getEnvironmentFor(Platform.MitAppInventor)
    const again = await getEnvironmentFor(Platform.MitAppInventor)

    expect(again).toBe(env)
    expect(env.meta.id).toBe(Platform.MitAppInventor)
    expect(env.componentRegistry).toBeInstanceOf(ComponentRegistry)
    expect(env.componentRegistry.lookup('Button')?.type).toBe(
      'com.google.appinventor.components.runtime.Button',
    )
    expect(env.builtinBlockRegistry.lookup('logic_boolean')?.category).toBe('logic')
  })

  it('coalesces in-flight loads but drops rejected loads from the cache', async () => {
    const missingPlatform = 'missing-platform' as Platform
    const first = getEnvironmentFor(missingPlatform)
    const coalesced = getEnvironmentFor(missingPlatform)

    expect(coalesced).toBe(first)
    await expect(first).rejects.toThrow()

    const retry = getEnvironmentFor(missingPlatform)

    expect(retry).not.toBe(first)
    await expect(retry).rejects.toThrow()
  })
})
