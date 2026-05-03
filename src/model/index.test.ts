import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { readAia } from '#/aia/index.js'
import { buildModel } from '#/model/index.js'
import { Platform, createEnvironment, getEnvironmentFor } from '#/environment/index.js'
import { FIXTURES_DIR, makeDescriptor, makeExtension, makeProjectProperties } from '#/test-helpers.js'

describe('buildModel', () => {
  it('returns a ModelProject with _tag', async () => {
    const bytes = readFileSync(join(FIXTURES_DIR, 'HelloPurr.aia'))
    const raw = await readAia(new Uint8Array(bytes))
    const env = await getEnvironmentFor(Platform.KodularCreator)
    const model = buildModel(raw, env)
    expect(model._tag).toBe('ModelProject')
  })

  it('model.screens has same count as raw screens', async () => {
    const bytes = readFileSync(join(FIXTURES_DIR, 'HelloPurr.aia'))
    const raw = await readAia(new Uint8Array(bytes))
    const env = await getEnvironmentFor(Platform.KodularCreator)
    const model = buildModel(raw, env)
    expect(model.screens).toHaveLength(raw.screens.length)
  })

  it('resolves root form component', async () => {
    const bytes = readFileSync(join(FIXTURES_DIR, 'HelloPurr.aia'))
    const raw = await readAia(new Uint8Array(bytes))
    const env = await getEnvironmentFor(Platform.KodularCreator)
    const model = buildModel(raw, env)
    const screen = model.screens[0]
    expect(screen.form.name).toBeTruthy()
    expect(screen.form.descriptor).toBeTruthy()
  })

  it('never throws, even with empty screens', () => {
    const raw = {
      _tag: 'AiaProject' as const,
      name: 'Empty',
      properties: makeProjectProperties(),
      screens: [{
        name: 'Screen1',
        scm: `#|\n$JSON\n{"YaVersion":"1","Source":"Form","Properties":{"$Name":"Screen1","$Type":"Form","Uuid":"-1","$Components":[]}}\n|#`,
        bky: '<xml xmlns="https://developers.google.com/blockly/xml"></xml>',
        yail: null,
      }],
      assets: [],
      extensions: [],
    }
    const env = createEnvironment({
      meta: { id: 'empty', name: 'Empty' },
      components: [],
    })
    expect(() => buildModel(raw, env)).not.toThrow()
  })

  it('emits UNRESOLVABLE_COMPONENT diagnostic for unknown type', () => {
    const raw = {
      _tag: 'AiaProject' as const,
      name: 'Test',
      properties: makeProjectProperties(),
      screens: [{
        name: 'Screen1',
        scm: `#|\n$JSON\n{"YaVersion":"1","Source":"Form","Properties":{"$Name":"Screen1","$Type":"Form","Uuid":"-1","$Components":[{"$Name":"Widget1","$Type":"GhostWidget","Uuid":"abc","$Components":[]}]}}\n|#`,
        bky: '<xml xmlns="https://developers.google.com/blockly/xml"></xml>',
        yail: null,
      }],
      assets: [],
      extensions: [],
    }
    const env = createEnvironment({
      meta: { id: 'empty', name: 'Empty' },
      components: [],
    })
    const model = buildModel(raw, env)
    expect(model.diagnostics.some(d => d.code === 'UNRESOLVABLE_COMPONENT')).toBe(true)
  })

  it('folds project extension descriptors into the effective component registry without mutating the environment registry', () => {
    const extensionDescriptor = makeDescriptor({
      type: 'com.example.ExtensionWidget',
      name: 'ExtensionWidget',
      external: true,
    })
    const project = {
      _tag: 'AiaProject' as const,
      name: 'ExtensionProject',
      properties: makeProjectProperties(),
      screens: [{
        name: 'Screen1',
        scm: `#|\n$JSON\n{"YaVersion":"1","Source":"Form","Properties":{"$Name":"Screen1","$Type":"Form","Uuid":"-1","$Components":[{"$Name":"Widget1","$Type":"com.example.ExtensionWidget","Uuid":"abc","$Components":[]}]}}\n|#`,
        bky: '<xml xmlns="https://developers.google.com/blockly/xml"></xml>',
        yail: null,
      }],
      assets: [],
      extensions: [makeExtension({
        packageName: 'com.example',
        components: [extensionDescriptor],
      })],
    }
    const env = createEnvironment({
      meta: { id: 'base', name: 'Base' },
      components: [
        makeDescriptor({
          type: 'com.google.appinventor.components.runtime.Form',
          name: 'Form',
        }),
      ],
    })

    const model = buildModel(project, env)

    expect(model.componentRegistry.lookup('com.example.ExtensionWidget')).toBe(extensionDescriptor)
    expect(model.screens[0]?.form.children[0]?.descriptor).toBe(extensionDescriptor)
    expect(model.diagnostics.some(d => d.code === 'UNRESOLVABLE_COMPONENT')).toBe(false)
    expect(env.componentRegistry.lookup('com.example.ExtensionWidget')).toBeNull()
  })
})
