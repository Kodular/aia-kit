import type { BlockAst, BlockNode } from '#/bky/ast.js'
import type { BlockSummary, VariableReport } from './types.js'

export function exportBlockSummary(ast: BlockAst): BlockSummary {
  let total = 0
  const blocksByType: Record<string, number> = {}
  const walk = (n: BlockNode) => {
    total++
    blocksByType[n.type] = (blocksByType[n.type] ?? 0) + 1
    for (const v of Object.values(n.values)) if (v) walk(v)
    for (const s of Object.values(n.statements)) if (s) walk(s)
    if (n.next) walk(n.next)
  }
  for (const b of ast.blocks) walk(b)
  return { topLevelCount: ast.blocks.length, totalBlocks: total, blocksByType }
}

export function analyzeVariables(ast: BlockAst): VariableReport {
  const declared = new Set<string>()
  const referenced = new Set<string>()
  const considerDecl = (t: string) =>
    t === 'global_declaration' ||
    t === 'local_declaration_statement' ||
    t === 'local_declaration_expression' ||
    t === 'procedures_defnoreturn' ||
    t === 'procedures_defreturn'
  const walk = (n: BlockNode) => {
    if (considerDecl(n.type)) {
      const nm = n.fields['NAME'] ?? n.fields['VAR']
      if (nm) declared.add(nm)
    }
    if (n.type === 'lexical_variable_get' || n.type === 'lexical_variable_set') {
      const v = n.fields['VAR']
      if (v) referenced.add(v)
    }
    for (const v of Object.values(n.values)) if (v) walk(v)
    for (const s of Object.values(n.statements)) if (s) walk(s)
    if (n.next) walk(n.next)
  }
  for (const b of ast.blocks) walk(b)
  return {
    declared: [...declared].sort((a, b) => a.localeCompare(b)),
    referenced: [...referenced].sort((a, b) => a.localeCompare(b)),
  }
}
