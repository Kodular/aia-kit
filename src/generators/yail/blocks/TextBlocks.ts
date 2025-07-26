import { Scheme, SchemeExpr } from '../ast/SchemeAST.js'
import { yailPrimitiveCall } from '../ast/YailConstructs.js'
import { YAIL_TYPES } from '../../../types.js'
import type { Block } from '../../../types.js'
import type YailGenerator from '../YailGenerator.js'

export default class TextBlocks {
  constructor(private generator: YailGenerator) {}

  registerBlocks(): void {
    this.generator.register('text', (block) => this.generateText(block))
    this.generator.register('text_join', (block) => this.generateTextJoin(block))
    this.generator.register('text_length', (block) => this.generateTextLength(block))
    this.generator.register('text_changeCase', (block) => this.generateTextCase(block))
    this.generator.register('text_substring', (block) => this.generateSubstring(block))
    this.generator.register('text_segment', (block) => this.generateTextSegment(block))
    this.generator.register('text_trim', (block) => this.generateTextTrim(block))
    this.generator.register('text_replace', (block) => this.generateTextReplace(block))
    this.generator.register('text_replace_all', (block) => this.generateTextReplaceAll(block))
    this.generator.register('text_contains', (block) => this.generateTextContains(block))
    this.generator.register('text_starts_at', (block) => this.generateTextStartsAt(block))
    this.generator.register('text_split', (block) => this.generateTextSplit(block))
    this.generator.register('text_split_at_spaces', (block) => this.generateTextSplitAtSpaces(block))
    this.generator.register('text_compare', (block) => this.generateTextCompare(block))
    this.generator.register('text_isEmpty', (block) => this.generateTextIsEmpty(block))
    this.generator.register('text_is_string', (block) => this.generateTextIsString(block))
    this.generator.register('obfuscated_text', (block) => this.generateObfuscatedText(block))
    this.generator.register('text_reverse', (block) => this.generateTextReverse(block))
    this.generator.register('text_replace_mappings', (block) => this.generateTextReplaceMappings(block))
  }

  generateText(block: Block): SchemeExpr {
    return Scheme.string(block.fields?.TEXT || '')
  }

  generateTextJoin(block: Block): SchemeExpr {
    const itemCount = parseInt(block.mutation?.items || '2')
    const items: SchemeExpr[] = []

    for (let i = 0; i < itemCount; i++) {
      const item = block.values?.[`ADD${i}`]
      const itemCode = item ? this.generator.valueToCode(item) : Scheme.string('')
      items.push(itemCode)
    }

    const typeList = items.map(() => YAIL_TYPES.TEXT)

    return yailPrimitiveCall(
      'string-append',
      items,
      typeList,
      'join'
    )
  }

  generateTextLength(block: Block): SchemeExpr {
    const textScheme = this.generator.valueToCode(block.values?.VALUE)

    return yailPrimitiveCall(
      'string-length',
      [textScheme],
      [YAIL_TYPES.TEXT],
      'length'
    )
  }

  generateTextCase(block: Block): SchemeExpr {
    const op = block.fields?.CASE || 'UPPERCASE'
    const textScheme = this.generator.valueToCode(block.values?.TEXT)

    const opMap: { [key: string]: string } = {
      'UPPERCASE': 'upcase-string',
      'LOWERCASE': 'downcase-string',
      'TITLECASE': 'string-to-title-case'
    }

    const yailOp = opMap[op] || 'upcase-string'
    const opName = op.toLowerCase().replace('case', '')

    return yailPrimitiveCall(
      yailOp,
      [textScheme],
      [YAIL_TYPES.TEXT],
      opName
    )
  }

  generateSubstring(block: Block): SchemeExpr {
    const textScheme = this.generator.valueToCode(block.values?.STRING)
    const startScheme = this.generator.valueToCode(block.values?.FROM)
    const lengthScheme = this.generator.valueToCode(block.values?.TO)

    return yailPrimitiveCall(
      'string-substring',
      [textScheme, startScheme, lengthScheme],
      [YAIL_TYPES.TEXT, YAIL_TYPES.NUMBER, YAIL_TYPES.NUMBER],
      'substring'
    )
  }

  generateTextTrim(block: Block): SchemeExpr {
    const textScheme = this.generator.valueToCode(block.values?.TEXT)

    return yailPrimitiveCall(
      'string-trim',
      [textScheme],
      [YAIL_TYPES.TEXT],
      'trim'
    )
  }

  generateTextReplace(block: Block): SchemeExpr {
    const textScheme = this.generator.valueToCode(block.values?.TEXT)
    const segmentScheme = this.generator.valueToCode(block.values?.SEGMENT)
    const replacementScheme = this.generator.valueToCode(block.values?.REPLACEMENT)

    return yailPrimitiveCall(
      'string-replace-all',
      [textScheme, segmentScheme, replacementScheme],
      [YAIL_TYPES.TEXT, YAIL_TYPES.TEXT, YAIL_TYPES.TEXT],
      'replace all'
    )
  }

  generateTextContains(block: Block): SchemeExpr {
    const textScheme = this.generator.valueToCode(block.values?.TEXT)
    const pieceScheme = this.generator.valueToCode(block.values?.PIECE)

    return yailPrimitiveCall(
      'string-contains',
      [textScheme, pieceScheme],
      [YAIL_TYPES.TEXT, YAIL_TYPES.TEXT],
      'contains'
    )
  }

  generateTextStartsAt(block: Block): SchemeExpr {
    const textScheme = this.generator.valueToCode(block.values?.TEXT)
    const pieceScheme = this.generator.valueToCode(block.values?.PIECE)

    return yailPrimitiveCall(
      'string-starts-at',
      [textScheme, pieceScheme],
      [YAIL_TYPES.TEXT, YAIL_TYPES.TEXT],
      'starts at'
    )
  }

  generateTextSplit(block: Block): SchemeExpr {
    const textScheme = this.generator.valueToCode(block.values?.TEXT)
    const atScheme = this.generator.valueToCode(block.values?.AT)

    return yailPrimitiveCall(
      'string-split',
      [textScheme, atScheme],
      [YAIL_TYPES.TEXT, YAIL_TYPES.TEXT],
      'split'
    )
  }

  generateTextSplitAtSpaces(block: Block): SchemeExpr {
    const textScheme = this.generator.valueToCode(block.values?.TEXT)

    return yailPrimitiveCall(
      'string-split-at-spaces',
      [textScheme],
      [YAIL_TYPES.TEXT],
      'split at spaces'
    )
  }

  generateTextCompare(block: Block): SchemeExpr {
    const op = block.fields?.OP || 'LT'
    const text1Scheme = this.generator.valueToCode(block.values?.TEXT1)
    const text2Scheme = this.generator.valueToCode(block.values?.TEXT2)

    const opMap: { [key: string]: string } = {
      'LT': 'string<?',
      'EQ': 'string=?',
      'GT': 'string>?'
    }

    const yailOp = opMap[op] || 'string=?'
    const opName = op === 'LT' ? 'less than' : op === 'GT' ? 'greater than' : 'equal'

    return yailPrimitiveCall(
      yailOp,
      [text1Scheme, text2Scheme],
      [YAIL_TYPES.TEXT, YAIL_TYPES.TEXT],
      opName
    )
  }

  generateTextIsEmpty(block: Block): SchemeExpr {
    const textScheme = this.generator.valueToCode(block.values?.VALUE)

    return yailPrimitiveCall(
      'string-empty?',
      [textScheme],
      [YAIL_TYPES.TEXT],
      'is text empty?'
    )
  }

  generateTextSegment(block: Block): SchemeExpr {
    const textScheme = this.generator.valueToCode(block.values?.TEXT)
    const startScheme = this.generator.valueToCode(block.values?.START)
    const lengthScheme = this.generator.valueToCode(block.values?.LENGTH)

    return yailPrimitiveCall(
      'string-substring',
      [textScheme, startScheme, lengthScheme],
      [YAIL_TYPES.TEXT, YAIL_TYPES.NUMBER, YAIL_TYPES.NUMBER],
      'segment'
    )
  }

  generateTextReplaceAll(block: Block): SchemeExpr {
    const textScheme = this.generator.valueToCode(block.values?.TEXT)
    const segmentScheme = this.generator.valueToCode(block.values?.SEGMENT)
    const replacementScheme = this.generator.valueToCode(block.values?.REPLACEMENT)

    return yailPrimitiveCall(
      'string-replace-all',
      [textScheme, segmentScheme, replacementScheme],
      [YAIL_TYPES.TEXT, YAIL_TYPES.TEXT, YAIL_TYPES.TEXT],
      'replace all'
    )
  }

  generateTextIsString(block: Block): SchemeExpr {
    const itemScheme = this.generator.valueToCode(block.values?.ITEM)

    return yailPrimitiveCall(
      'string?',
      [itemScheme],
      [YAIL_TYPES.ANY],
      'is string?'
    )
  }

  generateObfuscatedText(block: Block): SchemeExpr {
    // For TypeScript implementation, we'll need to implement the obfuscation algorithm
    // This is a simplified version - in practice, you'd need the full obfuscation logic
    const text = block.fields?.TEXT || ''
    const confounder = (block as any).confounder || 'default'

    // This is a placeholder - the actual implementation would need the obfuscation algorithm
    const obfuscatedText = this.setupObfuscation(text, confounder)

    return yailPrimitiveCall(
      'text-deobfuscate',
      [Scheme.string(obfuscatedText), Scheme.string(confounder)],
      [YAIL_TYPES.TEXT, YAIL_TYPES.TEXT],
      'deobfuscate text'
    )
  }

  private setupObfuscation(input: string, confounder: string): string {
    // Simple obfuscation algorithm implementation
    // This matches the algorithm in the original JavaScript code
    const acc: string[] = []
    let conf = confounder

    // Make sure confounder is long enough
    while (conf.length < input.length) {
      conf += conf
    }

    for (let i = 0; i < input.length; i++) {
      const c = (input.charCodeAt(i) ^ conf.charCodeAt(i)) & 0xFF
      const b = (c ^ (input.length - i)) & 0xFF
      const b2 = ((c >> 8) ^ i) & 0xFF
      acc.push(String.fromCharCode((b2 << 8 | b) & 0xFF))
    }

    return acc.join('')
  }

  generateTextReverse(block: Block): SchemeExpr {
    const textScheme = this.generator.valueToCode(block.values?.VALUE)

    return yailPrimitiveCall(
      'string-reverse',
      [textScheme],
      [YAIL_TYPES.TEXT],
      'reverse'
    )
  }

  generateTextReplaceMappings(block: Block): SchemeExpr {
    const textScheme = this.generator.valueToCode(block.values?.TEXT)
    const mappingsScheme = this.generator.valueToCode(block.values?.MAPPINGS)
    const op = block.fields?.OP || 'LONGEST_STRING_FIRST'

    const opMap: { [key: string]: string } = {
      'LONGEST_STRING_FIRST': 'string-replace-mappings-longest-string',
      'DICTIONARY_ORDER': 'string-replace-mappings-dictionary'
    }

    const yailOp = opMap[op] || 'string-replace-mappings-longest-string'

    return yailPrimitiveCall(
      yailOp,
      [textScheme, mappingsScheme],
      [YAIL_TYPES.TEXT, YAIL_TYPES.DICTIONARY],
      'replace with mappings'
    )
  }
}
