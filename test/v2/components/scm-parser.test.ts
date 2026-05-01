import { describe, it, expect } from 'vitest'
import { ScmParser } from '../../../src/components/scm-parser.js'

const SCM = `#|
$JSON
{"authURL":["aia-kit"],"YaVersion":"1","Source":"Form","Properties":{"$Name":"Screen1","$Type":"Form","Uuid":"-1","Title":"Screen1","$Components":[{"$Name":"Button1","$Type":"Button","Uuid":"123","Text":"Click me","$Components":[]}]}}
|#`

describe('ScmParser', () => {
  describe('parse', () => {
    it('parses root form component', () => {
      const root = ScmParser.parse(SCM)
      expect(root.name).toBe('Screen1')
      expect(root.type).toBe('Form')
      expect(root.uid).toBe('-1')
    })

    it('parses child components', () => {
      const root = ScmParser.parse(SCM)
      expect(root.children).toHaveLength(1)
      expect(root.children[0].name).toBe('Button1')
      expect(root.children[0].type).toBe('Button')
      expect(root.children[0].uid).toBe('123')
    })

    it('parses component properties', () => {
      const root = ScmParser.parse(SCM)
      const button = root.children[0]
      expect(button.properties['Text']).toBe('Click me')
    })

    it('excludes $-prefixed keys from properties', () => {
      const root = ScmParser.parse(SCM)
      expect(root.properties).not.toHaveProperty('$Name')
      expect(root.properties).not.toHaveProperty('$Type')
      expect(root.properties).not.toHaveProperty('$Components')
    })

    it('throws on invalid SCM format', () => {
      expect(() => ScmParser.parse('no json block here')).toThrow()
    })
  })
})
