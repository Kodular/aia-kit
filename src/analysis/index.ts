export { diffProjects } from '#/analysis/project-diff.js'
export { diagnose } from '#/analysis/diagnose.js'
export { findUnusedExtensions, findUnusedAssets, findAssetReferences } from '#/analysis/unused.js'
export { analyzeVariables, exportBlockSummary } from '#/analysis/block-reports.js'
export { analyzeComplexity, findDeadBlocks, buildNavGraph } from '#/analysis/cross-cutting.js'

export type {
  ProjectDiff,
  VariableReport,
  BlockSummary,
  ScreenComplexity,
  ComplexityReport,
  DeadBlock,
  NavEdge,
  NavGraph,
  AssetReference,
  AssetReferenceKind,
} from '#/analysis/types.js'
