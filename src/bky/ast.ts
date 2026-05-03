export interface BlockNode {
  type: string
  id: string
  x?: number
  y?: number
  disabled?: boolean
  collapsed?: boolean
  fields: Record<string, string>
  values: Record<string, BlockNode>
  statements: Record<string, BlockNode>
  mutation: Record<string, string>
  next: BlockNode | null
}

export interface BlockAst {
  blocks: BlockNode[]
}
