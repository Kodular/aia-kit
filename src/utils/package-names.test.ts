import { describe, expect, it } from 'vitest'
import {
  extractClassName,
  extractPackageName,
  getDotPackagePrefix,
  getPackagePath,
} from '#/utils/package-names.js'
import { makeProjectProperties } from '#/test-helpers.js'

describe('package-name utilities', () => {
  it('gets the dotted package prefix from the main screen class', () => {
    const properties = makeProjectProperties({ main: 'com.example.myapp.Screen1' })
    expect(getDotPackagePrefix(properties)).toBe('com.example.myapp')
  })

  it('falls back when main is empty or not fully qualified', () => {
    expect(getDotPackagePrefix(makeProjectProperties({ main: '' }))).toBe('appinventor.ai_user.Project')
    expect(getDotPackagePrefix(makeProjectProperties({ main: 'Screen1' }))).toBe('appinventor.ai_user.Project')
  })

  it('converts the package prefix into an archive path', () => {
    const properties = makeProjectProperties({ main: 'appinventor.ai_user.MyProject.Screen2' })
    expect(getPackagePath(properties)).toBe('appinventor/ai_user/MyProject')
  })

  it('extracts package and class names from qualified type names', () => {
    expect(extractPackageName('com.example.ExtensionComponent')).toBe('com.example')
    expect(extractClassName('com.example.ExtensionComponent')).toBe('ExtensionComponent')
  })

  it('handles unqualified and dotted-empty names', () => {
    expect(extractPackageName('Button')).toBe('')
    expect(extractClassName('Button')).toBe('Button')
    expect(extractPackageName('.com..example.Button.')).toBe('com.example')
    expect(extractClassName('')).toBe('')
  })
})
