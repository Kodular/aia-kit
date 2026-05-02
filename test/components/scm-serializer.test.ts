// test/components/scm-serializer.test.ts
import { describe, it, expect } from 'vitest'
import { parseScm } from '#/components/scm-parser.js'
import { serializeScm } from '#/components/scm-serializer.js'

const SCM_WITH_BUTTON = `#|
$JSON
{"authURL":["aia-kit"],"YaVersion":"1","Source":"Form","Properties":{"$Name":"Screen1","$Type":"Form","Uuid":"-1","Title":"Screen1","$Components":[{"$Name":"Button1","$Type":"Button","Uuid":"123","Text":"Click me","$Components":[]}]}}
|#`

const EMPTY_SCM = `#|
$JSON
{"authURL":["aia-kit"],"YaVersion":"1","Source":"Form","Properties":{"$Name":"Screen1","$Type":"Form","Uuid":"-1","Title":"Screen1","$Components":[]}}
|#`

describe('serializeScm', () => {
  it('round-trips parse → serialize → parse identity', () => {
    const root = parseScm(SCM_WITH_BUTTON)
    const serialized = serializeScm(root, SCM_WITH_BUTTON)
    const reparsed = parseScm(serialized)
    expect(reparsed.name).toBe(root.name)
    expect(reparsed.type).toBe(root.type)
    expect(reparsed.uid).toBe(root.uid)
    expect(reparsed.children).toHaveLength(root.children.length)
    expect(reparsed.children[0].name).toBe('Button1')
    expect(reparsed.children[0].properties['Text']).toBe('Click me')
  })

  it('preserves top-level SCM metadata (authURL, YaVersion, Source)', () => {
    const root = parseScm(SCM_WITH_BUTTON)
    const serialized = serializeScm(root, SCM_WITH_BUTTON)
    expect(serialized).toMatch(/"authURL"/)
    expect(serialized).toMatch(/"YaVersion":"1"/)
    expect(serialized).toMatch(/"Source":"Form"/)
  })

  it('serializes a renamed root', () => {
    const root = parseScm(EMPTY_SCM)
    const renamed = { ...root, name: 'NewScreen' }
    const serialized = serializeScm(renamed, EMPTY_SCM)
    const reparsed = parseScm(serialized)
    expect(reparsed.name).toBe('NewScreen')
  })

  it('serializes nested children correctly', () => {
    const root = parseScm(SCM_WITH_BUTTON)
    const serialized = serializeScm(root, SCM_WITH_BUTTON)
    expect(serialized).toMatch(/"Button1"/)
    expect(serialized).toMatch(/"\$Type":"Button"/)
  })

  it('throws on invalid original SCM', () => {
    const root = parseScm(EMPTY_SCM)
    expect(() => serializeScm(root, 'not valid scm')).toThrow()
  })
})
