import { describe, expect, it } from 'vitest'
import { parseBky } from '#/bky/parse.js'
import { analyzeVariables, exportBlockSummary } from '#/analysis/block-reports.js'

const SIMPLE_BKY = `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="text_print" id="b1" x="10" y="20">
    <value name="TEXT">
      <block type="text" id="b2">
        <field name="TEXT">Hello</field>
      </block>
    </value>
  </block>
</xml>`

const GLOBAL_AND_LEXICAL_BKY = `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="global_declaration" id="x"><field name="NAME">Foo</field></block>
  <block type="lexical_variable_get" id="v1"><field name="VAR">myVar</field></block>
</xml>`

describe('exportBlockSummary', () => {
  it('summarizes SIMPLE_BKY block counts and types', () => {
    const ast = parseBky(SIMPLE_BKY)
    const s = exportBlockSummary(ast)
    expect(s.topLevelCount).toBe(1)
    expect(s.totalBlocks).toBeGreaterThanOrEqual(2)
    expect(s.blocksByType.text_print).toBeGreaterThanOrEqual(1)
    expect(s.blocksByType.text).toBeGreaterThanOrEqual(1)
  })
})

describe('analyzeVariables', () => {
  it('returns empty declared and referenced for SIMPLE_BKY', () => {
    const ast = parseBky(SIMPLE_BKY)
    expect(analyzeVariables(ast)).toEqual({ declared: [], referenced: [] })
  })

  it('collects NAME from global_declaration and VAR from lexical_variable_get', () => {
    const ast = parseBky(GLOBAL_AND_LEXICAL_BKY)
    expect(analyzeVariables(ast)).toEqual({
      declared: ['Foo'],
      referenced: ['myVar'],
    })
  })
})
