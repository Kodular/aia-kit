// test/mutations/projects.test.ts
import { describe, it, expect } from 'vitest'
import { mergeProjects } from '#/mutations/projects.js'
import { parseScm } from '#/components/scm-parser.js'
import type { AiaProject, AiaScreen, AiaAsset, AiaExtension } from '#/core/types.js'
import { makeProjectProperties } from '../helpers.js'

const EMPTY_BKY = `<xml xmlns="https://developers.google.com/blockly/xml"></xml>`

function makeSCM(screenName: string): string {
  return `#|\n$JSON\n{"authURL":["aia-kit"],"YaVersion":"1","Source":"Form","Properties":{"$Name":"${screenName}","$Type":"Form","Uuid":"-1","Title":"${screenName}","$Components":[]}}\n|#`
}

function makeScreen(name: string): AiaScreen {
  return { name, scm: makeSCM(name), bky: EMPTY_BKY, yail: null }
}

function makeAsset(name: string): AiaAsset {
  return { name, type: 'png', sizeBytes: 3, data: async () => new Uint8Array([1, 2, 3]) }
}

function makeExtension(packageName: string): AiaExtension {
  return {
    packageName, version: 1, minSdk: 7, components: [],
    manifest: { packageName, version: 1, minSdk: 7, buildVersion: '1', permissions: [] },
    loadClasses: async () => new Uint8Array(),
    loadAssets: async () => [],
  }
}

function makeProject(screens: string[], assets: string[] = [], extensions: string[] = []): AiaProject {
  return {
    _tag: 'AiaProject', name: 'Test', properties: makeProjectProperties(),
    screens: screens.map(makeScreen),
    assets: assets.map(makeAsset),
    extensions: extensions.map(makeExtension),
  }
}

describe('mergeProjects — screens', () => {
  it('adds non-conflicting screens from source', () => {
    const target = makeProject(['Screen1'])
    const source = makeProject(['Screen2'])
    const result = mergeProjects(target, source, { screenConflict: 'skip', assetConflict: 'skip', includeExtensions: false })
    expect(result.diagnostics).toEqual([])
    expect(result.project.screens.map(s => s.name)).toEqual(['Screen1', 'Screen2'])
  })

  it('skip — ignores conflicting screens', () => {
    const target = makeProject(['Screen1'])
    const source = makeProject(['Screen1', 'Screen2'])
    const result = mergeProjects(target, source, { screenConflict: 'skip', assetConflict: 'skip', includeExtensions: false })
    expect(result.project.screens).toHaveLength(2)
    expect(result.project.screens.map(s => s.name)).toContain('Screen2')
  })

  it('overwrite — replaces conflicting screens', () => {
    const target = makeProject(['Screen1'])
    const source = makeProject(['Screen1'])
    source.screens[0] = { ...source.screens[0], bky: '<xml>updated</xml>' }
    const result = mergeProjects(target, source, { screenConflict: 'overwrite', assetConflict: 'skip', includeExtensions: false })
    expect(result.project.screens).toHaveLength(1)
    expect(result.project.screens[0].bky).toBe('<xml>updated</xml>')
  })

  it('rename — appends _2 to avoid conflict', () => {
    const target = makeProject(['Screen1'])
    const source = makeProject(['Screen1'])
    const result = mergeProjects(target, source, { screenConflict: 'rename', assetConflict: 'skip', includeExtensions: false })
    expect(result.project.screens).toHaveLength(2)
    expect(result.project.screens[1].name).toBe('Screen1_2')
    const root = parseScm(result.project.screens[1].scm)
    expect(root.name).toBe('Screen1_2')
  })

  it('rename — increments suffix until unique', () => {
    const target = makeProject(['Screen1', 'Screen1_2'])
    const source = makeProject(['Screen1'])
    const result = mergeProjects(target, source, { screenConflict: 'rename', assetConflict: 'skip', includeExtensions: false })
    expect(result.project.screens.map(s => s.name)).toContain('Screen1_3')
  })
})

describe('mergeProjects — assets', () => {
  it('adds non-conflicting assets', () => {
    const target = makeProject([], ['a.png'])
    const source = makeProject([], ['b.png'])
    const result = mergeProjects(target, source, { screenConflict: 'skip', assetConflict: 'skip', includeExtensions: false })
    expect(result.project.assets.map(a => a.name)).toEqual(['a.png', 'b.png'])
  })

  it('skip — ignores conflicting assets', () => {
    const target = makeProject([], ['a.png'])
    const source = makeProject([], ['a.png'])
    const result = mergeProjects(target, source, { screenConflict: 'skip', assetConflict: 'skip', includeExtensions: false })
    expect(result.project.assets).toHaveLength(1)
  })

  it('overwrite — replaces conflicting assets', () => {
    const newContent = new Uint8Array([9, 9, 9])
    const target = makeProject([], ['a.png'])
    const source: AiaProject = {
      ...makeProject([], []),
      assets: [{ name: 'a.png', type: 'png', sizeBytes: 3, data: async () => newContent }],
    }
    const result = mergeProjects(target, source, { screenConflict: 'skip', assetConflict: 'overwrite', includeExtensions: false })
    expect(result.project.assets).toHaveLength(1)
    expect(result.project.assets[0].sizeBytes).toBe(3)
  })
})

describe('mergeProjects — extensions', () => {
  it('merges extensions when includeExtensions is true', () => {
    const target = makeProject([], [], ['com.a.A'])
    const source = makeProject([], [], ['com.b.B'])
    const result = mergeProjects(target, source, { screenConflict: 'skip', assetConflict: 'skip', includeExtensions: true })
    expect(result.project.extensions.map(e => e.packageName)).toEqual(['com.a.A', 'com.b.B'])
  })

  it('skips duplicate extensions by packageName', () => {
    const target = makeProject([], [], ['com.a.A'])
    const source = makeProject([], [], ['com.a.A'])
    const result = mergeProjects(target, source, { screenConflict: 'skip', assetConflict: 'skip', includeExtensions: true })
    expect(result.project.extensions).toHaveLength(1)
  })

  it('does not merge extensions when includeExtensions is false', () => {
    const target = makeProject([], [], [])
    const source = makeProject([], [], ['com.b.B'])
    const result = mergeProjects(target, source, { screenConflict: 'skip', assetConflict: 'skip', includeExtensions: false })
    expect(result.project.extensions).toHaveLength(0)
  })
})
