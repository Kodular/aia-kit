import type { AiaAsset, AiaProject, MutationResult } from '#/types.js'
import { duplicateName, missingAssetRef } from './mutation-diagnostics.js'

export function addAsset(project: AiaProject, asset: AiaAsset): MutationResult {
  if (project.assets.some(existing => existing.name === asset.name)) {
    return {
      project,
      diagnostics: [duplicateName(['assets', asset.name], `Asset "${asset.name}" already exists`)],
    }
  }

  return {
    project: { ...project, assets: [...project.assets, asset] },
    diagnostics: [],
  }
}

export function removeAsset(project: AiaProject, assetName: string): MutationResult {
  if (!project.assets.some(asset => asset.name === assetName)) {
    return {
      project,
      diagnostics: [missingAssetRef(assetName)],
    }
  }

  return {
    project: {
      ...project,
      assets: project.assets.filter(asset => asset.name !== assetName),
    },
    diagnostics: [],
  }
}
