// test/mutations/components.test.ts
import { describe, it, expect } from 'vitest'
import { addComponent, removeComponent, updatePropertyWhere } from '#/mutations/components.js'
import { parseScm } from '#/components/scm-parser.js'
import type { AiaProject, AiaScreen, AiaComponent } from '#/core/types.js'

const EMPTY_BKY = `<xml xmlns="https://developers.google.com/blockly/xml"></xml>`

// SCM with one Button child
const SCM_WITH_BUTTON = `#|
$JSON
{"authURL":["aia-kit"],"YaVersion":"1","Source":"Form","Properties":{"$Name":"Screen1","$Type":"Form","Uuid":"root-uid","Title":"Screen1","$Components":[{"$Name":"Button1","$Type":"Button","Uuid":"btn-uid","Text":"Click","$Components":[]}]}}
|#`

// SCM with empty form
const EMPTY_SCM = `#|
$JSON
{"authURL":["aia-kit"],"YaVersion":"1","Source":"Form","Properties":{"$Name":"Screen1","$Type":"Form","Uuid":"root-uid","Title":"Screen1","$Components":[]}}
|#`

function makeProject(scm: string): AiaProject {
  const screen: AiaScreen = { name: 'Screen1', scm, bky: EMPTY_BKY, yail: null }
  return { _tag: 'AiaProject', name: 'Test', properties: {}, screens: [screen], assets: [], extensions: [] }
}

const NEW_LABEL: AiaComponent = {
  name: 'Label1', type: 'Label', uid: 'lbl-uid',
  properties: { Text: 'Hello' }, children: [],
}

describe('addComponent', () => {
  it('adds a component to the root form', () => {
    const project = makeProject(EMPTY_SCM)
    const result = addComponent(project, 'Screen1', NEW_LABEL, 'root-uid')
    expect(result.diagnostics).toEqual([])
    const root = parseScm(result.project.screens[0].scm)
    expect(root.children).toHaveLength(1)
    expect(root.children[0].name).toBe('Label1')
  })

  it('adds a component as a child of a nested component', () => {
    const project = makeProject(SCM_WITH_BUTTON)
    const nested: AiaComponent = { name: 'Label1', type: 'Label', uid: 'lbl-uid', properties: {}, children: [] }
    const result = addComponent(project, 'Screen1', nested, 'btn-uid')
    expect(result.diagnostics).toEqual([])
    const root = parseScm(result.project.screens[0].scm)
    const button = root.children[0]
    expect(button.children).toHaveLength(1)
    expect(button.children[0].name).toBe('Label1')
  })

  it('preserves existing children', () => {
    const project = makeProject(SCM_WITH_BUTTON)
    const newComp: AiaComponent = { name: 'Label1', type: 'Label', uid: 'lbl-uid', properties: {}, children: [] }
    const result = addComponent(project, 'Screen1', newComp, 'root-uid')
    const root = parseScm(result.project.screens[0].scm)
    expect(root.children).toHaveLength(2)
  })

  it('emits MISSING_SCREEN_FILE for unknown screen', () => {
    const project = makeProject(EMPTY_SCM)
    const result = addComponent(project, 'NoSuch', NEW_LABEL, 'root-uid')
    expect(result.diagnostics[0].code).toBe('MISSING_SCREEN_FILE')
  })

  it('emits UNRESOLVABLE_COMPONENT when parent UID not found', () => {
    const project = makeProject(EMPTY_SCM)
    const result = addComponent(project, 'Screen1', NEW_LABEL, 'nonexistent-uid')
    expect(result.diagnostics[0].code).toBe('UNRESOLVABLE_COMPONENT')
  })
})

describe('removeComponent', () => {
  it('removes a direct child of the root', () => {
    const project = makeProject(SCM_WITH_BUTTON)
    const result = removeComponent(project, 'Screen1', 'btn-uid')
    expect(result.diagnostics).toEqual([])
    const root = parseScm(result.project.screens[0].scm)
    expect(root.children).toHaveLength(0)
  })

  it('emits MISSING_SCREEN_FILE for unknown screen', () => {
    const project = makeProject(SCM_WITH_BUTTON)
    const result = removeComponent(project, 'NoSuch', 'btn-uid')
    expect(result.diagnostics[0].code).toBe('MISSING_SCREEN_FILE')
  })

  it('emits UNRESOLVABLE_COMPONENT when uid not found', () => {
    const project = makeProject(EMPTY_SCM)
    const result = removeComponent(project, 'Screen1', 'nonexistent-uid')
    expect(result.diagnostics[0].code).toBe('UNRESOLVABLE_COMPONENT')
  })

  it('emits UNRESOLVABLE_COMPONENT when attempting to remove the root form', () => {
    const project = makeProject(EMPTY_SCM)
    const result = removeComponent(project, 'Screen1', 'root-uid')
    expect(result.diagnostics[0].code).toBe('UNRESOLVABLE_COMPONENT')
    expect(result.diagnostics[0].message).toMatch(/root form/)
  })
})

describe('updatePropertyWhere', () => {
  it('updates a matching component property', () => {
    const project = makeProject(SCM_WITH_BUTTON)
    const result = updatePropertyWhere(
      project,
      c => c.type === 'Button',
      'Text',
      'Updated'
    )
    expect(result.diagnostics).toEqual([])
    const root = parseScm(result.project.screens[0].scm)
    expect(root.children[0].properties['Text']).toBe('Updated')
  })

  it('does not modify non-matching components', () => {
    const project = makeProject(SCM_WITH_BUTTON)
    const result = updatePropertyWhere(
      project,
      c => c.type === 'Label',
      'Text',
      'Changed'
    )
    const root = parseScm(result.project.screens[0].scm)
    expect(root.children[0].properties['Text']).toBe('Click')
  })

  it('applies to all screens', () => {
    const screen2: AiaScreen = {
      name: 'Screen2',
      scm: SCM_WITH_BUTTON.replace(/Screen1/g, 'Screen2'),
      bky: EMPTY_BKY,
      yail: null,
    }
    const project: AiaProject = {
      _tag: 'AiaProject', name: 'Test', properties: {},
      screens: [
        { name: 'Screen1', scm: SCM_WITH_BUTTON, bky: EMPTY_BKY, yail: null },
        screen2,
      ],
      assets: [], extensions: [],
    }
    const result = updatePropertyWhere(project, c => c.type === 'Button', 'Text', 'X')
    expect(result.diagnostics).toEqual([])
    for (const screen of result.project.screens) {
      const root = parseScm(screen.scm)
      expect(root.children[0].properties['Text']).toBe('X')
    }
  })
})
