import { describe, test, expect, beforeEach, vi } from 'vitest'
import ControlBlocks from '../../../../src/generators/yail/blocks/ControlBlocks.js'
import type YailGenerator from '../../../../src/generators/yail/YailGenerator.js'
import type { Block } from "../../../../src/types.js"

const mockRegister = vi.fn(() => {})
const mockStatementToCode = vi.fn((block: any) => block ? [{ format: () => 'mockValue' }] : [])
const mockValueToCode = vi.fn((block: any) => block ? ({ format: () => 'mockValue' }) : undefined)

const mockGenerator = {
  register: mockRegister,
  statementToCode: mockStatementToCode,
  valueToCode: mockValueToCode
} as unknown as YailGenerator

describe('ControlBlocks', () => {
  let controlBlocks: ControlBlocks

  beforeEach(() => {
    controlBlocks = new ControlBlocks(mockGenerator)
    controlBlocks.registerBlocks()  // Manually register blocks in tests
    mockRegister.mockClear()
    mockStatementToCode.mockClear()
    mockValueToCode.mockClear()
  })

  describe('generateIfStatement', () => {
    test('generates if statement with else branch', () => {
      const block: Block = {
        type: 'controls_if',
        values: {
          IF0: { type: 'logic_boolean' }
        },
        statements: {
          DO0: { type: 'text' },
          ELSE: { type: 'text' }
        }
      }

      const result = controlBlocks.generateIfStatement(block)
      expect(result.format()).toContain('(if mockValue (begin mockValue) (begin mockValue))')
    })

    test('generates if statement without else branch', () => {
      const block: Block = {
        type: 'controls_if',
        values: {
          IF0: { type: 'logic_boolean' }
        },
        statements: {
          DO0: { type: 'text' }
        }
      }

      const result = controlBlocks.generateIfStatement(block)
      expect(result.format()).toContain('(if mockValue (begin mockValue))')
    })
  })

  describe('generateRepeatLoop', () => {
    test('generates repeat loop with times and body', () => {
      const block: Block = {
        type: 'controls_repeat_ext',
        values: {
          TIMES: { type: 'math_number' }
        },
        statements: {
          DO: { type: 'text' }
        }
      }

      const result = controlBlocks.generateRepeatLoop(block)
      expect(result.format()).toContain('call-yail-primitive yail-repeat')
      expect(result.format()).toContain('lambda')
    })
  })

  describe('generateWhileLoop', () => {
    test('generates while loop with condition and body', () => {
      const block: Block = {
        type: 'controls_while',
        values: {
          TEST: { type: 'logic_boolean' }
        },
        statements: {
          STATEMENT: { type: 'text' }
        }
      }

      const result = controlBlocks.generateWhileLoop(block)
      expect(result.format()).toContain('call-yail-primitive yail-while')
      expect(result.format()).toContain('lambda')
    })
  })

  describe('generateForEachLoop', () => {
    test('generates for each loop with variable, list and body', () => {
      const block: Block = {
        type: 'controls_forEach',
        fields: {
          VAR: 'item'
        },
        values: {
          LIST: { type: 'lists_create_with' }
        },
        statements: {
          DO: { type: 'text' }
        }
      }

      const result = controlBlocks.generateForEachLoop(block)
      expect(result.format()).toContain('call-yail-primitive yail-for-each')
      expect(result.format()).toContain('(lambda (item)')
    })

    test('uses default variable name when field is missing', () => {
      const block: Block = {
        type: 'controls_forEach',
        values: {
          LIST: { type: 'lists_create_with' }
        },
        statements: {
          DO: { type: 'text' }
        }
      }

      const result = controlBlocks.generateForEachLoop(block)
      expect(result.format()).toContain('(lambda (item)')
    })
  })

  describe('generateForRangeLoop', () => {
    test('generates for range loop with all parameters', () => {
      const block: Block = {
        type: 'controls_for',
        fields: {
          VAR: 'i'
        },
        values: {
          FROM: { type: 'math_number' },
          TO: { type: 'math_number' },
          BY: { type: 'math_number' }
        },
        statements: {
          DO: { type: 'text' }
        }
      }

      const result = controlBlocks.generateForRangeLoop(block)
      expect(result.format()).toContain('call-yail-primitive yail-for-range')
      expect(result.format()).toContain('(lambda (i)')
    })

    test('uses default step when BY is not provided', () => {
      const block: Block = {
        type: 'controls_for',
        fields: {
          VAR: 'counter'
        },
        values: {
          FROM: { type: 'math_number' },
          TO: { type: 'math_number' }
        },
        statements: {
          DO: { type: 'text' }
        }
      }

      const result = controlBlocks.generateForRangeLoop(block)
      expect(result.format()).toContain('call-yail-primitive yail-for-range')
      expect(result.format()).toContain('(lambda (counter)')
    })

    test('uses default variable name when field is missing', () => {
      const block: Block = {
        type: 'controls_for',
        values: {
          FROM: { type: 'math_number' },
          TO: { type: 'math_number' }
        },
        statements: {
          DO: { type: 'text' }
        }
      }

      const result = controlBlocks.generateForRangeLoop(block)
      expect(result.format()).toContain('(lambda (i)')
    })
  })

  describe('generateChooseStatement', () => {
    test('generates choose statement with test and return values', () => {
      const block: Block = {
        type: 'controls_choose',
        values: {
          TEST: { type: 'logic_boolean' },
          THENRETURN: { type: 'text' },
          ELSERETURN: { type: 'text' }
        }
      }

      const result = controlBlocks.generateChooseStatement(block)
      expect(result.format()).toBe('(if mockValue mockValue mockValue)')
    })
  })

  describe('generateDoThenReturn', () => {
    test('generates do-then-return with body and return value', () => {
      const block: Block = {
        type: 'controls_do_then_return',
        statements: {
          STACK: { type: 'text' }
        },
        values: {
          RETURN: { type: 'text' }
        }
      }

      const result = controlBlocks.generateDoThenReturn(block)
      expect(result.format()).toBe('(begin mockValue mockValue)')
    })

    test('returns only return value when no body', () => {
      const block: Block = {
        type: 'controls_do_then_return',
        values: {
          RETURN: { type: 'text' }
        }
      }

      const result = controlBlocks.generateDoThenReturn(block)
      expect(result.format()).toBe('mockValue')
    })

    test('returns only body when no return value', () => {
      const block: Block = {
        type: 'controls_do_then_return',
        statements: {
          STACK: { type: 'text' }
        }
      }

      const result = controlBlocks.generateDoThenReturn(block)
      expect(result.format()).toBe('mockValue')
    })

    test('returns empty string when neither body nor return value', () => {
      const block: Block = {
        type: 'controls_do_then_return'
      }

      const result = controlBlocks.generateDoThenReturn(block)
      expect(result.format()).toBe('""')
    })
  })
})
