import { describe, expect, it } from 'vitest'
import {
  ComponentRegistry,
  MutableComponentRegistry,
} from '#/component-descriptor.js'
import type { ComponentDescriptor } from '#/component-descriptor.js'
import {
  BuiltinBlockRegistry,
  defaultBlockRegistry,
} from '#/core/registries.js'

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

describe('ComponentRegistry', () => {
  const button = makeDescriptor(
    'com.google.appinventor.components.runtime.Button',
    'Button',
  )
  const label = makeDescriptor(
    'com.google.appinventor.components.runtime.Label',
    'Label',
  )

  it('looks up components by full type and short name', () => {
    const registry = ComponentRegistry.of([button, label])

    expect(registry.lookup('com.google.appinventor.components.runtime.Button')).toBe(button)
    expect(registry.lookup('Button')).toBe(button)
    expect(registry.lookup('Label')).toBe(label)
    expect(registry.lookup('TextBox')).toBeNull()
  })

  it('reports component presence by full type and short name', () => {
    const registry = ComponentRegistry.of([button])

    expect(registry.has('com.google.appinventor.components.runtime.Button')).toBe(true)
    expect(registry.has('Button')).toBe(true)
    expect(registry.has('Label')).toBe(false)
  })

  it('exposes an immutable public descriptor snapshot', () => {
    const source = [button]
    const registry = ComponentRegistry.of(source)

    source.push(label)
    expect(registry.descriptors).toEqual([button])
    expect(() => {
      (registry.descriptors as ComponentDescriptor[]).push(label)
    }).toThrow(TypeError)
    expect(registry.lookup('Label')).toBeNull()
  })

  it('creates mutable working copies without changing the source registry', () => {
    const registry = ComponentRegistry.of([button])
    const mutable = registry.toMutable()

    expect(mutable).toBeInstanceOf(MutableComponentRegistry)
    expect(mutable).toBeInstanceOf(ComponentRegistry)
    mutable.add(label)
    mutable.remove('Button')

    expect(registry.has('Button')).toBe(true)
    expect(registry.has('Label')).toBe(false)
    expect(mutable.has('Button')).toBe(false)
    expect(mutable.lookup('Label')).toBe(label)
  })
})

describe('MutableComponentRegistry', () => {
  it('returns immutable ComponentRegistry snapshots', () => {
    const button = makeDescriptor(
      'com.google.appinventor.components.runtime.Button',
      'Button',
    )
    const label = makeDescriptor(
      'com.google.appinventor.components.runtime.Label',
      'Label',
    )
    const mutable = new MutableComponentRegistry([button])

    const before = mutable.snapshot()
    mutable.add(label)
    const after = mutable.snapshot()

    expect(before).toBeInstanceOf(ComponentRegistry)
    expect(before.has('Label')).toBe(false)
    expect(after.has('Label')).toBe(true)
    expect(() => {
      (after.descriptors as ComponentDescriptor[]).pop()
    }).toThrow(TypeError)
    expect(after.has('Button')).toBe(true)
  })

  it('exposes immutable descriptor snapshots without leaking the working array', () => {
    const button = makeDescriptor(
      'com.google.appinventor.components.runtime.Button',
      'Button',
    )
    const label = makeDescriptor(
      'com.google.appinventor.components.runtime.Label',
      'Label',
    )
    const mutable = new MutableComponentRegistry([button])
    const descriptors = mutable.descriptors

    expect(() => {
      (descriptors as ComponentDescriptor[]).push(label)
    }).toThrow(TypeError)
    expect(mutable.has('Label')).toBe(false)
  })

  it('adds and removes individual descriptors or batches', () => {
    const button = makeDescriptor(
      'com.google.appinventor.components.runtime.Button',
      'Button',
    )
    const label = makeDescriptor(
      'com.google.appinventor.components.runtime.Label',
      'Label',
    )
    const textBox = makeDescriptor(
      'com.google.appinventor.components.runtime.TextBox',
      'TextBox',
    )
    const mutable = new MutableComponentRegistry()

    mutable.add([button, label])
    expect(mutable.has('Button')).toBe(true)
    expect(mutable.has('Label')).toBe(true)

    mutable.add(textBox)
    mutable.remove(['Button', 'com.google.appinventor.components.runtime.Label'])

    expect(mutable.has('Button')).toBe(false)
    expect(mutable.has('Label')).toBe(false)
    expect(mutable.lookup('TextBox')).toBe(textBox)
  })
})

describe('BuiltinBlockRegistry', () => {
  it('looks up builtin blocks from custom and default registries', () => {
    const custom = BuiltinBlockRegistry.of([
      { type: 'logic_boolean', category: 'logic' },
      { type: 'math_number', category: 'math' },
    ])

    expect(custom.lookup('logic_boolean')?.category).toBe('logic')
    expect(custom.lookup('text')).toBeNull()
    expect(defaultBlockRegistry()).toBeInstanceOf(BuiltinBlockRegistry)
    expect(defaultBlockRegistry().lookup('logic_boolean')?.category).toBe('logic')
  })
})
