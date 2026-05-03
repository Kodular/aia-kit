import {
  Platform as PlatformValue,
  createEnvironment,
  getEnvironmentFor,
} from '#/environment.js'
import type {
  CreateEnvironmentInput,
  Environment,
  EnvironmentMeta,
  Platform as PlatformType,
} from '#/environment.js'

// Raw layer types
export type {
  AiaProject, AiaScreen, AiaAsset, AiaExtension,
  AixManifest, AixAsset, AiaComponent, MutationResult,
  ProjectProperties,
} from '#/core/types.js'

// Descriptor types
export type {
  ComponentDescriptor, ComponentPropertyDescriptor,
  ComponentBlockPropertyDescriptor, ComponentEventDescriptor,
  ComponentMethodDescriptor, ComponentDescriptorParam,
} from '#/core/descriptors.js'

// Model layer types
export type { ModelProject, ModelScreen, ModelComponent, ComponentProperty } from '#/core/model.js'

// Diagnostics
export type { Diagnostic, DiagnosticSeverity, DiagnosticCode } from '#/core/diagnostics.js'
export { mergeReports } from '#/core/diagnostics.js'

// Errors
export {
  AiaKitError,
  AiaParseError,
  AiaZipError,
  AiaStructureError,
  AiaWriteError,
  EnvironmentConstructionError,
} from '#/core/errors.js'

// Registries
export {
  BuiltinBlockRegistry,
  ComponentRegistry,
  DEFAULT_BUILTINS,
  MutableComponentRegistry,
  defaultBlockRegistry,
} from '#/core/registries.js'
export type {
  BuiltinBlockDescriptor,
  BuiltinBlockCategory,
} from '#/core/registries.js'

// Environment
export const Platform = PlatformValue
export { createEnvironment, getEnvironmentFor }
export type {
  CreateEnvironmentInput,
  Environment,
  EnvironmentMeta,
}
export type Platform = PlatformType

// Pipeline
export { parseAia, parseAix, parseAndResolve, parseProjectProperties } from '#/parse.js'
export { buildModel } from '#/model.js'
export { resolve } from '#/resolve.js'
export { writeAia, serializeProperties } from '#/write.js'

// YAIL generation
export { createYailGenerator } from '#/yail/index.js'

export type { BlockAst, BlockNode } from '#/blocks/ast.js'

// Component tree utilities
export { findComponentByUid, getComponentsByType, getParentComponent, getComponentPathByUid } from '#/components/tree.js'

// Structural mutations
export { addScreen, removeScreen, cloneScreen } from '#/mutations/screens.js'
export { addComponent, removeComponent, updatePropertyWhere } from '#/mutations/components.js'
export { addAsset, removeAsset } from '#/mutations/assets.js'
export { addExtension, removeExtension } from '#/mutations/extensions.js'
export { mergeProjects } from '#/mutations/projects.js'
export type { MergeOptions } from '#/mutations/projects.js'

// Analysis
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
