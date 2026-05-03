import { parseScm } from '#/components/scm-parser.js'
import { serializeScm } from '#/components/scm-serializer.js'
import type { AiaProject, AiaScreen, AiaExtension, MutationResult } from '#/core/types.js'
import { findUniqueName } from '#/utils/naming.js'

export interface MergeOptions {
  screenConflict: 'skip' | 'overwrite' | 'rename'
  assetConflict: 'skip' | 'overwrite'
  includeExtensions: boolean
}

export function mergeProjects(
  target: AiaProject,
  source: AiaProject,
  options: MergeOptions,
): MutationResult {
  let screens = [...target.screens]
  let assets = [...target.assets]
  let extensions = [...target.extensions]

  for (const screen of source.screens) {
    const existingIdx = screens.findIndex(s => s.name === screen.name)
    if (existingIdx !== -1) {
      if (options.screenConflict === 'overwrite') {
        screens[existingIdx] = screen
      } else if (options.screenConflict === 'rename') {
        const uniqueName = findUniqueName(screen.name, screens.map(s => s.name))
        const root = parseScm(screen.scm)
        const newScm = serializeScm({ ...root, name: uniqueName }, screen.scm)
        screens.push({ ...screen, name: uniqueName, scm: newScm })
      }
      // 'skip' — do nothing
    } else {
      screens.push(screen)
    }
  }

  for (const asset of source.assets) {
    const existingIdx = assets.findIndex(a => a.name === asset.name)
    if (existingIdx !== -1) {
      if (options.assetConflict === 'overwrite') {
        assets[existingIdx] = asset
      }
      // 'skip' — do nothing
    } else {
      assets.push(asset)
    }
  }

  if (options.includeExtensions) {
    for (const ext of source.extensions) {
      if (!extensions.some(e => e.packageName === ext.packageName)) {
        extensions.push(ext)
      }
    }
  }

  return {
    project: { ...target, screens, assets, extensions },
    diagnostics: [],
  }
}
