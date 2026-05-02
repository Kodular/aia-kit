// test/mutations/extensions.test.ts
import { describe, it, expect } from 'vitest'
import { addExtension, removeExtension } from '#/mutations/extensions.js'
import type { AiaProject, AiaExtension } from '#/core/types.js'
import { makeProjectProperties } from '../helpers.js'

function makeProject(): AiaProject {
  return { _tag: 'AiaProject', name: 'Test', properties: makeProjectProperties(), screens: [], assets: [], extensions: [] }
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

describe('addExtension', () => {
  it('appends a new extension', () => {
    const project = makeProject()
    const result = addExtension(project, makeExtension('com.example.Foo'))
    expect(result.diagnostics).toEqual([])
    expect(result.project.extensions).toHaveLength(1)
    expect(result.project.extensions[0].packageName).toBe('com.example.Foo')
  })

  it('emits VERSION_MISMATCH when packageName already exists', () => {
    const project = { ...makeProject(), extensions: [makeExtension('com.example.Foo')] }
    const result = addExtension(project, makeExtension('com.example.Foo', 2))
    expect(result.diagnostics[0].code).toBe('VERSION_MISMATCH')
    expect(result.project.extensions).toHaveLength(1)
  })

  it('does not mutate the original project', () => {
    const project = makeProject()
    addExtension(project, makeExtension('com.example.Foo'))
    expect(project.extensions).toHaveLength(0)
  })
})

describe('removeExtension', () => {
  it('removes an existing extension', () => {
    const project = { ...makeProject(), extensions: [makeExtension('com.example.Foo'), makeExtension('com.example.Bar')] }
    const result = removeExtension(project, 'com.example.Foo')
    expect(result.diagnostics).toEqual([])
    expect(result.project.extensions).toHaveLength(1)
    expect(result.project.extensions[0].packageName).toBe('com.example.Bar')
  })

  it('emits VERSION_MISMATCH for unknown package name', () => {
    const project = makeProject()
    const result = removeExtension(project, 'com.example.Missing')
    expect(result.diagnostics[0].code).toBe('VERSION_MISMATCH')
  })
})
