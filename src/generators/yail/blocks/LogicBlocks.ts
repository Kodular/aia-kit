import { Scheme, SchemeExpr } from '../ast/SchemeAST.js'
import { yailAndDelayed, yailOrDelayed, yailPrimitiveCall } from '../ast/YailConstructs.js'
import { YAIL_TYPES } from '../../../types.js'
import type { Block } from '../../../types.js'
import type YailGenerator from '../YailGenerator.js'

export default class LogicBlocks {
  constructor(private generator: YailGenerator) {}

  registerBlocks(): void {
    this.generator.register('logic_boolean', (block) => this.generateBoolean(block))
    this.generator.register('logic_operation', (block) => this.generateLogicOperation(block))
    this.generator.register('logic_negate', (block) => this.generateLogicNegate(block))
    this.generator.register('logic_compare', (block) => this.generateComparison(block))
    this.generator.register('logic_null', (block) => this.generateNullCheck(block))
    this.generator.register('logic_ternary', (block) => this.generateTernary(block))
    this.generator.register('logic_or', (block) => this.generateLogicOr(block))
    this.generator.register('logic_false', (block) => this.generateLogicFalse(block))
  }

  generateBoolean(block: Block): SchemeExpr {
    return block.fields?.BOOL === 'TRUE' ? Scheme.true() : Scheme.false()
  }

  generateLogicOperation(block: Block): SchemeExpr {
    const op = block.fields?.OP || 'AND'
    const a = this.generator.valueToCode(block.values?.A)
    const b = this.generator.valueToCode(block.values?.B)

    const aScheme = a
    const bScheme = b

    if (op === 'AND') {
      return yailAndDelayed([aScheme, bScheme])
    } else if (op === 'OR') {
      return yailOrDelayed([aScheme, bScheme])
    } else {
      const opMap: { [key: string]: string } = { 'AND': 'and', 'OR': 'or' }
      const yailOp = opMap[op] || 'and'
      return yailPrimitiveCall(
        yailOp,
        [aScheme, bScheme],
        [YAIL_TYPES.ANY, YAIL_TYPES.ANY],
        yailOp
      )
    }
  }

  generateLogicNegate(block: Block): SchemeExpr {
    const bool = this.generator.valueToCode(block.values?.BOOL)
    const boolExpr = bool
    return yailPrimitiveCall(
      'yail-not',
      [boolExpr],
      [YAIL_TYPES.ANY],
      'not'
    )
  }

  generateComparison(block: Block): SchemeExpr {
    const op = block.fields?.OP || 'EQ'
    const a = this.generator.valueToCode(block.values?.A)
    const b = this.generator.valueToCode(block.values?.B)

    const opMap: { [key: string]: string } = {
      'EQ': 'yail-equal?',
      'NEQ': 'yail-not-equal?',
      'LT': '<',
      'LTE': '<=',
      'GT': '>',
      'GTE': '>='
    }

    const opNameMap: { [key: string]: string } = {
      'EQ': 'equal',
      'NEQ': 'not-equal',
      'LT': 'less-than',
      'LTE': 'less-than-equal',
      'GT': 'greater-than',
      'GTE': 'greater-than-equal'
    }

    const yailOp = opMap[op]
    const opName = opNameMap[op]

    const aExpr = a
    const bExpr = b
    return yailPrimitiveCall(
      yailOp,
      [aExpr, bExpr],
      [YAIL_TYPES.ANY, YAIL_TYPES.ANY],
      opName
    )
  }

  generateNullCheck(block: Block): SchemeExpr {
    const value = this.generator.valueToCode(block.values?.VALUE)
    const valueExpr = value
    const nullExpr = Scheme.symbol('*the-null-value*')
    return yailPrimitiveCall(
      'yail-equal?',
      [valueExpr, nullExpr],
      [YAIL_TYPES.ANY, YAIL_TYPES.ANY],
      'is null?'
    )
  }

  generateTernary(block: Block): SchemeExpr {
    const condition = this.generator.valueToCode(block.values?.IF)
    const thenValue = this.generator.valueToCode(block.values?.THEN)
    const elseValue = this.generator.valueToCode(block.values?.ELSE)

    const conditionExpr = condition
    const thenExpr = thenValue
    const elseExpr = elseValue

    return Scheme.if(conditionExpr, thenExpr, elseExpr)
  }

  generateLogicOr(block: Block): SchemeExpr {
    const a = this.generator.valueToCode(block.values?.A)
    const b = this.generator.valueToCode(block.values?.B)

    const aScheme = a
    const bScheme = b

    return yailOrDelayed([aScheme, bScheme])
  }

  generateLogicFalse(block: Block): SchemeExpr {
    return Scheme.false()
  }

}
