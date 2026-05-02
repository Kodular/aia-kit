import { describe, it, expect } from 'vitest'
import {
  analyzeComplexity,
  findDeadBlocks,
  buildNavGraph,
} from '#/analysis/cross-cutting.js'
import type { AiaProject, AiaScreen } from '#/core/types.js'
import { Environment } from '#/core/environment.js'
import { resolve } from '#/resolve.js'

/** Valid MIT-style SCM block (`|#` required by `#/components/scm-parser.js`). */
function scmForScreen(name: string): string {
  return `#|
$JSON
{"YaVersion":"1","Source":"Form","Properties":{"$Name":"${name}","$Type":"Form","Uuid":"-1","Title":"${name}","$Components":[]}}
|#`
}

const EMPTY_BKY = `<xml xmlns="https://developers.google.com/blockly/xml"></xml>`

const SIMPLE_BKY = `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="text_print" id="b1" x="10" y="20">
    <value name="TEXT">
      <block type="text" id="b2">
        <field name="TEXT">Hello</field>
      </block>
    </value>
  </block>
</xml>`

function makeScreen(name: string, scm = scmForScreen(name), bky = EMPTY_BKY): AiaScreen {
  return { name, scm, bky, yail: null }
}

function makeProject(screens: AiaScreen[]): AiaProject {
  return {
    _tag: 'AiaProject',
    name: 'Test',
    properties: {},
    screens,
    assets: [],
    extensions: [],
  }
}

describe('analyzeComplexity', () => {
  it('reports zeros for empty BKY', async () => {
    const env = await Environment.mitAppInventor()
    const model = resolve(makeProject([makeScreen('S1')]), env)
    const r = analyzeComplexity(model)
    expect(r.screens).toHaveLength(1)
    expect(r.screens[0]).toMatchObject({
      screenName: 'S1',
      topLevelBlocks: 0,
      totalBlocks: 0,
      maxDepth: 0,
    })
  })

  it('matches SIMPLE_BKY totals from bky-parser tests', async () => {
    const env = await Environment.mitAppInventor()
    const model = resolve(makeProject([makeScreen('Main', scmForScreen('Main'), SIMPLE_BKY)]), env)
    const r = analyzeComplexity(model)
    expect(r.screens[0].topLevelBlocks).toBe(1)
    expect(r.screens[0].totalBlocks).toBe(2)
    expect(r.screens[0].maxDepth).toBe(2)
  })
})

const HAT_AND_ORPHAN_BKY = `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="event_handler" id="hat1"></block>
  <block type="text_print" id="dead_print">
    <value name="TEXT">
      <block type="text" id="dead_text">
        <field name="TEXT">orphan</field>
      </block>
    </value>
  </block>
</xml>`

describe('findDeadBlocks', () => {
  it('flags top-level block not reachable from hat', async () => {
    const env = await Environment.mitAppInventor()
    const model = resolve(
      makeProject([makeScreen('Scr', scmForScreen('Scr'), HAT_AND_ORPHAN_BKY)]),
      env,
    )
    const dead = findDeadBlocks(model)
    const ids = new Set(dead.map(d => d.blockId))
    expect(ids.has('dead_print')).toBe(true)
    expect(ids.has('dead_text')).toBe(true)
    expect(ids.has('hat1')).toBe(false)
  })
})

const OPEN_SCREEN_BKY = `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="Foo_openAnotherScreen" id="nav1">
    <field name="SCREENNAME">Screen2</field>
  </block>
</xml>`

describe('buildNavGraph', () => {
  it('captures OpenAnotherScreen edge and node set', async () => {
    const env = await Environment.mitAppInventor()
    const model = resolve(
      makeProject([
        makeScreen('Screen1', scmForScreen('Screen1'), OPEN_SCREEN_BKY),
        makeScreen('Screen2', scmForScreen('Screen2')),
      ]),
      env,
    )
    const g = buildNavGraph(model)
    expect(g.nodes).toEqual(['Screen1', 'Screen2'])
    expect(g.edges).toContainEqual({ from: 'Screen1', to: 'Screen2' })
  })
})
