import { describe, expect, it } from 'vitest'
import { ScmDocument } from '#/scm/index.js'
import type { AiaComponent } from '#/types.js'

const EMPTY_SCM = `#|
$JSON
{"authURL":["aia-kit"],"YaVersion":"1","Source":"Form","Properties":{"$Name":"Screen1","$Type":"Form","Uuid":"0","Title":"Screen1","$Components":[]}}
|#`

function makeButton(): AiaComponent {
  return {
    name: 'Button1',
    type: 'Button',
    uid: '2',
    properties: { Text: 'Click me' },
    children: [],
  }
}

describe('ScmDocument', () => {
  it('parses SCM with metadata wrapper and empty components', () => {
    const document = ScmDocument.parse(EMPTY_SCM)

    expect(document.diagnostics).toEqual([])
    expect(document.root).toEqual({
      name: 'Screen1',
      type: 'Form',
      uid: '0',
      properties: { Title: 'Screen1' },
      children: [],
    })
  })

  it('finds the root form by uid', () => {
    const document = ScmDocument.parse(EMPTY_SCM)

    expect(document.findComponentByUid('0')).toMatchObject({
      name: 'Screen1',
      type: 'Form',
    })
  })

  it('adds and queries a raw component', () => {
    const document = ScmDocument.parse(EMPTY_SCM)
    const button = makeButton()

    expect(document.addComponent('0', button)).toEqual([])
    expect(document.findComponentByUid('2')).toBe(button)
    expect(document.getComponentsByType('Button')).toEqual([button])
    expect(document.serialize()).toContain('Button1')
  })

  it('returns a diagnostic and does not mutate when adding to a missing parent', () => {
    const document = ScmDocument.parse(EMPTY_SCM)
    const before = document.serialize()

    const diagnostics = document.addComponent('missing', makeButton())

    expect(diagnostics).toHaveLength(1)
    expect(diagnostics[0]).toMatchObject({
      code: 'UNRESOLVABLE_COMPONENT',
      severity: 'error',
    })
    expect(document.diagnostics).toEqual(diagnostics)
    expect(document.serialize()).toBe(before)
  })

  it('returns a diagnostic and does not mutate when removing a missing component', () => {
    const document = ScmDocument.parse(EMPTY_SCM)
    document.addComponent('0', makeButton())
    const before = document.serialize()

    const diagnostics = document.removeComponent('missing')

    expect(diagnostics).toHaveLength(1)
    expect(diagnostics[0]).toMatchObject({
      code: 'UNRESOLVABLE_COMPONENT',
      severity: 'error',
    })
    expect(document.diagnostics).toEqual(diagnostics)
    expect(document.serialize()).toBe(before)
  })

  it('returns a diagnostic and does not mutate when removing the root component', () => {
    const document = ScmDocument.parse(EMPTY_SCM)
    const before = document.serialize()

    const diagnostics = document.removeComponent('0')

    expect(diagnostics).toHaveLength(1)
    expect(diagnostics[0]).toMatchObject({
      code: 'UNRESOLVABLE_COMPONENT',
      severity: 'error',
    })
    expect(document.diagnostics).toEqual(diagnostics)
    expect(document.serialize()).toBe(before)
  })
})
