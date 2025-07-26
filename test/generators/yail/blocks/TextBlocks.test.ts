import { describe, test, expect, beforeEach, vi } from 'vitest'
import TextBlocks from '../../../../src/generators/yail/blocks/TextBlocks.js'
import type YailGenerator from '../../../../src/generators/yail/YailGenerator.js'
import type { Block } from "../../../../src/types.js"

const mockRegister = vi.fn(() => {})
const mockStatementToCode = vi.fn((block: any) => ['mockValue'])
const mockValueToCode = vi.fn((block: any) => ({ format: () => 'mockValue' }))

const mockGenerator = {
  register: mockRegister,
  statementToCode: mockStatementToCode,
  valueToCode: mockValueToCode
} as unknown as YailGenerator

describe('TextBlocks', () => {
  let textBlocks: TextBlocks

  beforeEach(() => {
    textBlocks = new TextBlocks(mockGenerator)
    textBlocks.registerBlocks()  // Manually register blocks in tests
    mockRegister.mockClear()
    mockStatementToCode.mockClear()
    mockValueToCode.mockClear()
  })

  describe('generateText', () => {
    test('generates text from field', () => {
      const block: Block = {
        type: 'text',
        fields: {
          TEXT: 'Hello World'
        }
      }

      const result = textBlocks.generateText(block)
      expect(result.format()).toBe('"Hello World"')
    })

    test('defaults to empty string when field is missing', () => {
      const block: Block = {
        type: 'text'
      }

      const result = textBlocks.generateText(block)
      expect(result.format()).toBe('""')
    })
  })

  describe('generateTextJoin', () => {
    test('generates text join with multiple items', () => {
      const block: Block = {
        type: 'text_join',
        mutation: {
          items: '3'
        },
        values: {
          ADD0: { type: 'text' },
          ADD1: { type: 'text' },
          ADD2: { type: 'text' }
        }
      }

      const result = textBlocks.generateTextJoin(block)
      expect(result.format()).toContain('call-yail-primitive string-append')
    })

    test('generates text join with default 2 items when mutation missing', () => {
      const block: Block = {
        type: 'text_join',
        values: {
          ADD0: { type: 'text' },
          ADD1: { type: 'text' }
        }
      }

      const result = textBlocks.generateTextJoin(block)
      expect(result.format()).toContain('call-yail-primitive string-append')
    })

    test('handles missing items with empty string default', () => {
      const block: Block = {
        type: 'text_join',
        mutation: {
          items: '2'
        },
        values: {
          ADD0: { type: 'text' }
          // ADD1 is missing
        }
      }

      const result = textBlocks.generateTextJoin(block)
      expect(result.format()).toContain('call-yail-primitive string-append')
    })
  })

  describe('generateTextLength', () => {
    test('generates text length operation', () => {
      const block: Block = {
        type: 'text_length',
        values: {
          VALUE: { type: 'text' }
        }
      }

      const result = textBlocks.generateTextLength(block)
      expect(result.format()).toContain('call-yail-primitive string-length')
    })
  })

  describe('generateTextCase', () => {
    test('generates uppercase operation', () => {
      const block: Block = {
        type: 'text_changeCase',
        fields: {
          CASE: 'UPPERCASE'
        },
        values: {
          TEXT: { type: 'text' }
        }
      }

      const result = textBlocks.generateTextCase(block)
      expect(result.format()).toContain('call-yail-primitive upcase-string')
    })

    test('generates lowercase operation', () => {
      const block: Block = {
        type: 'text_changeCase',
        fields: {
          CASE: 'LOWERCASE'
        },
        values: {
          TEXT: { type: 'text' }
        }
      }

      const result = textBlocks.generateTextCase(block)
      expect(result.format()).toContain('call-yail-primitive downcase-string')
    })

    test('generates titlecase operation', () => {
      const block: Block = {
        type: 'text_changeCase',
        fields: {
          CASE: 'TITLECASE'
        },
        values: {
          TEXT: { type: 'text' }
        }
      }

      const result = textBlocks.generateTextCase(block)
      expect(result.format()).toContain('call-yail-primitive string-to-title-case')
    })

    test('defaults to uppercase when field is missing', () => {
      const block: Block = {
        type: 'text_changeCase',
        values: {
          TEXT: { type: 'text' }
        }
      }

      const result = textBlocks.generateTextCase(block)
      expect(result.format()).toContain('call-yail-primitive upcase-string')
    })
  })

  describe('generateSubstring', () => {
    test('generates substring operation', () => {
      const block: Block = {
        type: 'text_getSubstring',
        values: {
          STRING: { type: 'text' },
          FROM: { type: 'math_number' },
          TO: { type: 'math_number' }
        }
      }

      const result = textBlocks.generateSubstring(block)
      expect(result.format()).toContain('call-yail-primitive string-substring')
    })
  })

  describe('generateTextTrim', () => {
    test('generates text trim operation', () => {
      const block: Block = {
        type: 'text_trim',
        values: {
          TEXT: { type: 'text' }
        }
      }

      const result = textBlocks.generateTextTrim(block)
      expect(result.format()).toContain('call-yail-primitive string-trim')
    })
  })

  describe('generateTextReplace', () => {
    test('generates text replace operation', () => {
      const block: Block = {
        type: 'text_replace_all',
        values: {
          TEXT: { type: 'text' },
          SEGMENT: { type: 'text' },
          REPLACEMENT: { type: 'text' }
        }
      }

      const result = textBlocks.generateTextReplace(block)
      expect(result.format()).toContain('call-yail-primitive string-replace-all')
    })
  })

  describe('generateTextContains', () => {
    test('generates text contains check', () => {
      const block: Block = {
        type: 'text_contains',
        values: {
          TEXT: { type: 'text' },
          PIECE: { type: 'text' }
        }
      }

      const result = textBlocks.generateTextContains(block)
      expect(result.format()).toContain('call-yail-primitive string-contains')
    })
  })

  describe('generateTextStartsAt', () => {
    test('generates text starts at operation', () => {
      const block: Block = {
        type: 'text_starts_at',
        values: {
          TEXT: { type: 'text' },
          PIECE: { type: 'text' }
        }
      }

      const result = textBlocks.generateTextStartsAt(block)
      expect(result.format()).toContain('call-yail-primitive string-starts-at')
    })
  })

  describe('generateTextSplit', () => {
    test('generates text split operation', () => {
      const block: Block = {
        type: 'text_split',
        values: {
          TEXT: { type: 'text' },
          AT: { type: 'text' }
        }
      }

      const result = textBlocks.generateTextSplit(block)
      expect(result.format()).toContain('call-yail-primitive string-split')
    })
  })

  describe('generateTextSplitAtSpaces', () => {
    test('generates text split at spaces operation', () => {
      const block: Block = {
        type: 'text_split_at_spaces',
        values: {
          TEXT: { type: 'text' }
        }
      }

      const result = textBlocks.generateTextSplitAtSpaces(block)
      expect(result.format()).toContain('call-yail-primitive string-split-at-spaces')
    })
  })

  describe('generateTextCompare', () => {
    test('generates less than comparison', () => {
      const block: Block = {
        type: 'text_compare',
        fields: {
          OP: 'LT'
        },
        values: {
          TEXT1: { type: 'text' },
          TEXT2: { type: 'text' }
        }
      }

      const result = textBlocks.generateTextCompare(block)
      expect(result.format()).toContain('call-yail-primitive string<?')
      expect(result.format()).toContain('"less than"')
    })

    test('generates equal comparison', () => {
      const block: Block = {
        type: 'text_compare',
        fields: {
          OP: 'EQ'
        },
        values: {
          TEXT1: { type: 'text' },
          TEXT2: { type: 'text' }
        }
      }

      const result = textBlocks.generateTextCompare(block)
      expect(result.format()).toContain('call-yail-primitive string=?')
      expect(result.format()).toContain('"equal"')
    })

    test('generates greater than comparison', () => {
      const block: Block = {
        type: 'text_compare',
        fields: {
          OP: 'GT'
        },
        values: {
          TEXT1: { type: 'text' },
          TEXT2: { type: 'text' }
        }
      }

      const result = textBlocks.generateTextCompare(block)
      expect(result.format()).toContain('call-yail-primitive string>?')
      expect(result.format()).toContain('"greater than"')
    })

    test('defaults to less than when field is missing', () => {
      const block: Block = {
        type: 'text_compare',
        values: {
          TEXT1: { type: 'text' },
          TEXT2: { type: 'text' }
        }
      }

      const result = textBlocks.generateTextCompare(block)
      expect(result.format()).toContain('call-yail-primitive string<?')
    })
  })

  describe('generateTextIsEmpty', () => {
    test('generates text empty check', () => {
      const block: Block = {
        type: 'text_isEmpty',
        values: {
          VALUE: { type: 'text' }
        }
      }

      const result = textBlocks.generateTextIsEmpty(block)
      expect(result.format()).toContain('call-yail-primitive string-empty?')
    })
  })
})
