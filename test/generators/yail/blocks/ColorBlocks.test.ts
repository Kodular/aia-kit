import { describe, test, expect, beforeEach, vi } from 'vitest'
import ColorBlocks from '../../../../src/generators/yail/blocks/ColorBlocks.js'
import { Scheme } from '../../../../src/generators/yail/ast/SchemeAST.js'
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

describe('ColorBlocks', () => {
  let colorBlocks: ColorBlocks

  beforeEach(() => {
    colorBlocks = new ColorBlocks(mockGenerator)
    colorBlocks.registerBlocks()  // Manually register blocks in tests
    mockRegister.mockClear()
    mockStatementToCode.mockClear()
    mockValueToCode.mockClear()
  })

  describe('generateMakeColor', () => {
    test('generates make color with color list', () => {
      const block: Block = {
        type: 'color_make_color',
        values: {
          COLORLIST: { type: 'test' }
        }
      }

      const result = colorBlocks.generateMakeColor(block)
      expect(result.format()).toContain('call-yail-primitive make-color')
    })
  })

  describe('color generation methods', () => {
    test('generateColorFromHex with light gray', () => {
      const block: Block = {
        type: 'color_light_gray',
        fields: { COLOR: '#C0C0C0' }
      }
      const result = colorBlocks.generateColorFromHex(block)
      expect(result.format()).toBe('-4144960')  // Expected numeric value for #C0C0C0
    })

    test('generateColorFromHex with white', () => {
      const block: Block = {
        type: 'color_white',
        fields: { COLOR: '#FFFFFF' }
      }
      const result = colorBlocks.generateColorFromHex(block)
      expect(result.format()).toBe('-1')  // Expected numeric value for #FFFFFF
    })

    test('generateColorFromHex with black', () => {
      const block: Block = {
        type: 'color_black',
        fields: { COLOR: '#000000' }
      }
      const result = colorBlocks.generateColorFromHex(block)
      expect(result.format()).toBe('-16777216')  // Expected numeric value for #000000
    })

    test('generateColorFromHex with red', () => {
      const block: Block = {
        type: 'color_red',
        fields: { COLOR: '#FF0000' }
      }
      const result = colorBlocks.generateColorFromHex(block)
      expect(result.format()).toBe('-65536')  // Expected numeric value for #FF0000
    })

    test('generateColorFromHex with green', () => {
      const block: Block = {
        type: 'color_green',
        fields: { COLOR: '#00FF00' }
      }
      const result = colorBlocks.generateColorFromHex(block)
      expect(result.format()).toBe('-16711936')  // Expected numeric value for #00FF00
    })

    test('generateColorFromHex with blue', () => {
      const block: Block = {
        type: 'color_blue',
        fields: { COLOR: '#0000FF' }
      }
      const result = colorBlocks.generateColorFromHex(block)
      expect(result.format()).toBe('-16776961')  // Expected numeric value for #0000FF
    })
  })

  describe('generateSplitColor', () => {
    test('generates split color with color value', () => {
      const block: Block = {
        type: 'color_split_color',
        values: {
          COLOR: { type: 'test' }
        }
      }

      const result = colorBlocks.generateSplitColor(block)
      expect(result.format()).toContain('call-yail-primitive split-color')
    })
  })
})
