import { Scheme, SchemeExpr } from '../ast/SchemeAST.js'
import { yailGlobalDef, yailPrimitiveCall } from '../ast/YailConstructs.js'
import { YAIL_TYPES } from '../../../types.js'
import type { Block } from '../../../types.js'
import type YailGenerator from '../YailGenerator.js'

export default class VariableBlocks {
  constructor(private generator: YailGenerator) {}

  registerBlocks(): void {
    this.generator.register('variables_get', (block) => this.generateVariableGet(block))
    this.generator.register('variables_set', (block) => this.generateVariableSet(block))
    this.generator.register('lexical_variable_set', (block) => this.generateLexicalVariableSet(block))
    this.generator.register('lexical_variable_get', (block) => this.generateLexicalVariableGet(block))
    this.generator.register('local_declaration_statement', (block) => this.generateLocalDeclaration(block))
    this.generator.register('local_declaration_expression', (block) => this.generateLocalDeclarationExpression(block))
    this.generator.register('global_declaration', (block) => this.generateGlobalVariableDefinition(block))
  }

  generateVariableGet(block: Block): SchemeExpr {
    const varName = block.fields?.VAR || 'unknown'
    return Scheme.list(
      Scheme.symbol('get-var'),
      Scheme.symbol(`g$${varName}`)
    )
  }

  generateVariableSet(block: Block): SchemeExpr {
    const varName = block.fields?.VAR || 'unknown'
    const valueBlock = block.values?.VALUE
    this.generator.trackVariableType(varName, valueBlock)

    const valueExpr = this.generator.valueToCode(valueBlock)
    return Scheme.list(
      Scheme.symbol('set-var!'),
      Scheme.symbol(`g$${varName}`),
      valueExpr
    )
  }

  generateLexicalVariableSet(block: Block): SchemeExpr {
    const varName = block.fields?.VAR || ''
    const lexVarName = varName.startsWith('global ')
      ? `g$${varName.substring(7)}`
      : `g$${varName}`
    const valueBlock = block.values?.VALUE
    this.generator.trackVariableType(block.fields?.VAR, valueBlock)

    const valueExpr = this.generator.valueToCode(valueBlock)
    return Scheme.list(
      Scheme.symbol('set-var!'),
      Scheme.symbol(lexVarName),
      valueExpr
    )
  }

  generateLexicalVariableGet(block: Block): SchemeExpr {
    const lexGetVarName = block.fields?.VAR || ''
    if (lexGetVarName.startsWith('global ')) {
      const globalVarName = lexGetVarName.substring(7)
      return Scheme.list(
        Scheme.symbol('get-var'),
        Scheme.symbol(`g$${globalVarName}`)
      )
    } else {
      return Scheme.list(
        Scheme.symbol('lexical-value'),
        Scheme.symbol(`$${lexGetVarName}`)
      )
    }
  }

  generateLocalDeclaration(block: Block): SchemeExpr {
    const localVars: Array<[string, SchemeExpr]> = []

    if (block.mutation?.localnames) {
      const varNames = block.mutation.localnames.split(',')
      varNames.forEach((varName: string, index: number) => {
        const trimmedName = varName.trim()
        const initValue = block.values?.[`DECL${index}`]
          ? this.generator.valueToCode(block.values[`DECL${index}`])
          : Scheme.string('')
        localVars.push([`$${trimmedName}`, initValue])
      })
    }

    if (localVars.length > 0) {
      const bodyStatements = block.statements?.STACK
        ? this.generator.statementToCode(block.statements.STACK)
        : []
      const bodyExpr = bodyStatements.length === 1
        ? bodyStatements[0]
        : (bodyStatements.length > 1 ? Scheme.begin(...bodyStatements) : Scheme.atom(''))
      return Scheme.let(localVars, bodyExpr)
    } else {
      const bodyStatements = block.statements?.STACK
        ? this.generator.statementToCode(block.statements.STACK)
        : []
      return bodyStatements.length === 1 ? bodyStatements[0] : Scheme.begin(...bodyStatements)
    }
  }

  generateGlobalVariableDefinition(block: Block): SchemeExpr {
    const varName = block.fields?.NAME || 'unknown'
    const valueExpr = this.generator.valueToCode(block.values?.VALUE)
    return yailGlobalDef(varName, valueExpr)
  }

  generateIncrement(block: Block): SchemeExpr {
    const varName = block.fields?.VAR || 'unknown'
    const varGet = Scheme.list(Scheme.symbol('get-var'), Scheme.symbol(`g$${varName}`))
    const incrementExpr = block.values?.VALUE
      ? this.generator.valueToCode(block.values.VALUE)
      : Scheme.atom(1)
    const addCall = yailPrimitiveCall(
      '+',
      [varGet, incrementExpr],
      [YAIL_TYPES.NUMBER, YAIL_TYPES.NUMBER],
      '+'
    )

    return Scheme.list(
      Scheme.symbol('set-var!'),
      Scheme.symbol(`g$${varName}`),
      addCall
    )
  }

  generateDecrement(block: Block): SchemeExpr {
    const varName = block.fields?.VAR || 'unknown'
    const varGet = Scheme.list(Scheme.symbol('get-var'), Scheme.symbol(`g$${varName}`))
    const decrementExpr = block.values?.VALUE
      ? this.generator.valueToCode(block.values.VALUE)
      : Scheme.atom(1)
    const subCall = yailPrimitiveCall(
      '-',
      [varGet, decrementExpr],
      [YAIL_TYPES.NUMBER, YAIL_TYPES.NUMBER],
      '-'
    )

    return Scheme.list(
      Scheme.symbol('set-var!'),
      Scheme.symbol(`g$${varName}`),
      subCall
    )
  }

  generateLocalDeclarationExpression(block: Block): SchemeExpr {
    const localVars: Array<[string, SchemeExpr]> = []

    if (block.mutation?.localnames) {
      const varNames = block.mutation.localnames.split(',')
      varNames.forEach((varName: string, index: number) => {
        const trimmedName = varName.trim()
        const initValue = block.values?.[`DECL${index}`]
          ? this.generator.valueToCode(block.values[`DECL${index}`])
          : Scheme.string('')
        localVars.push([`$${trimmedName}`, initValue])
      })
    }

    let bodyExpr: SchemeExpr
    if (block.values?.RETURN) {
      bodyExpr = this.generator.valueToCode(block.values.RETURN)
    } else {
      bodyExpr = Scheme.atom(0)
    }

    if (localVars.length > 0) {
      return Scheme.let(localVars, bodyExpr)
    } else {
      return bodyExpr
    }
  }
}
