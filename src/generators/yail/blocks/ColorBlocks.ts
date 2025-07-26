import { Scheme, SchemeExpr } from '../ast/SchemeAST.js'
import { yailPrimitiveCall } from '../ast/YailConstructs.js'
import { YAIL_TYPES } from '../../../types.js'
import type { Block } from '../../../types.js'
import type YailGenerator from '../YailGenerator.js'

export default class ColorBlocks {
  constructor(private generator: YailGenerator) {}

  registerBlocks(): void {
    // Basic color blocks that use hex color conversion
    this.generator.register('color_white', (block) => this.generateColorFromHex(block))
    this.generator.register('color_light_gray', (block) => this.generateColorFromHex(block))
    this.generator.register('color_gray', (block) => this.generateColorFromHex(block))
    this.generator.register('color_blue_gray', (block) => this.generateColorFromHex(block))
    this.generator.register('color_dark_gray', (block) => this.generateColorFromHex(block))
    this.generator.register('color_black', (block) => this.generateColorFromHex(block))
    this.generator.register('color_red', (block) => this.generateColorFromHex(block))
    this.generator.register('color_pink', (block) => this.generateColorFromHex(block))
    this.generator.register('color_purple', (block) => this.generateColorFromHex(block))
    this.generator.register('color_deep_purple', (block) => this.generateColorFromHex(block))
    this.generator.register('color_indigo', (block) => this.generateColorFromHex(block))
    this.generator.register('color_blue', (block) => this.generateColorFromHex(block))
    this.generator.register('color_light_blue', (block) => this.generateColorFromHex(block))
    this.generator.register('color_cyan', (block) => this.generateColorFromHex(block))
    this.generator.register('color_teal', (block) => this.generateColorFromHex(block))
    this.generator.register('color_green', (block) => this.generateColorFromHex(block))
    this.generator.register('color_light_green', (block) => this.generateColorFromHex(block))
    this.generator.register('color_lime', (block) => this.generateColorFromHex(block))
    this.generator.register('color_yellow', (block) => this.generateColorFromHex(block))
    this.generator.register('color_amber', (block) => this.generateColorFromHex(block))
    this.generator.register('color_orange', (block) => this.generateColorFromHex(block))
    this.generator.register('color_deep_orange', (block) => this.generateColorFromHex(block))
    this.generator.register('color_brown', (block) => this.generateColorFromHex(block))

    // Special color blocks
    this.generator.register('color_make_color', (block) => this.generateMakeColor(block))
    this.generator.register('color_split_color', (block) => this.generateSplitColor(block))
  }

  /**
   * Generate color from hex value - matches original Blockly.Yail.color function
   * Converts hex value to numeric value using the formula: -1 * (16^6 - parseInt("0x" + hex.substr(1)))
   */
  generateColorFromHex(block: Block): SchemeExpr {
    const colorHex = block.fields?.COLOR || '#FFFFFF'
    // Convert hex value to numeric value (same as original Blockly generator)
    const hexValue = colorHex.substr(1) // Remove # prefix
    const numericValue = -1 * (Math.pow(16, 6) - parseInt('0x' + hexValue))
    return Scheme.atom(numericValue)
  }

  generateMakeColor(block: Block): SchemeExpr {
    const blackList = yailPrimitiveCall(
      'make-yail-list',
      [Scheme.atom(0), Scheme.atom(0), Scheme.atom(0)],
      [YAIL_TYPES.ANY, YAIL_TYPES.ANY, YAIL_TYPES.ANY],
      'make a list'
    )

    const colorListExpr = this.generator.valueToCode(block.values?.COLORLIST) || blackList

    return yailPrimitiveCall(
      'make-color',
      [colorListExpr],
      [YAIL_TYPES.LIST],
      'make-color'
    )
  }

  generateSplitColor(block: Block): SchemeExpr {
    const colorExpr = this.generator.valueToCode(block.values?.COLOR) || Scheme.atom(-1)

    return yailPrimitiveCall(
      'split-color',
      [colorExpr],
      [YAIL_TYPES.NUMBER],
      'split-color'
    )
  }
}
