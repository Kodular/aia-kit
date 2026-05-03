import { describe, expect, it } from 'vitest'
import { readAia, writeAia } from '#/aia/index.js'
import { readAix } from '#/aix/index.js'
import { exportScreenAsAis, readAis } from '#/ais/index.js'
import { parseBky, serializeBky } from '#/bky/index.js'
import { ComponentRegistry, normalizeComponentDescriptor } from '#/component-descriptor/index.js'
import { getEnvironmentFor, Platform } from '#/environment/index.js'
import { buildModel } from '#/model/index.js'
import { parseProjectProperties, serializeProjectProperties } from '#/project-properties/index.js'
import { ScmDocument } from '#/scm/index.js'
import { YailEmitter } from '#/yail/index.js'

describe('public domain subpaths', () => {
  it('exposes canonical composable modules', () => {
    expect(readAia).toBeTypeOf('function')
    expect(writeAia).toBeTypeOf('function')
    expect(readAix).toBeTypeOf('function')
    expect(readAis).toBeTypeOf('function')
    expect(exportScreenAsAis).toBeTypeOf('function')
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
