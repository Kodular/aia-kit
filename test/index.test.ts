import { describe, expect, it } from 'vitest'
import { readAia, writeAia } from '#/aia.js'
import { readAix } from '#/aix.js'
import { parseBky, serializeBky } from '#/bky.js'
import { ComponentRegistry, normalizeComponentDescriptor } from '#/component-descriptor.js'
import { getEnvironmentFor, Platform } from '#/environment.js'
import { buildModel } from '#/model.js'
import { parseProjectProperties, serializeProjectProperties } from '#/project-properties.js'
import { ScmDocument } from '#/scm.js'
import { YailEmitter } from '#/yail/index.js'

describe('public domain subpaths', () => {
  it('exposes canonical composable modules', () => {
    expect(readAia).toBeTypeOf('function')
    expect(writeAia).toBeTypeOf('function')
    expect(readAix).toBeTypeOf('function')
    expect(parseBky).toBeTypeOf('function')
    expect(serializeBky).toBeTypeOf('function')
    expect(ComponentRegistry.of).toBeTypeOf('function')
    expect(normalizeComponentDescriptor).toBeTypeOf('function')
    expect(getEnvironmentFor).toBeTypeOf('function')
    expect(Platform.KodularCreator).toBe('kodular-creator')
    expect(buildModel).toBeTypeOf('function')
    expect(parseProjectProperties).toBeTypeOf('function')
    expect(serializeProjectProperties).toBeTypeOf('function')
    expect(ScmDocument.parse).toBeTypeOf('function')
    expect(YailEmitter.for).toBeTypeOf('function')
  })

  it('normalizes minimal component descriptors through the public descriptor module', () => {
    const descriptor = normalizeComponentDescriptor({
      type: 'com.example.ExtensionComponent',
    })

    expect(descriptor).toMatchObject({
      type: 'com.example.ExtensionComponent',
      name: 'ExtensionComponent',
      external: false,
      version: 1,
      categoryString: 'UNKNOWN',
      helpString: '',
      showOnPalette: true,
      nonVisible: false,
      iconName: '',
      properties: [],
      blockProperties: [],
      events: [],
      methods: [],
    })
  })

  it('rejects invalid component descriptors', () => {
    expect(() => normalizeComponentDescriptor(null)).toThrow('Component descriptor must be an object')
    expect(() => normalizeComponentDescriptor({ type: '' })).toThrow(
      'Component descriptor requires a non-empty type',
    )
  })
})
