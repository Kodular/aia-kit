// test/mutations/screens.test.ts
import { describe, it, expect } from 'vitest'
import { addScreen, removeScreen, cloneScreen } from '#/mutations/screens.js'
import type { AiaProject, AiaScreen } from '#/core/types.js'
import { parseScm } from '#/components/scm-parser.js'
import { makeProjectProperties } from '../helpers.js'

const EMPTY_BKY = `<xml xmlns="https://developers.google.com/blockly/xml"></xml>`

function makeScreen(name: string, bky = EMPTY_BKY): AiaScreen {
  const scm = `#|\n$JSON\n{"authURL":["aia-kit"],"YaVersion":"1","Source":"Form","Properties":{"$Name":"${name}","$Type":"Form","Uuid":"-1","Title":"${name}","$Components":[]}}\n|#`
  return { name, scm, bky, yail: null }
}

function makeProject(...screenNames: string[]): AiaProject {
  const screens = screenNames.map(n => makeScreen(n))
  return { _tag: 'AiaProject', name: 'Test', properties: makeProjectProperties(), screens, assets: [], extensions: [] }
}

describe('addScreen', () => {
  it('appends a new screen', () => {
    const project = makeProject('Screen1')
    const newScreen = makeScreen('Screen2')
    const result = addScreen(project, newScreen)
    expect(result.diagnostics).toEqual([])
    expect(result.project.screens).toHaveLength(2)
    expect(result.project.screens[1].name).toBe('Screen2')
  })

  it('emits DUPLICATE_COMPONENT_NAME when screen name already exists', () => {
    const project = makeProject('Screen1')
    const result = addScreen(project, makeScreen('Screen1'))
    expect(result.diagnostics[0].code).toBe('DUPLICATE_COMPONENT_NAME')
    expect(result.project.screens).toHaveLength(1)
  })

  it('does not mutate the original project', () => {
    const project = makeProject('Screen1')
    addScreen(project, makeScreen('Screen2'))
    expect(project.screens).toHaveLength(1)
  })

  it('preserves provided YAIL for the new screen', () => {
    const project = makeProject('Screen1')
    const result = addScreen(project, { ...makeScreen('Screen2'), yail: 'provided yail' })
    expect(result.diagnostics).toEqual([])
    expect(result.project.screens[1].yail).toBe('provided yail')
  })
})

describe('removeScreen', () => {
  it('removes an existing screen', () => {
    const project = makeProject('Screen1', 'Screen2')
    const result = removeScreen(project, 'Screen2')
    expect(result.diagnostics).toEqual([])
    expect(result.project.screens).toHaveLength(1)
    expect(result.project.screens[0].name).toBe('Screen1')
  })

  it('emits MISSING_SCREEN_FILE for unknown screen name', () => {
    const project = makeProject('Screen1')
    const result = removeScreen(project, 'NoSuch')
    expect(result.diagnostics[0].code).toBe('MISSING_SCREEN_FILE')
    expect(result.project.screens).toHaveLength(1)
  })
})

describe('cloneScreen', () => {
  it('creates a new screen with the given name', () => {
    const project = makeProject('Screen1')
    const result = cloneScreen(project, 'Screen1', 'Screen2')
    expect(result.diagnostics).toEqual([])
    expect(result.project.screens).toHaveLength(2)
    expect(result.project.screens[1].name).toBe('Screen2')
  })

  it('updates the root component name in the cloned SCM', () => {
    const project = makeProject('Screen1')
    const result = cloneScreen(project, 'Screen1', 'Screen2')
    const cloned = result.project.screens[1]
    const root = parseScm(cloned.scm)
    expect(root.name).toBe('Screen2')
  })

  it('preserves BKY content', () => {
    const project = makeProject('Screen1')
    const result = cloneScreen(project, 'Screen1', 'Screen2')
    expect(result.project.screens[1].bky).toBe(EMPTY_BKY)
  })

  it('does not clone existing YAIL', () => {
    const project = makeProject('Screen1')
    project.screens[0].yail = 'existing yail'
    const result = cloneScreen(project, 'Screen1', 'Screen2')
    expect(result.project.screens[1].yail).toBeNull()
  })

  it('emits MISSING_SCREEN_FILE for unknown source screen', () => {
    const project = makeProject('Screen1')
    const result = cloneScreen(project, 'NoSuch', 'Screen2')
    expect(result.diagnostics[0].code).toBe('MISSING_SCREEN_FILE')
  })

  it('emits DUPLICATE_COMPONENT_NAME when target name already exists', () => {
    const project = makeProject('Screen1', 'Screen2')
    const result = cloneScreen(project, 'Screen1', 'Screen2')
    expect(result.diagnostics[0].code).toBe('DUPLICATE_COMPONENT_NAME')
  })
})
