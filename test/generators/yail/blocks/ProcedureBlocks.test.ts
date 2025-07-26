import { describe, test, expect, beforeEach, vi } from 'vitest'
import ProcedureBlocks from '../../../../src/generators/yail/blocks/ProcedureBlocks.js'
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

describe('ProcedureBlocks', () => {
  let procedureBlocks: ProcedureBlocks

  beforeEach(() => {
    procedureBlocks = new ProcedureBlocks(mockGenerator)
    procedureBlocks.registerBlocks()  // Manually register blocks in tests
    mockRegister.mockClear()
    mockStatementToCode.mockClear()
    mockValueToCode.mockClear()
  })

  describe('generateProcedureDefinition', () => {
    test('generates procedure definition without return', () => {
      const block: Block = {
        type: 'procedures_defnoreturn',
        fields: {
          NAME: 'myProcedure'
        },
        statements: {
          STACK: { type: 'text' }
        }
      }

      const result = procedureBlocks.generateProcedureDefinition(block)
      expect(result.format()).toContain('(def (p$myProcedure)')
    })

    test('generates procedure definition with return', () => {
      const block: Block = {
        type: 'procedures_defreturn',
        fields: {
          NAME: 'myFunction'
        },
        statements: {
          STACK: { type: 'text' }
        },
        values: {
          RETURN: { type: 'math_number' }
        }
      }

      const result = procedureBlocks.generateProcedureDefinition(block)
      expect(result.format()).toContain('(def (p$myFunction)')
      expect(result.format()).toContain('begin')
    })

    test('generates procedure definition with return but no body', () => {
      const block: Block = {
        type: 'procedures_defreturn',
        fields: {
          NAME: 'simpleFunction'
        },
        values: {
          RETURN: { type: 'math_number' }
        }
      }

      const result = procedureBlocks.generateProcedureDefinition(block)
      expect(result.format()).toContain('(def (p$simpleFunction)')
    })

    test('generates procedure definition with parameters', () => {
      const block: Block = {
        type: 'procedures_defnoreturn',
        fields: {
          NAME: 'myProcWithParams'
        },
        mutation: {
          parameters: 'param1,param2,param3'
        },
        statements: {
          STACK: { type: 'text' }
        }
      }

      const result = procedureBlocks.generateProcedureDefinition(block)
      expect(result.format()).toContain('(def (p$myProcWithParams $param1 $param2 $param3)')
    })

    test('generates procedure definition with parameterNames field', () => {
      const block: Block = {
        type: 'procedures_defnoreturn',
        fields: {
          NAME: 'myProcWithParamNames'
        },
        mutation: {
          parameterNames: 'x,y,z'
        },
        statements: {
          STACK: { type: 'text' }
        }
      }

      const result = procedureBlocks.generateProcedureDefinition(block)
      expect(result.format()).toContain('(def (p$myProcWithParamNames $x $y $z)')
    })

    test('defaults to unnamed when name field is missing', () => {
      const block: Block = {
        type: 'procedures_defnoreturn',
        statements: {
          STACK: { type: 'text' }
        }
      }

      const result = procedureBlocks.generateProcedureDefinition(block)
      expect(result.format()).toContain('(def (p$unnamed)')
    })

    test('handles empty mutation', () => {
      const block: Block = {
        type: 'procedures_defnoreturn',
        fields: {
          NAME: 'noParams'
        },
        statements: {
          STACK: { type: 'text' }
        }
      }

      const result = procedureBlocks.generateProcedureDefinition(block)
      expect(result.format()).toContain('(def (p$noParams)')
    })
  })

  describe('generateProcedureCall', () => {
    test('generates procedure call from mutation name', () => {
      const block: Block = {
        type: 'procedures_callnoreturn',
        mutation: {
          name: 'myProcedure'
        }
      }

      const result = procedureBlocks.generateProcedureCall(block)
      expect(result.format()).toContain('(get-var p$myProcedure)')
    })

    test('generates procedure call from PROCNAME field', () => {
      const block: Block = {
        type: 'procedures_callnoreturn',
        fields: {
          PROCNAME: 'myFunction'
        }
      }

      const result = procedureBlocks.generateProcedureCall(block)
      expect(result.format()).toContain('(get-var p$myFunction)')
    })

    test('generates procedure call from NAME field', () => {
      const block: Block = {
        type: 'procedures_callnoreturn',
        fields: {
          NAME: 'anotherFunction'
        }
      }

      const result = procedureBlocks.generateProcedureCall(block)
      expect(result.format()).toContain('(get-var p$anotherFunction)')
    })

    test('generates procedure call with arguments', () => {
      const block: Block = {
        type: 'procedures_callnoreturn',
        mutation: {
          name: 'myProcedure'
        },
        values: {
          ARG0: { type: 'text' },
          ARG1: { type: 'math_number' }
        }
      }

      const result = procedureBlocks.generateProcedureCall(block)
      expect(result.format()).toContain('((get-var p$myProcedure) mockValue mockValue)')
    })

    test('defaults to unknown when no name provided', () => {
      const block: Block = {
        type: 'procedures_callnoreturn'
      }

      const result = procedureBlocks.generateProcedureCall(block)
      expect(result.format()).toContain('(get-var p$unknown)')
    })
  })

  describe('generateProcedureReturn', () => {
    test('generates procedure return with value', () => {
      const block: Block = {
        type: 'procedures_ifreturn',
        values: {
          VALUE: { type: 'math_number' }
        }
      }

      const result = procedureBlocks.generateProcedureReturn(block)
      if (Array.isArray(result)) {
        expect(result).toEqual([{ format: () => 'mockValue' }])
      } else {
        expect(result.format()).toBe('mockValue')
      }
    })

    test('generates empty array when no value', () => {
      const block: Block = {
        type: 'procedures_ifreturn'
      }

      const result = procedureBlocks.generateProcedureReturn(block)
      expect(result).toEqual([])
    })
  })

  describe('generateProcedureParameter', () => {
    test('generates procedure parameter', () => {
      const block: Block = {
        type: 'procedures_get',
        fields: {
          VAR: 'myParam'
        }
      }

      const result = procedureBlocks.generateProcedureParameter(block)
      expect(result.format()).toBe('$myParam')
    })

    test('defaults to param when field is missing', () => {
      const block: Block = {
        type: 'procedures_get'
      }

      const result = procedureBlocks.generateProcedureParameter(block)
      expect(result.format()).toBe('$param')
    })
  })

  describe('generateProcedureWithStatement', () => {
    test('generates procedure with statement body', () => {
      const block: Block = {
        type: 'procedures_statementlist',
        statements: {
          STACK: { type: 'text' }
        }
      }

      const result = procedureBlocks.generateProcedureWithStatement(block)
      expect(result.format()).toBe('mockValue')
    })
  })

  describe('generateProcedureIfReturn', () => {
    test('generates conditional return', () => {
      const block: Block = {
        type: 'procedures_ifreturn',
        values: {
          CONDITION: { type: 'logic_boolean' },
          VALUE: { type: 'text' }
        }
      }

      const result = procedureBlocks.generateProcedureIfReturn(block)
      expect(result.format()).toBe('(if mockValue mockValue)')
    })
  })

  describe('parseProcedureParams', () => {
    test('parses parameters from parameters field', () => {
      const block: Block = {
        type: 'procedures_defnoreturn',
        fields: {
          NAME: 'test'
        },
        mutation: {
          parameters: 'a, b, c'
        }
      }

      const result = procedureBlocks.generateProcedureDefinition(block)
      expect(result.format()).toContain('$a $b $c')
    })

    test('parses parameters from parameterNames field', () => {
      const block: Block = {
        type: 'procedures_defnoreturn',
        fields: {
          NAME: 'test'
        },
        mutation: {
          parameterNames: 'x, y'
        }
      }

      const result = procedureBlocks.generateProcedureDefinition(block)
      expect(result.format()).toContain('$x $y')
    })

    test('handles no mutation', () => {
      const block: Block = {
        type: 'procedures_defnoreturn',
        fields: {
          NAME: 'test'
        }
      }

      const result = procedureBlocks.generateProcedureDefinition(block)
      expect(result.format()).toContain('(def (p$test)')
    })
  })

  describe('parseProcedureCallArgs', () => {
    test('parses multiple arguments correctly', () => {
      const block: Block = {
        type: 'procedures_callnoreturn',
        mutation: {
          name: 'test'
        },
        values: {
          ARG0: { type: 'text' },
          ARG1: { type: 'math_number' },
          ARG2: { type: 'logic_boolean' }
        }
      }

      const result = procedureBlocks.generateProcedureCall(block)
      // Should call valueToCode for each argument
      expect(mockGenerator.valueToCode).toHaveBeenCalledTimes(3)
    })

    test('handles no arguments', () => {
      const block: Block = {
        type: 'procedures_callnoreturn',
        mutation: {
          name: 'test'
        }
      }

      const result = procedureBlocks.generateProcedureCall(block)
      expect(result.format()).toBe('((get-var p$test))')
    })
  })
})
