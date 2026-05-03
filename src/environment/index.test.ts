import { describe, expect, it } from 'vitest'
import {
  Platform,
  createEnvironment,
  getEnvironmentFor,
} from '#/environment/index.js'
import type { Environment } from '#/environment/index.js'
import { EnvironmentConstructionError } from '#/errors.js'
import { BuiltinBlockRegistry } from '#/environment/builtin-blocks.js'
import { ComponentRegistry, MutableComponentRegistry } from '#/component-descriptor/index.js'
import type { ComponentDescriptor } from '#/component-descriptor/descriptors.js'

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

describe('public environment API', () => {
  it('exports platform constants and environment helpers', async () => {
    const loaded = await getEnvironmentFor(Platform.MitAppInventor)
    const env: Environment = createEnvironment({
      meta: { id: 'public-api', name: 'Public API' },
      components: loaded.componentRegistry,
      builtinBlocks: loaded.builtinBlockRegistry,
    })

    expect(Platform.MitAppInventor).toBe('mit-app-inventor')
    expect(env.componentRegistry).toBeInstanceOf(ComponentRegistry)
    expect(env.componentRegistry.lookup('Button')?.name).toBe('Button')
    expect(env.builtinBlockRegistry.lookup('logic_boolean')?.category).toBe('logic')
  })
})

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
  it('loads the MIT App Inventor environment', async () => {
    const env = await getEnvironmentFor(Platform.MitAppInventor)
    expect(env.meta.id).toBe(Platform.MitAppInventor)
    expect(env.componentRegistry).toBeInstanceOf(ComponentRegistry)
    expect(env.componentRegistry.lookup('Button')?.type).toBe(
      'com.google.appinventor.components.runtime.Button',
    )
    expect(env.builtinBlockRegistry.lookup('logic_boolean')?.category).toBe('logic')
  })
})
