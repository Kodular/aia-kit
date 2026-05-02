import type { AiaProject, AiaAsset, MutationResult } from '#/core/types.js'

export function addAsset(project: AiaProject, asset: AiaAsset): MutationResult {
  if (project.assets.some(a => a.name === asset.name)) {
    return {
      project,
      diagnostics: [{
        code: 'DUPLICATE_COMPONENT_NAME',
        severity: 'error',
        path: ['assets', asset.name],
        message: `Asset "${asset.name}" already exists`,
      }],
    }
  }
  return {
    project: { ...project, assets: [...project.assets, asset] },
    diagnostics: [],
  }
}

export function removeAsset(project: AiaProject, assetName: string): MutationResult {
  const idx = project.assets.findIndex(a => a.name === assetName)
  if (idx === -1) {
    return {
      project,
      diagnostics: [{
        code: 'MISSING_ASSET_REF',
        severity: 'error',
        path: ['assets', assetName],
        message: `Asset "${assetName}" not found`,
      }],
    }
  }
  return {
    project: { ...project, assets: project.assets.filter(a => a.name !== assetName) },
    diagnostics: [],
  }
}
