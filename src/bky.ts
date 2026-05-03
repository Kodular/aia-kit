import type { BlockAst, BlockNode } from '#/blocks/ast.js'

export { parseBky } from '#/blocks/bky-parser.js'
export { serializeBky } from '#/blocks/bky-serializer.js'
export type { BlockAst, BlockNode } from '#/blocks/ast.js'

type BlockMapper = (block: BlockNode) => BlockNode | null

export function removeDisabledBlocks(ast: BlockAst): BlockAst {
  return {
    blocks: ast.blocks
      .map(block => mapBlock(block, mapped => (mapped.disabled ? null : mapped)))
      .filter((block): block is BlockNode => block !== null),
  }
}

export function renameComponentReferences(ast: BlockAst, fromName: string, toName: string): BlockAst {
  const rename = (value: string) => (value === fromName ? toName : value)

  return {
    blocks: ast.blocks
      .map(block =>
        mapBlock(block, mapped => ({
          ...mapped,
          fields: mapRecordValues(mapped.fields, rename),
          mutation: mapRecordValues(mapped.mutation, rename),
        })),
      )
      .filter((block): block is BlockNode => block !== null),
  }
}

function mapBlock(block: BlockNode, mapper: BlockMapper): BlockNode | null {
  const mapped: BlockNode = {
    ...block,
    fields: { ...block.fields },
    values: mapRecordBlocks(block.values, mapper),
    statements: mapRecordBlocks(block.statements, mapper),
    mutation: { ...block.mutation },
    next: block.next ? mapBlock(block.next, mapper) : null,
  }

  return mapper(mapped)
}

function mapRecordBlocks(blocks: Record<string, BlockNode>, mapper: BlockMapper): Record<string, BlockNode> {
  const mapped: Record<string, BlockNode> = {}
  for (const [name, block] of Object.entries(blocks)) {
    const nextBlock = mapBlock(block, mapper)
    if (nextBlock) mapped[name] = nextBlock
  }
  return mapped
}

function mapRecordValues(values: Record<string, string>, mapper: (value: string) => string): Record<string, string> {
  const mapped: Record<string, string> = {}
  for (const [name, value] of Object.entries(values)) {
    mapped[name] = mapper(value)
  }
  return mapped
}
