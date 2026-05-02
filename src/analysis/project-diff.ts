import type { AiaProject } from '#/core/types.js'
import type { ProjectDiff } from '#/analysis/types.js'

export function diffProjects(a: AiaProject, b: AiaProject): ProjectDiff {
  const namesA = new Set(a.screens.map(s => s.name))
  const namesB = new Set(b.screens.map(s => s.name))
  const screensOnlyInA = [...namesA].filter(n => !namesB.has(n)).sort()
  const screensOnlyInB = [...namesB].filter(n => !namesA.has(n)).sort()

  const screensDiffering: ProjectDiff['screensDiffering'] = []
  for (const n of [...namesA].filter(x => namesB.has(x)).sort()) {
    const sa = a.screens.find(s => s.name === n)!
    const sb = b.screens.find(s => s.name === n)!
    const scm = sa.scm !== sb.scm
    const bky = sa.bky !== sb.bky
    if (scm || bky) screensDiffering.push({ name: n, scm, bky })
  }

  const mapA = new Map(a.assets.map(x => [x.name, x]))
  const mapB = new Map(b.assets.map(x => [x.name, x]))
  const assetsOnlyInA = [...mapA.keys()].filter(k => !mapB.has(k)).sort()
  const assetsOnlyInB = [...mapB.keys()].filter(k => !mapA.has(k)).sort()
  const assetsDiffering: string[] = []
  for (const name of [...mapA.keys()].filter(k => mapB.has(k)).sort()) {
    const pa = mapA.get(name)!
    const pb = mapB.get(name)!
    if (pa.sizeBytes !== pb.sizeBytes || pa.type !== pb.type) assetsDiffering.push(name)
  }

  const extA = new Set(a.extensions.map(e => e.packageName))
  const extB = new Set(b.extensions.map(e => e.packageName))
  const extensionsOnlyInA = [...extA].filter(x => !extB.has(x)).sort()
  const extensionsOnlyInB = [...extB].filter(x => !extA.has(x)).sort()

  return {
    screensOnlyInA,
    screensOnlyInB,
    screensDiffering,
    assetsOnlyInA,
    assetsOnlyInB,
    assetsDiffering,
    extensionsOnlyInA,
    extensionsOnlyInB,
  }
}
