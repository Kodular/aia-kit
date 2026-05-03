export { diffProjects } from './project-diff.js'
export { diagnose } from './diagnose.js'
export { findUnusedExtensions, findUnusedAssets, findAssetReferences } from './unused.js'
export { analyzeVariables, exportBlockSummary } from './block-reports.js'
export { analyzeComplexity, findDeadBlocks, buildNavGraph } from './cross-cutting.js'

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
} from './types.js'
