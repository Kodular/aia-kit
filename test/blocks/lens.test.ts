import { describe, it, expect } from 'vitest'
import {
  parseBlocks,
  serializeBlocks,
  queryBlocks,
  updateBlocks,
  updateAllScreenBlocks,
} from '#/blocks/lens.js'
import type { AiaProject, AiaScreen } from '#/core/types.js'
import { makeProjectProperties } from '../helpers.js'

const SCREEN_BKY = `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="event_handler" id="e1" x="0" y="0">
    <field name="COMPONENT_SELECTOR">Button1</field>
    <field name="EVENT_NAME">Click</field>
  </block>
</xml>`

function makeProject(bky: string): AiaProject {
  const screen: AiaScreen = { name: 'Screen1', scm: '', bky, yail: null }
  return { _tag: 'AiaProject', name: 'Test', properties: makeProjectProperties(), screens: [screen], assets: [], extensions: [] }
}

describe('parseBlocks / serializeBlocks', () => {
  it('parseBlocks returns a BlockAst', () => {
    const ast = parseBlocks(SCREEN_BKY)
    expect(ast.blocks).toHaveLength(1)
    expect(ast.blocks[0].type).toBe('event_handler')
  })

  it('serializeBlocks round-trips', () => {
    const ast = parseBlocks(SCREEN_BKY)
    const xml = serializeBlocks(ast)
    const ast2 = parseBlocks(xml)
    expect(ast2.blocks[0].type).toBe('event_handler')
  })
})

describe('queryBlocks', () => {
  it('queries block count from an AiaScreen', () => {
    const screen: AiaScreen = { name: 'Screen1', scm: '', bky: SCREEN_BKY, yail: null }
    const count = queryBlocks(screen, ast => ast.blocks.length)
    expect(count).toBe(1)
  })
})

describe('updateBlocks', () => {
  it('applies updater fn to named screen', () => {
    const project = makeProject(SCREEN_BKY)
    const result = updateBlocks(project, 'Screen1', ast => ({
      blocks: ast.blocks.map(b => ({ ...b, type: 'modified_block' }))
    }))
    expect(result.diagnostics).toEqual([])
    const updatedAst = parseBlocks(result.project.screens[0].bky)
    expect(updatedAst.blocks[0].type).toBe('modified_block')
  })

  it('accepts a pre-built BlockAst directly', () => {
    const project = makeProject(SCREEN_BKY)
    const newAst = parseBlocks(SCREEN_BKY)
    newAst.blocks[0] = { ...newAst.blocks[0], type: 'direct_ast' }
    const result = updateBlocks(project, 'Screen1', newAst)
    const updatedAst = parseBlocks(result.project.screens[0].bky)
    expect(updatedAst.blocks[0].type).toBe('direct_ast')
  })

  it('emits MISSING_SCREEN_FILE diagnostic for unknown screen', () => {
    const project = makeProject(SCREEN_BKY)
    const result = updateBlocks(project, 'NoSuchScreen', ast => ast)
    expect(result.diagnostics[0].code).toBe('MISSING_SCREEN_FILE')
  })
})

describe('updateAllScreenBlocks', () => {
  it('applies updater to all screens', () => {
    const screen2: AiaScreen = { name: 'Screen2', scm: '', bky: SCREEN_BKY, yail: null }
    const project: AiaProject = {
      _tag: 'AiaProject', name: 'Test', properties: makeProjectProperties(),
      screens: [
        { name: 'Screen1', scm: '', bky: SCREEN_BKY, yail: null },
        screen2,
      ],
      assets: [], extensions: []
    }
    const result = updateAllScreenBlocks(project, (ast, screenName) => ({
      blocks: ast.blocks.map(b => ({ ...b, type: `${screenName}_block` }))
    }))
    const ast1 = parseBlocks(result.project.screens[0].bky)
    const ast2 = parseBlocks(result.project.screens[1].bky)
    expect(ast1.blocks[0].type).toBe('Screen1_block')
    expect(ast2.blocks[0].type).toBe('Screen2_block')
  })
})
