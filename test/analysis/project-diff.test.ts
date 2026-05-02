import { describe, it, expect } from 'vitest'
import { diffProjects } from '#/analysis/project-diff.js'
import type { AiaProject, AiaScreen } from '#/core/types.js'
import { makeProjectProperties } from '../helpers.js'

function screen(n: string, scm = '', bky = ''): AiaScreen {
  return { name: n, scm, bky, yail: null }
}

function proj(screens: AiaScreen[], assets: { name: string; type: string; sizeBytes: number }[] = [], extPkgs: string[] = []): AiaProject {
  return {
    _tag: 'AiaProject',
    name: 'P',
    properties: makeProjectProperties(),
    screens,
    assets: assets.map(a => ({
      ...a,
      data: async () => new Uint8Array(),
    })),
    extensions: extPkgs.map(pkg => ({
      packageName: pkg,
      version: 1,
      minSdk: 7,
      components: [],
      manifest: { packageName: pkg, version: 1, minSdk: 7, buildVersion: '1', permissions: [] },
      loadClasses: async () => new Uint8Array(),
      loadAssets: async () => [],
    })),
  }
}

describe('diffProjects', () => {
  it('detects screens only in A or B', () => {
    const a = proj([screen('S1')])
    const b = proj([screen('S2')])
    const d = diffProjects(a, b)
    expect(d.screensOnlyInA).toEqual(['S1'])
    expect(d.screensOnlyInB).toEqual(['S2'])
    expect(d.screensDiffering).toEqual([])
  })

  it('detects scm/bky differences for shared screen names', () => {
    const a = proj([screen('S1', 'a', 'x')])
    const b = proj([screen('S1', 'b', 'x')])
    expect(diffProjects(a, b).screensDiffering).toEqual([{ name: 'S1', scm: true, bky: false }])
    const a2 = proj([screen('S1', 'x', 'bky1')])
    const b2 = proj([screen('S1', 'x', 'bky2')])
    expect(diffProjects(a2, b2).screensDiffering).toEqual([{ name: 'S1', scm: false, bky: true }])
  })

  it('classifies asset and extension name sets', () => {
    const a = proj([screen('S1')], [{ name: 'f.png', type: 'png', sizeBytes: 1 }], ['pkg.a'])
    const b = proj([screen('S1')], [{ name: 'g.png', type: 'png', sizeBytes: 1 }], ['pkg.b'])
    const d = diffProjects(a, b)
    expect(d.assetsOnlyInA).toContain('f.png')
    expect(d.assetsOnlyInB).toContain('g.png')
    expect(d.extensionsOnlyInA).toEqual(['pkg.a'])
    expect(d.extensionsOnlyInB).toEqual(['pkg.b'])
  })

  it('flags assetsDiffering when name matches but size or type differs', () => {
    const a = proj([screen('S1')], [{ name: 'f.png', type: 'png', sizeBytes: 1 }])
    const b = proj([screen('S1')], [{ name: 'f.png', type: 'jpg', sizeBytes: 1 }])
    expect(diffProjects(a, b).assetsDiffering).toEqual(['f.png'])
  })
})
