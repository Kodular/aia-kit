import { parseScm } from '#/scm/parse.js'
import { serializeScm } from '#/scm/serialize.js'
import type { AiaProject, MutationResult } from '#/types.js'
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
  const screens = [...target.screens]
  const assets = [...target.assets]
  const extensions = [...target.extensions]

  for (const screen of source.screens) {
    const existingIdx = screens.findIndex(existing => existing.name === screen.name)
    if (existingIdx === -1) {
      screens.push(screen)
      continue
    }

    if (options.screenConflict === 'overwrite') {
      screens[existingIdx] = screen
    } else if (options.screenConflict === 'rename') {
      const uniqueName = findUniqueName(screen.name, screens.map(existing => existing.name))
      const root = parseScm(screen.scm)
      screens.push({
        ...screen,
        name: uniqueName,
        scm: serializeScm({ ...root, name: uniqueName }, screen.scm),
        yail: null,
      })
    }
  }

  for (const asset of source.assets) {
    const existingIdx = assets.findIndex(existing => existing.name === asset.name)
    if (existingIdx === -1) {
      assets.push(asset)
      continue
    }

    if (options.assetConflict === 'overwrite') {
      assets[existingIdx] = asset
    }
  }

  if (options.includeExtensions) {
    for (const extension of source.extensions) {
      if (!extensions.some(existing => existing.packageName === extension.packageName)) {
        extensions.push(extension)
      }
    }
  }

  return {
    project: { ...target, screens, assets, extensions },
    diagnostics: [],
  }
}
