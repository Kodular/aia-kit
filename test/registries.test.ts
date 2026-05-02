import { describe, it, expect } from 'vitest'
import {
  createComponentRegistry,
  createBlockRegistry,
  defaultBlockRegistry,
  DEFAULT_BUILTINS,
} from '#/core/registries.js'
import type { ComponentDescriptor } from '#/core/descriptors.js'

// ── Minimal fixture descriptor ─────────────────────────────────────────────

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

// ── ComponentRegistry ──────────────────────────────────────────────────────

describe('createComponentRegistry', () => {
  const button = makeDescriptor(
    'com.google.appinventor.components.runtime.Button',
    'Button',
  )
  const label = makeDescriptor(
    'com.google.appinventor.components.runtime.Label',
    'Label',
  )

  it('lookup hit returns the matching descriptor', () => {
    const registry = createComponentRegistry([button, label])
    const result = registry.lookup('com.google.appinventor.components.runtime.Button')
    expect(result).toBe(button)
  })

  it('lookup miss returns null', () => {
    const registry = createComponentRegistry([button])
    expect(registry.lookup('com.google.appinventor.components.runtime.TextBox')).toBeNull()
  })

  it('descriptors property reflects input array', () => {
    const registry = createComponentRegistry([button, label])
    expect(registry.descriptors).toHaveLength(2)
    expect(registry.descriptors[0]).toBe(button)
    expect(registry.descriptors[1]).toBe(label)
  })

  it('extend returns a new registry with additional descriptors', () => {
    const base = createComponentRegistry([button])
    const extended = base.extend([label])

    // original is unchanged
    expect(base.descriptors).toHaveLength(1)
    expect(base.lookup('com.google.appinventor.components.runtime.Label')).toBeNull()

    // extended has both
    expect(extended.descriptors).toHaveLength(2)
    expect(extended.lookup('com.google.appinventor.components.runtime.Button')).toBe(button)
    expect(extended.lookup('com.google.appinventor.components.runtime.Label')).toBe(label)
  })

  it('extend with empty array returns registry equal to original', () => {
    const base = createComponentRegistry([button])
    const extended = base.extend([])
    expect(extended.descriptors).toHaveLength(1)
    expect(extended.lookup('com.google.appinventor.components.runtime.Button')).toStrictEqual(button)
  })
})

// ── BlockRegistry ──────────────────────────────────────────────────────────

describe('createBlockRegistry', () => {
  it('lookup hit returns the matching descriptor', () => {
    const registry = createBlockRegistry([
      { type: 'math_number', category: 'math' },
      { type: 'logic_boolean', category: 'logic' },
    ])
    const result = registry.lookup('math_number')
    expect(result).not.toBeNull()
    expect(result?.type).toBe('math_number')
    expect(result?.category).toBe('math')
  })

  it('lookup miss returns null', () => {
    const registry = createBlockRegistry([{ type: 'math_number', category: 'math' }])
    expect(registry.lookup('text_join')).toBeNull()
  })

  it('builtins map contains all provided entries', () => {
    const entries = [
      { type: 'math_number', category: 'math' as const },
      { type: 'text_join', category: 'text' as const },
    ]
    const registry = createBlockRegistry(entries)
    expect(registry.builtins.size).toBe(2)
  })
})

// ── defaultBlockRegistry ───────────────────────────────────────────────────

describe('defaultBlockRegistry', () => {
  const registry = defaultBlockRegistry()

  it('has the expected total number of built-in block types', () => {
    expect(registry.builtins.size).toBe(110)
  })

  it('contains logic blocks', () => {
    expect(registry.lookup('logic_boolean')?.category).toBe('logic')
    expect(registry.lookup('logic_compare')?.category).toBe('logic')
    expect(registry.lookup('logic_not')?.category).toBe('logic')
  })

  it('contains math blocks', () => {
    expect(registry.lookup('math_number')?.category).toBe('math')
    expect(registry.lookup('math_arithmetic')?.category).toBe('math')
    expect(registry.lookup('math_number_radix')?.category).toBe('math')
  })

  it('contains text blocks', () => {
    expect(registry.lookup('text')?.category).toBe('text')
    expect(registry.lookup('text_join')?.category).toBe('text')
    expect(registry.lookup('text_newline')?.category).toBe('text')
  })

  it('contains lists blocks', () => {
    expect(registry.lookup('lists_create_with')?.category).toBe('lists')
    expect(registry.lookup('lists_lookup_in_pairs')?.category).toBe('lists')
    expect(registry.lookup('lists_reverse')?.category).toBe('lists')
  })

  it('contains color blocks', () => {
    expect(registry.lookup('color_black')?.category).toBe('colors')
    expect(registry.lookup('color_make_color')?.category).toBe('colors')
    expect(registry.lookup('color_split_color')?.category).toBe('colors')
  })

  it('contains variable blocks', () => {
    expect(registry.lookup('global_declaration')?.category).toBe('variables')
    expect(registry.lookup('lexical_variable_get')?.category).toBe('variables')
    expect(registry.lookup('local_declaration_expression')?.category).toBe('variables')
  })

  it('contains procedure blocks', () => {
    expect(registry.lookup('procedures_defnoreturn')?.category).toBe('procedures')
    expect(registry.lookup('procedures_callreturn')?.category).toBe('procedures')
  })

  it('contains controls blocks', () => {
    expect(registry.lookup('controls_if')?.category).toBe('controls')
    expect(registry.lookup('controls_forRange')?.category).toBe('controls')
    expect(registry.lookup('controls_close_screen_with_plain_text')?.category).toBe('controls')
  })

  it('contains dicts blocks', () => {
    expect(registry.lookup('dicts_create_with')?.category).toBe('dicts')
    expect(registry.lookup('dictionaries_lookup')?.category).toBe('dicts')
    expect(registry.lookup('dictionaries_keys_not_found')?.category).toBe('dicts')
  })

  it('returns null for unknown block type', () => {
    expect(registry.lookup('nonexistent_block_type')).toBeNull()
  })
})
