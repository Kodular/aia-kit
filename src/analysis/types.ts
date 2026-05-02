/**
 * Structured diff between two raw projects (screen names and registry sets).
 */
export interface ProjectDiff {
  screensOnlyInA: string[]
  screensOnlyInB: string[]
  /** Screens whose name exists in both projects but content differs. */
  screensDiffering: Array<{ name: string; scm: boolean; bky: boolean }>
  assetsOnlyInA: string[]
  assetsOnlyInB: string[]
  /** Same asset name in both but `type` or `sizeBytes` differs. */
  assetsDiffering: string[]
  extensionsOnlyInA: string[]
  extensionsOnlyInB: string[]
}

export interface VariableReport {
  /** Names from declaration-style blocks (globals, locals, procedures). */
  declared: string[]
  /** Names from lexical variable get/set. */
  referenced: string[]
}

export interface BlockSummary {
  topLevelCount: number
  totalBlocks: number
  blocksByType: Record<string, number>
}

export interface ScreenComplexity {
  screenName: string
  topLevelBlocks: number
  totalBlocks: number
  maxDepth: number
}

export interface ComplexityReport {
  screens: ScreenComplexity[]
}

export interface DeadBlock {
  screenName: string
  blockId: string
  blockType: string
}

export interface NavEdge {
  from: string
  to: string
}

export interface NavGraph {
  nodes: string[]
  edges: NavEdge[]
}

export type AssetReferenceKind = 'property' | 'block_xml'

export interface AssetReference {
  assetName: string
  kind: AssetReferenceKind
  path: string[]
}
