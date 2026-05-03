import { describe, it, expect } from 'vitest'
import { parseBky } from '#/bky/parse.js'
import { serializeBky } from '#/bky/serialize.js'

const SIMPLE_BKY = `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="text_print" id="b1" x="10" y="20">
    <value name="TEXT">
      <block type="text" id="b2">
        <field name="TEXT">Hello</field>
      </block>
    </value>
  </block>
</xml>`

const EMPTY_BKY = `<xml xmlns="https://developers.google.com/blockly/xml"></xml>`

describe('parseBky', () => {
  it('parses top-level blocks', () => {
    const ast = parseBky(SIMPLE_BKY)
    expect(ast.blocks).toHaveLength(1)
    expect(ast.blocks[0].type).toBe('text_print')
    expect(ast.blocks[0].id).toBe('b1')
    expect(ast.blocks[0].x).toBe(10)
    expect(ast.blocks[0].y).toBe(20)
  })

  it('parses nested value blocks', () => {
    const ast = parseBky(SIMPLE_BKY)
    const inner = ast.blocks[0].values['TEXT']
    expect(inner).toBeDefined()
    expect(inner.type).toBe('text')
    expect(inner.fields['TEXT']).toBe('Hello')
  })

  it('parses empty xml', () => {
    const ast = parseBky(EMPTY_BKY)
    expect(ast.blocks).toHaveLength(0)
  })

  it('throws on invalid XML', () => {
    expect(() => parseBky('not xml')).toThrow()
  })
})

describe('serializeBky', () => {
  it('round-trips through parseBky → serializeBky → parseBky', () => {
    const ast1 = parseBky(SIMPLE_BKY)
    const xml = serializeBky(ast1)
    const ast2 = parseBky(xml)
    expect(ast2.blocks).toHaveLength(ast1.blocks.length)
    expect(ast2.blocks[0].type).toBe(ast1.blocks[0].type)
    expect(ast2.blocks[0].fields).toEqual(ast1.blocks[0].fields)
    expect(ast2.blocks[0].values['TEXT'].fields['TEXT']).toBe('Hello')
  })

  it('serializes empty ast as xml element', () => {
    const ast = parseBky(EMPTY_BKY)
    const xml = serializeBky(ast)
    expect(xml).toMatch(/<xml/)
    expect(xml).toMatch(/<\/xml>/)
  })
})
