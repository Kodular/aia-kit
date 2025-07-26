import { describe, test, expect, beforeEach, vi } from 'vitest'
import LogicBlocks from '../../../../src/generators/yail/blocks/LogicBlocks.js'
import type YailGenerator from '../../../../src/generators/yail/YailGenerator.js'
import type { Block } from "../../../../src/types.js"

const mockRegister = vi.fn(() => {})
const mockStatementToCode = vi.fn((block: any) => [{ format: () => 'mockValue' }])
const mockValueToCode = vi.fn((block: any) => ({ format: () => 'mockValue' }))

const mockGenerator = {
  register: mockRegister,
  statementToCode: mockStatementToCode,
  valueToCode: mockValueToCode
} as unknown as YailGenerator

describe('LogicBlocks', () => {
  let logicBlocks: LogicBlocks

  beforeEach(() => {
    logicBlocks = new LogicBlocks(mockGenerator)
    logicBlocks.registerBlocks()  // Manually register blocks in tests
    mockRegister.mockClear()
    mockStatementToCode.mockClear()
    mockValueToCode.mockClear()
  })

  describe('generateBoolean', () => {
    test('generates true boolean', () => {
      const block: Block = {
        type: 'logic_boolean',
        fields: {
          BOOL: 'TRUE'
        }
      }

      const result = logicBlocks.generateBoolean(block)
      expect(result.format()).toBe('#t')
    })

    test('generates false boolean', () => {
      const block: Block = {
        type: 'logic_boolean',
        fields: {
          BOOL: 'FALSE'
        }
      }

      const result = logicBlocks.generateBoolean(block)
      expect(result.format()).toBe('#f')
    })

    test('defaults to false when field is missing', () => {
      const block: Block = {
        type: 'logic_boolean'
      }

      const result = logicBlocks.generateBoolean(block)
      expect(result.format()).toBe('#f')
    })
  })

  describe('generateLogicOperation', () => {
    test('generates AND operation', () => {
      const block: Block = {
        type: 'logic_operation',
        fields: {
          OP: 'AND'
        },
        values: {
          A: { type: 'logic_boolean' },
          B: { type: 'logic_boolean' }
        }
      }

      const result = logicBlocks.generateLogicOperation(block)
      expect(result.format()).toBe('(and-delayed mockValue mockValue)')
    })

    test('generates OR operation', () => {
      const block: Block = {
        type: 'logic_operation',
        fields: {
          OP: 'OR'
        },
        values: {
          A: { type: 'logic_boolean' },
          B: { type: 'logic_boolean' }
        }
      }

      const result = logicBlocks.generateLogicOperation(block)
      expect(result.format()).toBe('(or-delayed mockValue mockValue)')
    })

    test('defaults to AND when OP field is missing', () => {
      const block: Block = {
        type: 'logic_operation',
        values: {
          A: { type: 'logic_boolean' },
          B: { type: 'logic_boolean' }
        }
      }

      const result = logicBlocks.generateLogicOperation(block)
      expect(result.format()).toBe('(and-delayed mockValue mockValue)')
    })
  })

  describe('generateLogicNegate', () => {
    test('generates not operation', () => {
      const block: Block = {
        type: 'logic_negate',
        values: {
          BOOL: { type: 'logic_boolean' }
        }
      }

      const result = logicBlocks.generateLogicNegate(block)
      expect(result.format()).toContain('call-yail-primitive yail-not')
    })
  })

  describe('generateComparison', () => {
    test('generates equal comparison', () => {
      const block: Block = {
        type: 'logic_compare',
        fields: {
          OP: 'EQ'
        },
        values: {
          A: { type: 'text' },
          B: { type: 'text' }
        }
      }

      const result = logicBlocks.generateComparison(block)
      expect(result.format()).toContain('call-yail-primitive yail-equal?')
    })

    test('generates not equal comparison', () => {
      const block: Block = {
        type: 'logic_compare',
        fields: {
          OP: 'NEQ'
        },
        values: {
          A: { type: 'text' },
          B: { type: 'text' }
        }
      }

      const result = logicBlocks.generateComparison(block)
      expect(result.format()).toContain('call-yail-primitive yail-not-equal?')
    })

    test('generates less than comparison', () => {
      const block: Block = {
        type: 'logic_compare',
        fields: {
          OP: 'LT'
        },
        values: {
          A: { type: 'math_number' },
          B: { type: 'math_number' }
        }
      }

      const result = logicBlocks.generateComparison(block)
      expect(result.format()).toContain('call-yail-primitive <')
    })

    test('generates less than or equal comparison', () => {
      const block: Block = {
        type: 'logic_compare',
        fields: {
          OP: 'LTE'
        },
        values: {
          A: { type: 'math_number' },
          B: { type: 'math_number' }
        }
      }

      const result = logicBlocks.generateComparison(block)
      expect(result.format()).toContain('call-yail-primitive <=')
    })

    test('generates greater than comparison', () => {
      const block: Block = {
        type: 'logic_compare',
        fields: {
          OP: 'GT'
        },
        values: {
          A: { type: 'math_number' },
          B: { type: 'math_number' }
        }
      }

      const result = logicBlocks.generateComparison(block)
      expect(result.format()).toContain('call-yail-primitive >')
    })

    test('generates greater than or equal comparison', () => {
      const block: Block = {
        type: 'logic_compare',
        fields: {
          OP: 'GTE'
        },
        values: {
          A: { type: 'math_number' },
          B: { type: 'math_number' }
        }
      }

      const result = logicBlocks.generateComparison(block)
      expect(result.format()).toContain('call-yail-primitive >=')
    })

    test('defaults to equal when OP field is missing', () => {
      const block: Block = {
        type: 'logic_compare',
        values: {
          A: { type: 'text' },
          B: { type: 'text' }
        }
      }

      const result = logicBlocks.generateComparison(block)
      expect(result.format()).toContain('call-yail-primitive yail-equal?')
    })
  })

  describe('generateNullCheck', () => {
    test('generates null check', () => {
      const block: Block = {
        type: 'logic_null',
        values: {
          VALUE: { type: 'text' }
        }
      }

      const result = logicBlocks.generateNullCheck(block)
      expect(result.format()).toContain('call-yail-primitive yail-equal?')
      expect(result.format()).toContain('*the-null-value*')
    })
  })

  describe('generateTernary', () => {
    test('generates ternary conditional expression', () => {
      const block: Block = {
        type: 'logic_ternary',
        values: {
          IF: { type: 'logic_boolean' },
          THEN: { type: 'text' },
          ELSE: { type: 'text' }
        }
      }

      const result = logicBlocks.generateTernary(block)
      expect(result.format()).toBe('(if mockValue mockValue mockValue)')
    })
  })

  describe('generateLogicOr', () => {
    test('generates OR operation using or-delayed', () => {
      const block: Block = {
        type: 'logic_or',
        values: {
          A: { type: 'logic_boolean' },
          B: { type: 'logic_boolean' }
        }
      }

      const result = logicBlocks.generateLogicOr(block)
      expect(result.format()).toBe('(or-delayed mockValue mockValue)')
    })
  })

  describe('generateLogicFalse', () => {
    test('generates false boolean', () => {
      const block: Block = {
        type: 'logic_false'
      }

      const result = logicBlocks.generateLogicFalse(block)
      expect(result.format()).toBe('#f')
    })
  })
})
