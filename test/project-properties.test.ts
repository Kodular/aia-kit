import { describe, it, expect } from 'vitest'
import { parseProjectProperties } from '#/parse.js'
import { serializeProperties } from '#/write.js'

describe('parseProjectProperties — known fields', () => {
  it('parses main and name', () => {
    const p = parseProjectProperties({
      main: 'appinventor.ai_user.MyApp.Screen1',
      name: 'MyApp',
    })
    expect(p.main).toBe('appinventor.ai_user.MyApp.Screen1')
    expect(p.name).toBe('MyApp')
  })

  it('parses versionCode as a number', () => {
    const p = parseProjectProperties({ versioncode: '42' })
    expect(p.versionCode).toBe(42)
    expect(typeof p.versionCode).toBe('number')
  })

  it('defaults versionCode to 1 when missing', () => {
    const p = parseProjectProperties({})
    expect(p.versionCode).toBe(1)
  })

  it('defaults versionCode to 1 when value is non-numeric', () => {
    const p = parseProjectProperties({ versioncode: 'bad' })
    expect(p.versionCode).toBe(1)
  })

  it('parses versionName as string', () => {
    const p = parseProjectProperties({ versionname: '2.3' })
    expect(p.versionName).toBe('2.3')
  })

  it('parses sizing as literal union', () => {
    const fixed = parseProjectProperties({ sizing: 'Fixed' })
    expect(fixed.sizing).toBe('Fixed')
    const responsive = parseProjectProperties({ sizing: 'Responsive' })
    expect(responsive.sizing).toBe('Responsive')
  })

  it('produces undefined sizing for unknown value', () => {
    const p = parseProjectProperties({ sizing: 'Weird' })
    expect(p.sizing).toBeUndefined()
  })

  it('parses showListsAsJsonArray as boolean true', () => {
    const p = parseProjectProperties({ showlistsasjsonarray: 'true' })
    expect(p.showListsAsJsonArray).toBe(true)
    expect(typeof p.showListsAsJsonArray).toBe('boolean')
  })

  it('parses showListsAsJsonArray as boolean false', () => {
    const p = parseProjectProperties({ showlistsasjsonarray: 'false' })
    expect(p.showListsAsJsonArray).toBe(false)
    expect(typeof p.showListsAsJsonArray).toBe('boolean')
  })

  it('parses actionBar as boolean', () => {
    const trueCase = parseProjectProperties({ actionbar: 'true' })
    expect(trueCase.actionBar).toBe(true)
    const falseCase = parseProjectProperties({ actionbar: 'false' })
    expect(falseCase.actionBar).toBe(false)
  })

  it('parses color fields', () => {
    const p = parseProjectProperties({
      'color.primary': '&HFF6200EE',
      'color.primary.dark': '&HFF3700B3',
      'color.accent': '&HFF03DAC5',
    })
    expect(p.colorPrimary).toBe('&HFF6200EE')
    expect(p.colorPrimaryDark).toBe('&HFF3700B3')
    expect(p.colorAccent).toBe('&HFF03DAC5')
  })

  it('parses theme', () => {
    const p = parseProjectProperties({ theme: 'AppTheme.Light.DarkActionBar' })
    expect(p.theme).toBe('AppTheme.Light.DarkActionBar')
  })

  it('parses aname into appName', () => {
    const p = parseProjectProperties({ aname: 'My Cool App' })
    expect(p.appName).toBe('My Cool App')
  })
})

describe('parseProjectProperties — optional fields undefined when missing', () => {
  it('appName is undefined when aname is absent', () => {
    const p = parseProjectProperties({ main: 'a.b.c.Screen1', name: 'c' })
    expect(p.appName).toBeUndefined()
  })

  it('sizing is undefined when absent', () => {
    const p = parseProjectProperties({})
    expect(p.sizing).toBeUndefined()
  })

  it('theme is undefined when absent', () => {
    const p = parseProjectProperties({})
    expect(p.theme).toBeUndefined()
  })

  it('showListsAsJsonArray is undefined when absent', () => {
    const p = parseProjectProperties({})
    expect(p.showListsAsJsonArray).toBeUndefined()
  })

  it('actionBar is undefined when absent', () => {
    const p = parseProjectProperties({})
    expect(p.actionBar).toBeUndefined()
  })

  it('color fields are undefined when absent', () => {
    const p = parseProjectProperties({})
    expect(p.colorPrimary).toBeUndefined()
    expect(p.colorPrimaryDark).toBeUndefined()
    expect(p.colorAccent).toBeUndefined()
  })
})

describe('parseProjectProperties — unknown bucket', () => {
  it('unknown keys go into the unknown record', () => {
    const p = parseProjectProperties({
      main: 'a.b.c.Screen1',
      name: 'c',
      customfoo: 'bar',
      mykey: 'myval',
    })
    expect(p.unknown).toEqual({ customfoo: 'bar', mykey: 'myval' })
  })

  it('known keys do not appear in unknown', () => {
    const p = parseProjectProperties({
      main: 'a.b.c.Screen1',
      name: 'c',
      versioncode: '1',
      versionname: '1.0',
      theme: 'Classic',
    })
    expect(Object.keys(p.unknown)).toHaveLength(0)
  })
})

describe('round-trip: serializeProperties(parseProjectProperties(raw))', () => {
  it('preserves main, name, versioncode, versionname', () => {
    const raw = {
      main: 'appinventor.ai_user.TestApp.Screen1',
      name: 'TestApp',
      versioncode: '3',
      versionname: '1.2',
    }
    const serialized = serializeProperties(parseProjectProperties(raw))
    expect(serialized).toContain('main=appinventor.ai_user.TestApp.Screen1')
    expect(serialized).toContain('name=TestApp')
    expect(serialized).toContain('versioncode=3')
    expect(serialized).toContain('versionname=1.2')
  })

  it('preserves optional known fields when present', () => {
    const raw = {
      main: 'a.b.c.Screen1',
      name: 'c',
      versioncode: '1',
      versionname: '1.0',
      aname: 'Cool App',
      sizing: 'Responsive',
      theme: 'Classic',
      showlistsasjsonarray: 'true',
      actionbar: 'false',
    }
    const serialized = serializeProperties(parseProjectProperties(raw))
    expect(serialized).toContain('aname=Cool App')
    expect(serialized).toContain('sizing=Responsive')
    expect(serialized).toContain('theme=Classic')
    expect(serialized).toContain('showlistsasjsonarray=true')
    expect(serialized).toContain('actionbar=false')
  })

  it('preserves unknown fields', () => {
    const raw = {
      main: 'a.b.c.Screen1',
      name: 'c',
      versioncode: '1',
      versionname: '1.0',
      myCustomKey: 'someValue',
    }
    const serialized = serializeProperties(parseProjectProperties(raw))
    expect(serialized).toContain('myCustomKey=someValue')
  })

  it('does not emit optional fields that were absent', () => {
    const raw = {
      main: 'a.b.c.Screen1',
      name: 'c',
      versioncode: '1',
      versionname: '1.0',
    }
    const serialized = serializeProperties(parseProjectProperties(raw))
    expect(serialized).not.toContain('theme=')
    expect(serialized).not.toContain('sizing=')
    expect(serialized).not.toContain('aname=')
    expect(serialized).not.toContain('showlistsasjsonarray=')
    expect(serialized).not.toContain('actionbar=')
  })
})
