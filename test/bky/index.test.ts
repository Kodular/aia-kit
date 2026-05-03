import { describe, expect, it } from 'vitest'
import {
  parseBky,
  removeDisabledBlocks,
  renameComponentReferences,
  serializeBky,
} from '#/bky/index.js'

describe('bky public API', () => {
  it('parses BKY blocks through the public entrypoint', () => {
    const ast = parseBky('<xml><block type="event_handler" id="e1" /></xml>')

    expect(ast.blocks[0].type).toBe('event_handler')
  })

  it('serializes BKY blocks through the public entrypoint', () => {
    const ast = parseBky('<xml><block type="event_handler" id="e1" /></xml>')
    const roundTripped = parseBky(serializeBky(ast))

    expect(roundTripped.blocks[0].type).toBe('event_handler')
  })

  it('renames component references in fields, mutation, and serialized output', () => {
    const ast = parseBky(`<xml>
      <block type="component_event" id="e1">
        <mutation instance_name="Button1" event_name="Click" component_type="Button"></mutation>
        <field name="COMPONENT_SELECTOR">Button1</field>
        <statement name="DO">
          <block type="component_method" id="m1">
            <mutation instance_name="Button1" method_name="Text"></mutation>
            <field name="COMPONENT_SELECTOR">Button1</field>
          </block>
        </statement>
      </block>
    </xml>`)

    const renamed = renameComponentReferences(ast, 'Button1', 'PrimaryButton')
    const serialized = serializeBky(renamed)

    expect(renamed.blocks[0].mutation['instance_name']).toBe('PrimaryButton')
    expect(renamed.blocks[0].fields['COMPONENT_SELECTOR']).toBe('PrimaryButton')
    expect(renamed.blocks[0].statements['DO'].mutation['instance_name']).toBe('PrimaryButton')
    expect(serialized).toContain('PrimaryButton')
    expect(serialized).not.toContain('Button1')
  })

  it('removes disabled blocks without mutating the source ast', () => {
    const ast = parseBky(`<xml>
      <block type="enabled" id="e1">
        <value name="VALUE">
          <block type="disabled_value" id="d1" disabled="true"></block>
        </value>
        <next>
          <block type="disabled_next" id="d2" disabled="true"></block>
        </next>
      </block>
      <block type="disabled_top" id="d3" disabled="true"></block>
    </xml>`)

    const filtered = removeDisabledBlocks(ast)

    expect(filtered.blocks).toHaveLength(1)
    expect(filtered.blocks[0].type).toBe('enabled')
    expect(filtered.blocks[0].values).toEqual({})
    expect(filtered.blocks[0].next).toBeNull()
    expect(ast.blocks).toHaveLength(2)
    expect(ast.blocks[0].values['VALUE'].type).toBe('disabled_value')
  })
})
