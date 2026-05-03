import { describe, expect, it } from 'vitest'
import {
  addAsset,
  addExtension,
  addScreen,
  cloneScreen,
  mergeProjects,
  removeAsset,
  removeExtension,
  removeScreen,
} from '#/aia/index.js'
import { parseScm } from '#/scm/parse.js'
import type { AiaAsset, AiaExtension, AiaProject, AiaScreen } from '#/types.js'
import { makeProjectProperties } from '../test-helpers.js'

const EMPTY_BKY = `<xml xmlns="https://developers.google.com/blockly/xml"></xml>`

function makeScm(screenName: string): string {
  return `#|\n$JSON\n{"authURL":["aia-kit"],"YaVersion":"1","Source":"Form","Properties":{"$Name":"${screenName}","$Type":"Form","Uuid":"-1","Title":"${screenName}","$Components":[]}}\n|#`
}

function makeScreen(name: string, bky = EMPTY_BKY): AiaScreen {
  return { name, scm: makeScm(name), bky, yail: null }
}

function makeAsset(name: string, content = new Uint8Array([1, 2, 3])): AiaAsset {
  return {
    name,
    type: name.split('.').pop() ?? '',
    sizeBytes: content.length,
    data: async () => content,
  }
}

function makeExtension(packageName: string, version = 1): AiaExtension {
  return {
    packageName,
    version,
    minSdk: 7,
    components: [],
    manifest: { packageName, version, minSdk: 7, buildVersion: '1', permissions: [] },
    loadClasses: async () => new Uint8Array(),
    loadAssets: async () => [],
  }
}

function makeProject(
  screens: string[] = [],
  assets: string[] = [],
  extensions: string[] = [],
): AiaProject {
  return {
    _tag: 'AiaProject',
    name: 'Test',
    properties: makeProjectProperties(),
    screens: screens.map(name => makeScreen(name)),
    assets: assets.map(name => makeAsset(name)),
    extensions: extensions.map(packageName => makeExtension(packageName)),
  }
}

describe('AIA screen mutations', () => {
  it('adds, removes, and clones screens from the AIA domain', () => {
    const added = addScreen(makeProject(['Screen1']), makeScreen('Screen2'))
    expect(added.diagnostics).toEqual([])
    expect(added.project.screens.map(screen => screen.name)).toEqual(['Screen1', 'Screen2'])

    const removed = removeScreen(added.project, 'Screen1')
    expect(removed.diagnostics).toEqual([])
    expect(removed.project.screens.map(screen => screen.name)).toEqual(['Screen2'])

    const cloned = cloneScreen(removed.project, 'Screen2', 'Screen3')
    expect(cloned.diagnostics).toEqual([])
    expect(cloned.project.screens.map(screen => screen.name)).toEqual(['Screen2', 'Screen3'])
    expect(parseScm(cloned.project.screens[1].scm).name).toBe('Screen3')
    expect(cloned.project.screens[1].yail).toBeNull()
  })

  it('reports screen conflicts and missing screens', () => {
    const project = makeProject(['Screen1', 'Screen2'])

    expect(addScreen(project, makeScreen('Screen1')).diagnostics[0].code).toBe('DUPLICATE_COMPONENT_NAME')
    expect(removeScreen(project, 'Missing').diagnostics[0].code).toBe('MISSING_SCREEN_FILE')
    expect(cloneScreen(project, 'Missing', 'Screen3').diagnostics[0].code).toBe('MISSING_SCREEN_FILE')
    expect(cloneScreen(project, 'Screen1', 'Screen2').diagnostics[0].code).toBe('DUPLICATE_COMPONENT_NAME')
  })
})

describe('AIA asset mutations', () => {
  it('adds and removes assets from the AIA domain', () => {
    const added = addAsset(makeProject(), makeAsset('icon.png'))
    expect(added.diagnostics).toEqual([])
    expect(added.project.assets.map(asset => asset.name)).toEqual(['icon.png'])

    const removed = removeAsset(added.project, 'icon.png')
    expect(removed.diagnostics).toEqual([])
    expect(removed.project.assets).toEqual([])
  })

  it('reports duplicate and missing assets', () => {
    const project = { ...makeProject(), assets: [makeAsset('icon.png')] }

    expect(addAsset(project, makeAsset('icon.png')).diagnostics[0].code).toBe('DUPLICATE_COMPONENT_NAME')
    expect(removeAsset(project, 'missing.png').diagnostics[0].code).toBe('MISSING_ASSET_REF')
  })
})

describe('AIA extension mutations', () => {
  it('adds and removes extensions from the AIA domain', () => {
    const added = addExtension(makeProject(), makeExtension('com.example.Foo'))
    expect(added.diagnostics).toEqual([])
    expect(added.project.extensions.map(extension => extension.packageName)).toEqual(['com.example.Foo'])

    const removed = removeExtension(added.project, 'com.example.Foo')
    expect(removed.diagnostics).toEqual([])
    expect(removed.project.extensions).toEqual([])
  })

  it('reports duplicate and missing extensions', () => {
    const project = { ...makeProject(), extensions: [makeExtension('com.example.Foo')] }

    expect(addExtension(project, makeExtension('com.example.Foo', 2)).diagnostics[0].code).toBe('VERSION_MISMATCH')
    expect(removeExtension(project, 'com.example.Missing').diagnostics[0].code).toBe('VERSION_MISMATCH')
  })
})

describe('AIA project merge', () => {
  it('adds non-conflicting archive entries', () => {
    const result = mergeProjects(
      makeProject(['Screen1'], ['a.png'], ['com.a.A']),
      makeProject(['Screen2'], ['b.png'], ['com.b.B']),
      { screenConflict: 'skip', assetConflict: 'skip', includeExtensions: true },
    )

    expect(result.diagnostics).toEqual([])
    expect(result.project.screens.map(screen => screen.name)).toEqual(['Screen1', 'Screen2'])
    expect(result.project.assets.map(asset => asset.name)).toEqual(['a.png', 'b.png'])
    expect(result.project.extensions.map(extension => extension.packageName)).toEqual(['com.a.A', 'com.b.B'])
  })

  it('skips, overwrites, and renames conflicting screens', () => {
    const skipped = mergeProjects(
      makeProject(['Screen1']),
      makeProject(['Screen1', 'Screen2']),
      { screenConflict: 'skip', assetConflict: 'skip', includeExtensions: false },
    )
    expect(skipped.project.screens.map(screen => screen.name)).toEqual(['Screen1', 'Screen2'])

    const source = makeProject(['Screen1'])
    source.screens[0] = { ...source.screens[0], bky: '<xml>updated</xml>' }
    const overwritten = mergeProjects(
      makeProject(['Screen1']),
      source,
      { screenConflict: 'overwrite', assetConflict: 'skip', includeExtensions: false },
    )
    expect(overwritten.project.screens[0].bky).toBe('<xml>updated</xml>')

    const renamedSource = makeProject(['Screen1'])
    renamedSource.screens[0] = { ...renamedSource.screens[0], yail: 'existing yail' }
    const renamed = mergeProjects(
      makeProject(['Screen1', 'Screen1_2']),
      renamedSource,
      { screenConflict: 'rename', assetConflict: 'skip', includeExtensions: false },
    )
    expect(renamed.project.screens.map(screen => screen.name)).toContain('Screen1_3')
    const renamedScreen = renamed.project.screens.find(screen => screen.name === 'Screen1_3')
    expect(renamedScreen).toBeDefined()
    expect(parseScm(renamedScreen!.scm).name).toBe('Screen1_3')
    expect(renamedScreen!.yail).toBeNull()
  })

  it('skips and overwrites conflicting assets', () => {
    const skipped = mergeProjects(
      makeProject([], ['a.png']),
      makeProject([], ['a.png']),
      { screenConflict: 'skip', assetConflict: 'skip', includeExtensions: false },
    )
    expect(skipped.project.assets).toHaveLength(1)

    const replacement = makeAsset('a.png', new Uint8Array([9, 9, 9, 9]))
    const overwritten = mergeProjects(
      { ...makeProject(), assets: [makeAsset('a.png')] },
      { ...makeProject(), assets: [replacement] },
      { screenConflict: 'skip', assetConflict: 'overwrite', includeExtensions: false },
    )
    expect(overwritten.project.assets[0]).toBe(replacement)
  })

  it('skips duplicate extensions and omits extensions when requested', () => {
    const merged = mergeProjects(
      makeProject([], [], ['com.a.A']),
      makeProject([], [], ['com.a.A', 'com.b.B']),
      { screenConflict: 'skip', assetConflict: 'skip', includeExtensions: true },
    )
    expect(merged.project.extensions.map(extension => extension.packageName)).toEqual(['com.a.A', 'com.b.B'])

    const omitted = mergeProjects(
      makeProject(),
      makeProject([], [], ['com.b.B']),
      { screenConflict: 'skip', assetConflict: 'skip', includeExtensions: false },
    )
    expect(omitted.project.extensions).toHaveLength(0)
  })
})
