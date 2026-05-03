import { describe, it, expect } from 'vitest'
import {
  analyzeComplexity,
  findDeadBlocks,
  buildNavGraph,
} from '#/analysis/cross-cutting.js'
import type { AiaProject, AiaScreen } from '#/core/types.js'
import { Platform, getEnvironmentFor } from '#/core/environment.js'
import { resolve } from '#/resolve.js'
import { makeProjectProperties } from '../helpers.js'

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
    properties: makeProjectProperties(),
    screens,
    assets: [],
    extensions: [],
  }
}

describe('analyzeComplexity', () => {
  it('reports zeros for empty BKY', async () => {
    const env = await getEnvironmentFor(Platform.MitAppInventor)
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
    const env = await getEnvironmentFor(Platform.MitAppInventor)
    const model = resolve(makeProject([makeScreen('Main', scmForScreen('Main'), SIMPLE_BKY)]), env)
    const r = analyzeComplexity(model)
    expect(r.screens[0].topLevelBlocks).toBe(1)
    expect(r.screens[0].totalBlocks).toBe(2)
    expect(r.screens[0].maxDepth).toBe(2)
  })

  it('does not throw on malformed BKY — treats as empty workspace', async () => {
    const env = await getEnvironmentFor(Platform.MitAppInventor)
    const model = resolve(
      makeProject([
        makeScreen('Bad', scmForScreen('Bad'), '<<<'),
        makeScreen('Good', scmForScreen('Good'), SIMPLE_BKY),
      ]),
      env,
    )
    expect(() => analyzeComplexity(model)).not.toThrow()
    const r = analyzeComplexity(model)
    expect(r.screens[0]).toMatchObject({
      screenName: 'Bad',
      topLevelBlocks: 0,
      totalBlocks: 0,
      maxDepth: 0,
    })
    expect(r.screens[1].topLevelBlocks).toBe(1)
    expect(r.screens[1].totalBlocks).toBe(2)
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

/** `when_*` hats do not contain `event_` — must still count as entry roots (M2b semantics). */
const WHEN_HAT_AND_ORPHAN_BKY = `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="when_Screen1.Initialize" id="when1"></block>
  <block type="text_print" id="dead_when_orphan"></block>
</xml>`

/** `component_*` + `Click` event hats (M2b semantics). */
const COMPONENT_CLICK_HAT_ORPHAN_BKY = `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="component_Button1_Click" id="cb1"></block>
  <block type="text_print" id="dead_click_orphan"></block>
</xml>`

describe('findDeadBlocks', () => {
  it('flags top-level block not reachable from hat', async () => {
    const env = await getEnvironmentFor(Platform.MitAppInventor)
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

  it('treats when_* top-level blocks as hats', async () => {
    const env = await getEnvironmentFor(Platform.MitAppInventor)
    const model = resolve(
      makeProject([makeScreen('S', scmForScreen('S'), WHEN_HAT_AND_ORPHAN_BKY)]),
      env,
    )
    const dead = findDeadBlocks(model)
    const ids = new Set(dead.map(d => d.blockId))
    expect(ids.has('when1')).toBe(false)
    expect(ids.has('dead_when_orphan')).toBe(true)
  })

  it('treats component_*…*Click* blocks as hats', async () => {
    const env = await getEnvironmentFor(Platform.MitAppInventor)
    const model = resolve(
      makeProject([makeScreen('S', scmForScreen('S'), COMPONENT_CLICK_HAT_ORPHAN_BKY)]),
      env,
    )
    const dead = findDeadBlocks(model)
    const ids = new Set(dead.map(d => d.blockId))
    expect(ids.has('cb1')).toBe(false)
    expect(ids.has('dead_click_orphan')).toBe(true)
  })

  it('does not throw on malformed BKY', async () => {
    const env = await getEnvironmentFor(Platform.MitAppInventor)
    const model = resolve(makeProject([makeScreen('X', scmForScreen('X'), 'not xml')]), env)
    expect(() => findDeadBlocks(model)).not.toThrow()
    expect(findDeadBlocks(model)).toEqual([])
  })
})

const OPEN_SCREEN_BKY = `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="Foo_openAnotherScreen" id="nav1">
    <field name="SCREENNAME">Screen2</field>
  </block>
</xml>`

describe('buildNavGraph', () => {
  it('captures OpenAnotherScreen edge and node set', async () => {
    const env = await getEnvironmentFor(Platform.MitAppInventor)
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

  it('does not throw on malformed BKY', async () => {
    const env = await getEnvironmentFor(Platform.MitAppInventor)
    const model = resolve(makeProject([makeScreen('S1', scmForScreen('S1'), '<<<')]), env)
    expect(() => buildNavGraph(model)).not.toThrow()
    expect(buildNavGraph(model)).toEqual({ nodes: ['S1'], edges: [] })
  })
})
