import type { BlockAst, BlockNode } from '#/blocks/ast.js'

export function serializeBky(ast: BlockAst): string {
  const parts: string[] = ['<xml xmlns="https://developers.google.com/blockly/xml">']
  for (const block of ast.blocks) {
    parts.push(serializeBlock(block, true))
  }
  parts.push('</xml>')
  return parts.join('\n')
}

function serializeBlock(node: BlockNode, isTop: boolean): string {
  const attrs = [`type="${esc(node.type)}" id="${esc(node.id)}"`]
  if (isTop && node.x !== undefined) attrs.push(`x="${node.x}"`)
  if (isTop && node.y !== undefined) attrs.push(`y="${node.y}"`)
  if (node.disabled) attrs.push('disabled="true"')
  if (node.collapsed) attrs.push('collapsed="true"')

  const children: string[] = []

  if (Object.keys(node.mutation).length > 0) {
    const mutAttrs = Object.entries(node.mutation).map(([k, v]) => `${k}="${esc(v)}"`).join(' ')
    children.push(`<mutation ${mutAttrs}></mutation>`)
  }

  for (const [name, value] of Object.entries(node.fields)) {
    children.push(`<field name="${esc(name)}">${esc(value)}</field>`)
  }

  for (const [name, inner] of Object.entries(node.values)) {
    children.push(`<value name="${esc(name)}">${serializeBlock(inner, false)}</value>`)
  }

  for (const [name, inner] of Object.entries(node.statements)) {
    children.push(`<statement name="${esc(name)}">${serializeBlock(inner, false)}</statement>`)
  }

  if (node.next) {
    children.push(`<next>${serializeBlock(node.next, false)}</next>`)
  }

  return `<block ${attrs.join(' ')}>${children.join('')}</block>`
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}