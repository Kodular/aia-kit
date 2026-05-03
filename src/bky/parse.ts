import { DOMParser } from '@xmldom/xmldom'
import type { Element as XMLElement } from '@xmldom/xmldom'
import type { BlockAst, BlockNode } from './ast.js'

export function parseBky(bky: string): BlockAst {
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
