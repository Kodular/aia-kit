import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  ComponentRegistry,
  MutableComponentRegistry,
} from '#/component-descriptor/index.js'
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

describe('public component descriptor API', () => {
  it('exports component registry classes and descriptor types', () => {
    const button = makeDescriptor(
      'com.google.appinventor.components.runtime.Button',
      'Button',
    )
    const registry = ComponentRegistry.of([button])
    const mutable = registry.toMutable()

    expect(registry).toBeInstanceOf(ComponentRegistry)
    expect(mutable).toBeInstanceOf(MutableComponentRegistry)
    expect(registry.lookup('Button')).toBe(button)
  })

  it('is published as a package subpath export', () => {
    const packageJson = JSON.parse(
      readFileSync(join(import.meta.dirname, '../../package.json'), 'utf-8'),
    ) as { exports: Record<string, string> }

    expect(packageJson.exports['./component-descriptor']).toBe(
      './dist/component-descriptor/index.mjs',
    )
  })
})
