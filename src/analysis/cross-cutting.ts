import { parseBky } from '#/bky/parse.js'
import type { BlockAst, BlockNode } from '#/bky/ast.js'
import type {
  ComplexityReport,
  DeadBlock,
  NavGraph,
  ScreenComplexity,
} from './types.js'
import type { ModelProject } from '#/model/types.js'
import { isEventHandlerBlock } from '#/utils/block-types.js'

function forEachBlock(
  node: BlockNode | null,
  visit: (n: BlockNode) => void,
): void {
  if (!node) return
  visit(node)
  for (const child of Object.values(node.values)) {
    forEachBlock(child, visit)
  }
  for (const child of Object.values(node.statements)) {
    forEachBlock(child, visit)
  }
  forEachBlock(node.next, visit)
}

function countTotalBlocks(blocks: BlockNode[]): number {
  let n = 0
  for (const root of blocks) {
    forEachBlock(root, () => {
      n += 1
    })
  }
  return n
}

/** Depth along value/statement nesting only; `next` chains do not add depth. */
function subtreeDepth(node: BlockNode): number {
  let maxChild = 0
  for (const child of Object.values(node.values)) {
    maxChild = Math.max(maxChild, subtreeDepth(child))
  }
  for (const child of Object.values(node.statements)) {
    maxChild = Math.max(maxChild, subtreeDepth(child))
  }
  return 1 + maxChild
}

function screenMaxDepth(blocks: BlockNode[]): number {
  if (blocks.length === 0) return 0
  return Math.max(...blocks.map(subtreeDepth))
}

function isHatBlock(node: BlockNode): boolean {
  return isEventHandlerBlock(node.type)
}

function buildIdTypeMap(blocks: BlockNode[]): Map<string, string> {
  const map = new Map<string, string>()
  for (const root of blocks) {
    forEachBlock(root, n => {
      if (n.id) map.set(n.id, n.type)
    })
  }
  return map
}

function collectAllIds(blocks: BlockNode[]): Set<string> {
  const ids = new Set<string>()
  for (const root of blocks) {
    forEachBlock(root, n => {
      if (n.id) ids.add(n.id)
    })
  }
  return ids
}

function markReachableFrom(node: BlockNode | null, reachable: Set<string>): void {
  if (!node) return
  if (node.id) reachable.add(node.id)
  for (const child of Object.values(node.values)) {
    markReachableFrom(child, reachable)
  }
  for (const child of Object.values(node.statements)) {
    markReachableFrom(child, reachable)
  }
  markReachableFrom(node.next, reachable)
}

/** When BKY is invalid XML, behave like an empty workspace (no throw). */
function safeParseBky(bky: string): BlockAst {
  try {
    return parseBky(bky)
  } catch {
    return { blocks: [] }
  }
}

function parseScreenAst(model: ModelProject) {
  return model.screens.map(s => ({
    name: s.name,
    ast: safeParseBky(s.source.bky),
  }))
}

export function analyzeComplexity(model: ModelProject): ComplexityReport {
  const screens: ScreenComplexity[] = parseScreenAst(model).map(
    ({ name, ast }) => ({
      screenName: name,
      topLevelBlocks: ast.blocks.length,
      totalBlocks: countTotalBlocks(ast.blocks),
      maxDepth: screenMaxDepth(ast.blocks),
    }),
  )
  return { screens }
}

export function findDeadBlocks(model: ModelProject): DeadBlock[] {
  const dead: DeadBlock[] = []

  for (const { name, ast } of parseScreenAst(model)) {
    const allIds = collectAllIds(ast.blocks)
    const reachable = new Set<string>()
    const idType = buildIdTypeMap(ast.blocks)

    for (const top of ast.blocks) {
      if (!isHatBlock(top)) continue
      markReachableFrom(top, reachable)
    }

    const deadIds = [...allIds].filter(id => !reachable.has(id))
    deadIds.sort()
    for (const blockId of deadIds) {
      dead.push({
        screenName: name,
        blockId,
        blockType: idType.get(blockId) ?? '',
      })
    }
  }

  return dead
}

function looksLikeNavTarget(raw: string | undefined): string | null {
  if (raw === undefined) return null
  const t = raw.trim()
  return t.length > 0 ? t : null
}

function extractOpenAnotherScreenTarget(block: BlockNode): string | null {
  const f = block.fields
  let t = looksLikeNavTarget(f.SCREEN ?? f.SCREENNAME)
  if (t) return t
  for (const v of Object.values(f)) {
    t = looksLikeNavTarget(v)
    if (t) return t
  }
  return null
}

export function buildNavGraph(model: ModelProject): NavGraph {
  const edgeKey = (e: { from: string; to: string }) => `${e.from}\0${e.to}`
  const edgeKeys = new Set<string>()
  const edges: Array<{ from: string; to: string }> = []

  for (const screen of model.screens) {
    const ast = safeParseBky(screen.source.bky)
    for (const root of ast.blocks) {
      forEachBlock(root, node => {
        if (!node.type.toLowerCase().includes('openanotherscreen')) return
        const to = extractOpenAnotherScreenTarget(node)
        if (!to) return
        const e = { from: screen.name, to }
        const k = edgeKey(e)
        if (edgeKeys.has(k)) return
        edgeKeys.add(k)
        edges.push(e)
      })
    }
  }

  const nodeSet = new Set<string>()
  for (const s of model.screens) nodeSet.add(s.name)
  for (const { to } of edges) nodeSet.add(to)

  const nodes = [...nodeSet].sort()

  edges.sort((a, b) => {
    const cFrom = a.from.localeCompare(b.from)
    return cFrom !== 0 ? cFrom : a.to.localeCompare(b.to)
  })

  return { nodes, edges }
}
