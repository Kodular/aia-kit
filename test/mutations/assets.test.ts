// test/mutations/assets.test.ts
import { describe, it, expect } from 'vitest'
import { addAsset, removeAsset } from '#/mutations/assets.js'
import type { AiaProject, AiaAsset } from '#/core/types.js'
import { makeProjectProperties } from '../helpers.js'

function makeProject(): AiaProject {
  return { _tag: 'AiaProject', name: 'Test', properties: makeProjectProperties(), screens: [], assets: [], extensions: [] }
}

function makeAsset(name: string, content = new Uint8Array([1, 2, 3])): AiaAsset {
  return {
    name,
    type: name.split('.').pop() ?? '',
    sizeBytes: content.length,
    data: async () => content,
  }
}

describe('addAsset', () => {
  it('appends a new asset', () => {
    const project = makeProject()
    const result = addAsset(project, makeAsset('icon.png'))
    expect(result.diagnostics).toEqual([])
    expect(result.project.assets).toHaveLength(1)
    expect(result.project.assets[0].name).toBe('icon.png')
  })

  it('emits DUPLICATE_COMPONENT_NAME when asset name already exists', () => {
    const project = { ...makeProject(), assets: [makeAsset('icon.png')] }
    const result = addAsset(project, makeAsset('icon.png'))
    expect(result.diagnostics[0].code).toBe('DUPLICATE_COMPONENT_NAME')
    expect(result.project.assets).toHaveLength(1)
  })

  it('does not mutate the original project', () => {
    const project = makeProject()
    addAsset(project, makeAsset('icon.png'))
    expect(project.assets).toHaveLength(0)
  })
})

describe('removeAsset', () => {
  it('removes an existing asset', () => {
    const project = { ...makeProject(), assets: [makeAsset('icon.png'), makeAsset('bg.jpg')] }
    const result = removeAsset(project, 'icon.png')
    expect(result.diagnostics).toEqual([])
    expect(result.project.assets).toHaveLength(1)
    expect(result.project.assets[0].name).toBe('bg.jpg')
  })

  it('emits MISSING_ASSET_REF for unknown asset name', () => {
    const project = makeProject()
    const result = removeAsset(project, 'nonexistent.png')
    expect(result.diagnostics[0].code).toBe('MISSING_ASSET_REF')
    expect(result.project.assets).toHaveLength(0)
  })
})
