import { describe, test, expect, beforeEach, vi } from 'vitest'
import VariableBlocks from '../../../../src/generators/yail/blocks/VariableBlocks.js'
import type YailGenerator from '../../../../src/generators/yail/YailGenerator.js'
import type { Block } from "../../../../src/types.js"

const mockRegister = vi.fn(() => {})
const mockStatementToCode = vi.fn((block: any) => [{ format: () => 'mockValue' }])
const mockValueToCode = vi.fn((block: any) => ({ format: () => 'mockValue' }))
const mockTrackVariableType = vi.fn((varName: string, block: any) => {})
const mockInferYailType = vi.fn((block: any) => 'text')

const mockGenerator = {
  register: mockRegister,
  statementToCode: mockStatementToCode,
  valueToCode: mockValueToCode,
  trackVariableType: mockTrackVariableType,
  inferYailType: mockInferYailType
} as unknown as YailGenerator

describe('VariableBlocks', () => {
  let variableBlocks: VariableBlocks

  beforeEach(() => {
    variableBlocks = new VariableBlocks(mockGenerator)
    variableBlocks.registerBlocks()  // Manually register blocks in tests
    mockRegister.mockClear()
    mockStatementToCode.mockClear()
    mockValueToCode.mockClear()
    mockTrackVariableType.mockClear()
    mockInferYailType.mockClear()
  })

  describe('generateVariableGet', () => {
    test('generates variable get with field name', () => {
      const block: Block = {
        type: 'variables_get',
        fields: {
          VAR: 'myVariable'
        }
      }

      const result = variableBlocks.generateVariableGet(block)
      expect(result.format()).toBe('(get-var g$myVariable)')
    })

    test('defaults to unknown when field is missing', () => {
      const block: Block = {
        type: 'variables_get'
      }

      const result = variableBlocks.generateVariableGet(block)
      expect(result.format()).toBe('(get-var g$unknown)')
    })
  })

  describe('generateVariableSet', () => {
    test('generates variable set with field name and value', () => {
      const block: Block = {
        type: 'variables_set',
        fields: {
          VAR: 'myVariable'
        },
        values: {
          VALUE: { type: 'text' }
        }
      }

      const result = variableBlocks.generateVariableSet(block)
      expect(result.format()).toBe('(set-var! g$myVariable mockValue)')
      expect(mockGenerator.trackVariableType).toHaveBeenCalledWith('myVariable', { type: 'text' })
    })

    test('defaults to unknown when field is missing', () => {
      const block: Block = {
        type: 'variables_set',
        values: {
          VALUE: { type: 'text' }
        }
      }

      const result = variableBlocks.generateVariableSet(block)
      expect(result.format()).toBe('(set-var! g$unknown mockValue)')
    })
  })

  describe('generateLexicalVariableSet', () => {
    test('generates lexical variable set with global prefix removal', () => {
      const block: Block = {
        type: 'lexical_variable_set',
        fields: {
          VAR: 'global myGlobalVar'
        },
        values: {
          VALUE: { type: 'text' }
        }
      }

      const result = variableBlocks.generateLexicalVariableSet(block)
      expect(result.format()).toBe('(set-var! g$myGlobalVar mockValue)')
      expect(mockGenerator.trackVariableType).toHaveBeenCalledWith('global myGlobalVar', { type: 'text' })
    })

    test('generates lexical variable set without global prefix', () => {
      const block: Block = {
        type: 'lexical_variable_set',
        fields: {
          VAR: 'localVar'
        },
        values: {
          VALUE: { type: 'text' }
        }
      }

      const result = variableBlocks.generateLexicalVariableSet(block)
      expect(result.format()).toBe('(set-var! g$localVar mockValue)')
    })

    test('defaults to empty string when field is missing', () => {
      const block: Block = {
        type: 'lexical_variable_set',
        values: {
          VALUE: { type: 'text' }
        }
      }

      const result = variableBlocks.generateLexicalVariableSet(block)
      expect(result.format()).toBe('(set-var! g$ mockValue)')
    })
  })

  describe('generateLexicalVariableGet', () => {
    test('generates global variable get with global prefix', () => {
      const block: Block = {
        type: 'lexical_variable_get',
        fields: {
          VAR: 'global myGlobalVar'
        }
      }

      const result = variableBlocks.generateLexicalVariableGet(block)
      expect(result.format()).toBe('(get-var g$myGlobalVar)')
    })

    test('generates lexical variable get without global prefix', () => {
      const block: Block = {
        type: 'lexical_variable_get',
        fields: {
          VAR: 'localVar'
        }
      }

      const result = variableBlocks.generateLexicalVariableGet(block)
      expect(result.format()).toBe('(lexical-value $localVar)')
    })

    test('defaults to empty string when field is missing', () => {
      const block: Block = {
        type: 'lexical_variable_get'
      }

      const result = variableBlocks.generateLexicalVariableGet(block)
      expect(result.format()).toBe('(lexical-value $)')
    })
  })

  describe('generateLocalDeclaration', () => {
    test('generates local declaration with variables and body', () => {
      const block: Block = {
        type: 'local_declaration_statement',
        mutation: {
          localnames: 'var1,var2,var3'
        },
        values: {
          DECL0: { type: 'text' },
          DECL1: { type: 'math_number' },
          DECL2: { type: 'logic_boolean' }
        },
        statements: {
          STACK: { type: 'text' }
        }
      }

      const result = variableBlocks.generateLocalDeclaration(block)
      expect(result.format()).toContain('(let (($var1 mockValue) ($var2 mockValue) ($var3 mockValue)) mockValue)')
    })

    test('generates local declaration with default values for missing declarations', () => {
      const block: Block = {
        type: 'local_declaration_statement',
        mutation: {
          localnames: 'var1,var2'
        },
        values: {
          DECL0: { type: 'text' }
          // DECL1 is missing
        },
        statements: {
          STACK: { type: 'text' }
        }
      }

      const result = variableBlocks.generateLocalDeclaration(block)
      expect(result.format()).toContain('(let (($var1 mockValue) ($var2 \"\")) mockValue)')
    })

    test('returns body directly when no local variables', () => {
      const block: Block = {
        type: 'local_declaration_statement',
        statements: {
          STACK: { type: 'text' }
        }
      }

      const result = variableBlocks.generateLocalDeclaration(block)
      expect(result.format()).toBe('mockValue')
    })

    test('handles missing statements', () => {
      const block: Block = {
        type: 'local_declaration_statement',
        mutation: {
          localnames: 'var1'
        },
        values: {
          DECL0: { type: 'text' }
        }
      }

      const result = variableBlocks.generateLocalDeclaration(block)
      expect(result.format()).toContain('(let (($var1 mockValue)) )')
    })
  })

  describe('generateGlobalVariableDefinition', () => {
    test('generates global variable definition', () => {
      const block: Block = {
        type: 'global_declaration',
        fields: {
          NAME: 'myGlobal'
        },
        values: {
          VALUE: { type: 'text' }
        }
      }

      const result = variableBlocks.generateGlobalVariableDefinition(block)
      expect(result.format()).toBe('(def g$myGlobal mockValue)')
    })

    test('defaults to unknown when field is missing', () => {
      const block: Block = {
        type: 'global_declaration',
        values: {
          VALUE: { type: 'text' }
        }
      }

      const result = variableBlocks.generateGlobalVariableDefinition(block)
      expect(result.format()).toBe('(def g$unknown mockValue)')
    })
  })

  describe('generateIncrement', () => {
    test('generates increment with custom value', () => {
      const block: Block = {
        type: 'math_change',
        fields: {
          VAR: 'counter'
        },
        values: {
          VALUE: { type: 'math_number' }
        }
      }

      const result = variableBlocks.generateIncrement(block)
      expect(result.format()).toContain('(set-var! g$counter')
      expect(result.format()).toContain('call-yail-primitive +')
      expect(result.format()).toContain('(get-var g$counter)')
    })

    test('generates increment with default value when VALUE is missing', () => {
      const block: Block = {
        type: 'math_change',
        fields: {
          VAR: 'counter'
        }
      }

      const result = variableBlocks.generateIncrement(block)
      expect(result.format()).toContain('(set-var! g$counter')
      expect(result.format()).toContain('call-yail-primitive +')
    })

    test('defaults to unknown when field is missing', () => {
      const block: Block = {
        type: 'math_change'
      }

      const result = variableBlocks.generateIncrement(block)
      expect(result.format()).toContain('(set-var! g$unknown')
    })
  })

  describe('generateDecrement', () => {
    test('generates decrement with custom value', () => {
      const block: Block = {
        type: 'math_decrease',
        fields: {
          VAR: 'counter'
        },
        values: {
          VALUE: { type: 'math_number' }
        }
      }

      const result = variableBlocks.generateDecrement(block)
      expect(result.format()).toContain('(set-var! g$counter')
      expect(result.format()).toContain('call-yail-primitive -')
      expect(result.format()).toContain('(get-var g$counter)')
    })

    test('generates decrement with default value when VALUE is missing', () => {
      const block: Block = {
        type: 'math_decrease',
        fields: {
          VAR: 'counter'
        }
      }

      const result = variableBlocks.generateDecrement(block)
      expect(result.format()).toContain('(set-var! g$counter')
      expect(result.format()).toContain('call-yail-primitive -')
    })

    test('defaults to unknown when field is missing', () => {
      const block: Block = {
        type: 'math_decrease'
      }

      const result = variableBlocks.generateDecrement(block)
      expect(result.format()).toContain('(set-var! g$unknown')
    })
  })
})
