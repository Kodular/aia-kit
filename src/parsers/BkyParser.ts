import { DOMParser, type Document as XMLDocument, type Element as XMLElement } from '@xmldom/xmldom'
import type { BkyStatistics, Block } from '../types.js'

export class BkyParser {
  private xmlDoc: XMLDocument
  private rootElement: XMLElement

  static parse(bkyContent: string): BkyParser {
    const parser = new DOMParser()
    const xmlDoc = parser.parseFromString(bkyContent, 'text/xml')

    // Check for parser errors
    const parseError = xmlDoc.getElementsByTagName('parsererror')[0]
    if (parseError) {
      throw new Error('Invalid XML format')
    }

    return new BkyParser(xmlDoc)
  }

  constructor(xmlDoc: XMLDocument) {
    this.xmlDoc = xmlDoc
    const xmlElement = xmlDoc.getElementsByTagName('xml')[0] || xmlDoc.getElementsByTagName('XML')[0]
    if (!xmlElement) {
      throw new Error('No xml root element found')
    }
    this.rootElement = xmlElement
  }

  getAllBlocks(): Block[] {
    const blocks: Block[] = []
    const blockElements = this.rootElement.getElementsByTagName('block')

    for (let i = 0; i < blockElements.length; i++) {
      const blockElement = blockElements[i]
      if (blockElement && this.isTopLevelBlock(blockElement)) {
        blocks.push(this.parseBlock(blockElement))
      }
    }

    return blocks
  }

  private isTopLevelBlock(blockElement: XMLElement): boolean {
    // A block is top-level if its parent is the xml root element
    // or if it's not inside another block's value, statement, or next
    const parent = blockElement.parentNode
    if (parent === this.rootElement) {
      return true
    }

    // Check if it's nested inside value, statement, or next elements
    let currentParent = parent
    while (currentParent && currentParent !== this.rootElement) {
      if (currentParent.nodeName === 'value' ||
        currentParent.nodeName === 'statement' ||
        currentParent.nodeName === 'next') {
        return false
      }
      currentParent = currentParent.parentNode
    }

    return true
  }

  parseBlock(blockElement: XMLElement): Block {
    const block: Block = {
      type: blockElement.getAttribute('type') || '',
      id: blockElement.getAttribute('id') || undefined,
      x: parseInt(blockElement.getAttribute('x') || '0') || 0,
      y: parseInt(blockElement.getAttribute('y') || '0') || 0,
      collapsed: blockElement.getAttribute('collapsed') === 'true',
      disabled: blockElement.getAttribute('disabled') === 'true',
      fields: {},
      values: {},
      statements: {},
      next: undefined,
      mutation: undefined
    }

    // Parse all child elements in a single loop
    const children = blockElement.childNodes
    for (let i = 0; i < children.length; i++) {
      const child = children[i]
      if (!child || child.nodeType !== 1) continue // Skip non-element nodes

      const element = child as XMLElement
      const nodeName = element.nodeName
      const name = element.getAttribute('name')

      switch (nodeName) {
        case 'field':
          if (name) {
            block.fields![name] = element.textContent || ''
          }
          break

        case 'value':
          if (name) {
            const childBlock = this.getFirstChildBlock(element)
            if (childBlock) {
              block.values![name] = this.parseBlock(childBlock)
            }
          }
          break

        case 'statement':
          if (name) {
            const childBlock = this.getFirstChildBlock(element)
            if (childBlock) {
              block.statements![name] = this.parseBlock(childBlock)
            }
          }
          break

        case 'next': {
          const nextChildBlock = this.getFirstChildBlock(element)
          if (nextChildBlock) {
            block.next = this.parseBlock(nextChildBlock)
          }
          break
        }

        case 'mutation':
          block.mutation = this.parseMutation(element)
          break
      }
    }

    return block
  }

  private getFirstChildBlock(element: XMLElement): XMLElement | null {
    const children = element.childNodes
    for (let i = 0; i < children.length; i++) {
      const child = children[i]
      if (child && child.nodeType === 1 && (child.nodeName === 'block' || child.nodeName === 'shadow')) {
        return child as XMLElement
      }
    }
    return null
  }

  private parseMutation(mutationElement: XMLElement): { [key: string]: any } {
    const mutation: { [key: string]: any } = {}

    // Parse attributes
    const attributes = mutationElement.attributes
    if (attributes) {
      for (let i = 0; i < attributes.length; i++) {
        const attr = attributes[i]
        if (attr) {
          mutation[attr.name] = attr.value
        }
      }
    }

    // Parse text content if any
    const textContent = mutationElement.textContent?.trim()
    if (textContent) {
      mutation.text = textContent
    }

    return mutation
  }

  getBlocksByType(type: string): Block[] {
    return this.getAllBlocks().filter(block => block.type === type)
  }

  getGlobalVariables(): Block[] {
    return this.getBlocksByType('global_declaration')
  }

  getProcedureDefinitions(): Block[] {
    return this.getBlocksByType('procedures_defnoreturn')
      .concat(this.getBlocksByType('procedures_defreturn'))
  }

  getEventHandlers(): Block[] {
    const blocks = this.getAllBlocks()
    return blocks.filter(block =>
      block.type.includes('_when') ||
      block.type.includes('event') ||
      block.type === 'component_event'
    )
  }

  getComponentMethodCalls(): Block[] {
    return this.getBlocksByType('component_method')
  }

  getComponentPropertyGetters(): Block[] {
    return this.getBlocksByType('component_get_property')
  }

  getComponentPropertySetters(): Block[] {
    return this.getBlocksByType('component_set_property')
  }

  getFlattenedBlocks(): Block[] {
    const flattened: Block[] = []

    const flattenBlock = (block: Block | null): void => {
      if (!block) return

      flattened.push(block)

      if (block.values) {
        Object.values(block.values).forEach(value => {
          if (value) flattenBlock(value)
        })
      }

      if (block.statements) {
        Object.values(block.statements).forEach(statement => {
          if (statement) flattenBlock(statement)
        })
      }

      if (block.next) {
        flattenBlock(block.next)
      }
    }

    this.getAllBlocks().forEach(block => flattenBlock(block))
    return flattened
  }

  getStatistics(): BkyStatistics {
    const allBlocks = this.getFlattenedBlocks()
    const blockTypes: { [type: string]: number } = {}

    allBlocks.forEach(block => {
      blockTypes[block.type] = (blockTypes[block.type] || 0) + 1
    })

    return {
      totalBlocks: allBlocks.length,
      topLevelBlocks: this.getAllBlocks().length,
      blockTypes: blockTypes,
      globalVariables: this.getGlobalVariables().length,
      procedures: this.getProcedureDefinitions().length,
      eventHandlers: this.getEventHandlers().length
    }
  }

  hasBlocks(): boolean {
    return this.getAllBlocks().length > 0
  }

  getFirstBlockByType(type: string): Block | undefined {
    const blocks = this.getAllBlocks()
    return blocks.filter(block =>
      block.type === type
    )[0]
  }

  containsBlockType(type: string): boolean {
    return this.getBlocksByType(type).length > 0
  }

  getBlocksInfo(): { totalBlocks: number; uniqueTypes: string[]; byType: { [type: string]: number } } {
    const blocks = this.getAllBlocks()
    const byType: { [type: string]: number } = {}
    const uniqueTypes: string[] = []

    for (const block of blocks) {
      if (byType[block.type]) {
        byType[block.type] = byType[block.type]! + 1
      } else {
        byType[block.type] = 1
        uniqueTypes.push(block.type)
      }
    }

    return {
      totalBlocks: blocks.length,
      uniqueTypes,
      byType
    }
  }

  flatten(): { id: string; type: string; fields: { [key: string]: any } }[] {
    const flattened: { id: string; type: string; fields: { [key: string]: any } }[] = []

    const flattenBlock = (block: Block): void => {
      flattened.push({
        id: block.id || '',
        type: block.type,
        fields: block.fields || {}
      })

      // Recursively flatten child blocks
      if (block.values) {
        Object.values(block.values).forEach(value => {
          if (value) flattenBlock(value)
        })
      }

      if (block.statements) {
        Object.values(block.statements).forEach(statement => {
          if (statement) flattenBlock(statement)
        })
      }

      if (block.next) {
        flattenBlock(block.next)
      }
    }

    this.getAllBlocks().forEach(block => flattenBlock(block))
    return flattened
  }

  getSummary(): {
    parseError: string | null
    hasContent: boolean
    topLevelBlocks: number
  } {
    try {
      return {
        parseError: null,
        hasContent: this.hasBlocks(),
        topLevelBlocks: this.getAllBlocks().length,
      }
    } catch (error) {
      return {
        parseError: error instanceof Error ? error.message : 'Unknown parse error',
        hasContent: false,
        topLevelBlocks: 0,
      }
    }
  }

  toStructuredData(): any {
    return {
      blocks: this.getAllBlocks(),
    }
  }

  toJSON(): any {
    return this.toStructuredData()
  }
}

export default BkyParser
