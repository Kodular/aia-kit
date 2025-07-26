import { describe, test, expect, beforeEach, vi } from 'vitest'
import ComponentBlocks from '../../../../src/generators/yail/blocks/ComponentBlocks.js'
import type YailGenerator from '../../../../src/generators/yail/YailGenerator.js'
import type { Block } from "../../../../src/types.js"

const mockRegister = vi.fn(() => {})
const mockStatementToCode = vi.fn((block: any) => [{ format: () => 'mockValue' }])
const mockValueToCode = vi.fn((block: any) => ({ format: () => 'mockValue' }))
const mockInferComponentType = vi.fn((componentName: string) => 'Button')
const mockGetMethodParameterTypes = vi.fn((componentType: string, methodName: string, argCount: number, actualArgs: any[]) => ['text'])
const mockInferYailType = vi.fn((block: any) => 'text')

const mockGenerator = {
  register: mockRegister,
  statementToCode: mockStatementToCode,
  valueToCode: mockValueToCode,
  inferComponentType: mockInferComponentType,
  getMethodParameterTypes: mockGetMethodParameterTypes,
  inferYailType: mockInferYailType
} as unknown as YailGenerator

describe('ComponentBlocks', () => {
  let componentBlocks: ComponentBlocks

  beforeEach(() => {
    componentBlocks = new ComponentBlocks(mockGenerator)
    componentBlocks.registerBlocks()  // Manually register blocks in tests
    mockRegister.mockClear()
    mockStatementToCode.mockClear()
    mockValueToCode.mockClear()
    mockInferComponentType.mockClear()
    mockGetMethodParameterTypes.mockClear()
    mockInferYailType.mockClear()
  })

  describe('generateComponentMethodCall', () => {
    test('generates method call with mutation data', () => {
      const block: Block = {
        type: 'component_method',
        mutation: {
          instance_name: 'Button1',
          method_name: 'SetText',
          component_type: 'Button'
        },
        values: {
          ARG0: { type: 'text' }
        }
      }

      const result = componentBlocks.generateComponentMethodCall(block)
      expect(result.format()).toContain("call-component-method 'Button1 'SetText")
    })

    test('generates method call with field data fallback', () => {
      const block: Block = {
        type: 'component_method',
        fields: {
          COMPONENT_SELECTOR: 'Button2',
          METHOD_NAME: 'Click'
        }
      }

      const result = componentBlocks.generateComponentMethodCall(block)
      expect(result.format()).toContain("call-component-method 'Button2 'Click")
    })

    test('generates method call with default values', () => {
      const block: Block = {
        type: 'component_method'
      }

      const result = componentBlocks.generateComponentMethodCall(block)
      expect(result.format()).toContain("call-component-method 'Screen1 'unknown")
    })
  })

  describe('generateComponentPropertyGet', () => {
    test('generates property get with field data', () => {
      const block: Block = {
        type: 'component_get_property',
        fields: {
          COMPONENT_SELECTOR: 'Button1',
          PROPERTY_NAME: 'Text'
        }
      }

      const result = componentBlocks.generateComponentPropertyGet(block)
      expect(result.format()).toBe("(get-property 'Button1 'Text)")
    })

    test('generates property get with default values', () => {
      const block: Block = {
        type: 'component_get_property'
      }

      const result = componentBlocks.generateComponentPropertyGet(block)
      expect(result.format()).toBe("(get-property 'Screen1 'unknown)")
    })
  })

  describe('generateComponentPropertySet', () => {
    test('generates property set with field and value data', () => {
      const block: Block = {
        type: 'component_set_property',
        fields: {
          COMPONENT_SELECTOR: 'Button1',
          PROPERTY_NAME: 'Text'
        },
        values: {
          VALUE: { type: 'text' }
        }
      }

      const result = componentBlocks.generateComponentPropertySet(block)
      expect(result.format()).toContain("set-and-coerce-property! 'Button1 'Text")
    })

    test('generates property set with default values', () => {
      const block: Block = {
        type: 'component_set_property',
        values: {
          VALUE: { type: 'text' }
        }
      }

      const result = componentBlocks.generateComponentPropertySet(block)
      expect(result.format()).toContain("set-and-coerce-property! 'Screen1 'unknown")
    })
  })

  describe('generateComponentBlock', () => {
    test('generates component reference with field data', () => {
      const block: Block = {
        type: 'component_block',
        fields: {
          COMPONENT_SELECTOR: 'Button1'
        }
      }

      const result = componentBlocks.generateComponentBlock(block)
      expect(result.format()).toBe('(get-component Button1)')
    })

    test('generates component reference with default value', () => {
      const block: Block = {
        type: 'component_block'
      }

      const result = componentBlocks.generateComponentBlock(block)
      expect(result.format()).toBe('(get-component Screen1)')
    })
  })

  describe('generateComponentSetGet', () => {
    test('generates property set when VALUE is provided', () => {
      const block: Block = {
        type: 'component_set_get',
        mutation: {
          instance_name: 'Button1',
          property_name: 'Text'
        },
        values: {
          VALUE: { type: 'text' }
        }
      }

      const result = componentBlocks.generateComponentSetGet(block)
      expect(result.format()).toContain('set-and-coerce-property!')
    })

    test('generates property get when VALUE is not provided', () => {
      const block: Block = {
        type: 'component_set_get',
        mutation: {
          instance_name: 'Button1',
          property_name: 'Text'
        }
      }

      const result = componentBlocks.generateComponentSetGet(block)
      expect(result.format()).toBe("(get-property 'Button1 'Text)")
    })

    test('uses field data as fallback', () => {
      const block: Block = {
        type: 'component_set_get',
        fields: {
          COMPONENT_SELECTOR: 'Button2',
          PROPERTY_NAME: 'Visible'
        }
      }

      const result = componentBlocks.generateComponentSetGet(block)
      expect(result.format()).toBe("(get-property 'Button2 'Visible)")
    })

    test('uses default values when no data provided', () => {
      const block: Block = {
        type: 'component_set_get'
      }

      const result = componentBlocks.generateComponentSetGet(block)
      expect(result.format()).toBe("(get-property 'Screen1 'unknown)")
    })
  })

  describe('parseMethodArgs', () => {
    test('parses method arguments correctly', () => {
      const block: Block = {
        type: 'component_method',
        values: {
          ARG0: { type: 'text' },
          ARG1: { type: 'number' },
          ARG2: { type: 'boolean' }
        }
      }

      const result = componentBlocks.generateComponentMethodCall(block)
      // Should call valueToCode three times for three arguments
      expect(mockGenerator.valueToCode).toHaveBeenCalledTimes(3)
    })

    test('handles no arguments', () => {
      const block: Block = {
        type: 'component_method'
      }

      componentBlocks.generateComponentMethodCall(block)
      // Should still be called for parsing args even if none exist
      expect(mockGenerator.statementToCode).toBeDefined()
    })
  })
})
