import { parseScm } from '#/scm/parse.js'
import type { AiaAsset, AiaComponent, AiaExtension } from '#/types.js'
import type { AssetReference } from './types.js'
import type { ModelComponent, ModelProject } from '#/model/types.js'

function collectComponentTypes(root: AiaComponent, out: Set<string>): void {
  out.add(root.type)
  for (const c of root.children) collectComponentTypes(c, out)
}

export function findUnusedExtensions(model: ModelProject): AiaExtension[] {
  const used = new Set<string>()
  for (const screen of model.screens) {
    try {
      const root = parseScm(screen.source.scm)
      collectComponentTypes(root, used)
    } catch {
      /* errors already surfaced via model diagnostics */
    }
  }
  return model.source.extensions.filter(ext => !ext.components.some(c => used.has(c.type)))
}

export function findUnusedAssets(model: ModelProject): AiaAsset[] {
  const blobs: string[] = []
  for (const s of model.source.screens) {
    blobs.push(s.scm, s.bky)
  }
  for (const v of Object.values(model.source.properties)) {
    blobs.push(v)
  }
  const joined = blobs.join('\n')
  return model.source.assets.filter(a => !joined.includes(a.name))
}

export function findAssetReferences(model: ModelProject): AssetReference[] {
  const refs: AssetReference[] = []
  const seen = new Set<string>()
  for (const screen of model.screens) {
    walkProps(screen.form, ['screens', screen.name], (path, value) => {
      for (const a of model.source.assets) {
        if (value.includes(a.name)) {
          const key = `${a.name}|property|${path.join('/')}`
          if (!seen.has(key)) {
            seen.add(key)
            refs.push({ assetName: a.name, kind: 'property', path })
          }
        }
      }
    })
  }
  for (const s of model.source.screens) {
    for (const a of model.source.assets) {
      if (s.bky.includes(a.name)) {
        const key = `${a.name}|block_xml|${s.name}`
        if (!seen.has(key)) {
          seen.add(key)
          refs.push({ assetName: a.name, kind: 'block_xml', path: ['screens', s.name] })
        }
      }
    }
  }
  return refs.sort(
    (a, b) =>
      a.assetName.localeCompare(b.assetName) ||
      a.kind.localeCompare(b.kind) ||
      a.path.join('/').localeCompare(b.path.join('/')),
  )
}

function walkProps(node: ModelComponent, base: string[], cb: (path: string[], v: string) => void): void {
  for (const p of node.properties) {
    cb([...base, node.name, p.name], p.value)
  }
  for (const c of node.children) {
    walkProps(c, [...base, node.name], cb)
  }
}
