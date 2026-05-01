import { DOMParser } from '@xmldom/xmldom'
import type { Element as XMLElement } from '@xmldom/xmldom'
import type { BlockAst, BlockNode } from './ast.js'

export class BkyParser {
  static parse(bky: string): BlockAst {
    const doc = new DOMParser().parseFromString(bky, 'text/xml')
    const parseError = doc.getElementsByTagName('parsererror')[0]
    if (parseError) {
      throw new Error(`Invalid BKY XML: ${parseError.textContent}`)
    }
    const root = doc.getElementsByTagName('xml')[0] ?? doc.getElementsByTagName('XML')[0]
    if (!root) {
      throw new Error('BKY XML missing <xml> root element')
    }
    const blocks: BlockNode[] = []
    for (let i = 0; i < root.childNodes.length; i++) {
      const node = root.childNodes[i] as XMLElement
      if (node.nodeName === 'block') {
        blocks.push(parseBlock(node))
      }
    }
    return { blocks }
  }

  static serialize(ast: BlockAst): string {
    const parts: string[] = ['<xml xmlns="https://developers.google.com/blockly/xml">']
    for (const block of ast.blocks) {
      parts.push(serializeBlock(block, true))
    }
    parts.push('</xml>')
    return parts.join('\n')
  }
}

function parseBlock(el: XMLElement): BlockNode {
  const node: BlockNode = {
    type: el.getAttribute('type') ?? '',
    id: el.getAttribute('id') ?? '',
    x: el.hasAttribute('x') ? Number(el.getAttribute('x')) : undefined,
    y: el.hasAttribute('y') ? Number(el.getAttribute('y')) : undefined,
    disabled: el.getAttribute('disabled') === 'true' ? true : undefined,
    collapsed: el.getAttribute('collapsed') === 'true' ? true : undefined,
    fields: {},
    values: {},
    statements: {},
    mutation: {},
    next: null,
  }

  for (let i = 0; i < el.childNodes.length; i++) {
    const child = el.childNodes[i] as XMLElement
    switch (child.nodeName) {
      case 'field':
        node.fields[child.getAttribute('name') ?? ''] = child.textContent ?? ''
        break
      case 'value': {
        const innerBlock = firstBlockChild(child)
        if (innerBlock) node.values[child.getAttribute('name') ?? ''] = parseBlock(innerBlock)
        break
      }
      case 'statement': {
        const innerBlock = firstBlockChild(child)
        if (innerBlock) node.statements[child.getAttribute('name') ?? ''] = parseBlock(innerBlock)
        break
      }
      case 'mutation': {
        for (let j = 0; j < (child as XMLElement).attributes.length; j++) {
          const attr = (child as XMLElement).attributes[j]
          node.mutation[attr.name] = attr.value
        }
        break
      }
      case 'next': {
        const innerBlock = firstBlockChild(child)
        if (innerBlock) node.next = parseBlock(innerBlock)
        break
      }
    }
  }
  return node
}

function firstBlockChild(el: XMLElement): XMLElement | null {
  for (let i = 0; i < el.childNodes.length; i++) {
    const child = el.childNodes[i] as XMLElement
    if (child.nodeName === 'block') return child
  }
  return null
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
