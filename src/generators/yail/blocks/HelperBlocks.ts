import { Scheme, SchemeExpr } from '../ast/SchemeAST.js'
import type { Block } from '../../../types.js'
import type YailGenerator from '../YailGenerator.js'

export default class HelperBlocks {
  constructor(private generator: YailGenerator) {}

  registerBlocks(): void {
    this.generator.register('helpers_dropdown', (block) => this.generateHelpersDropdown(block))
    this.generator.register('helpers_screen_names', (block) => this.generateHelpersScreenNames(block))
    this.generator.register('helpers_assets', (block) => this.generateHelpersAssets(block))
  }

  generateHelpersDropdown(block: Block): SchemeExpr {
    // This is a complex block that requires component database access
    const optionValue = block.fields?.OPTION || ''
    const key = block.extraState?.key_ || ''

    // TODO: Implement full component database integration
    // This would require access to workspace.getComponentDatabase()

    // For now, return a static field reference
    if (key && optionValue) {
      // Basic enum value generation
      const enumValue = Scheme.list(
        Scheme.symbol('static-field'),
        Scheme.symbol(key), // This should be the className from optionList
        Scheme.string(optionValue)
      )

      // TODO: Add protect-enum wrapper for REPL mode
      return enumValue
    }

    return Scheme.string('')
  }

  generateHelpersScreenNames(block: Block): SchemeExpr {
    const screenName = block.fields?.SCREEN || ''
    return Scheme.string(screenName)
  }

  generateHelpersAssets(block: Block): SchemeExpr {
    const assetValue = block.fields?.ASSET || ''
    return Scheme.string(assetValue)
  }
}
