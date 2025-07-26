import { Scheme, SchemeExpr } from '../ast/SchemeAST.js'
import { yailProcedureDef } from '../ast/YailConstructs.js'
import type { Block } from '../../../types.js'
import type YailGenerator from '../YailGenerator.js'

export default class ProcedureBlocks {
  constructor(private generator: YailGenerator) {}

  registerBlocks(): void {
    this.generator.register('procedures_defnoreturn', (block) => this.generateProcedureDefinition(block))
    this.generator.register('procedures_defreturn', (block) => this.generateProcedureDefinition(block))
    this.generator.register('procedures_callnoreturn', (block) => this.generateProcedureCall(block))
    this.generator.register('procedures_callreturn', (block) => this.generateProcedureCall(block))
    this.generator.register('procedure_lexical_variable_get', (block) => this.generateProcedureLexicalVariableGet(block))
    this.generator.register('procedures_do_then_return', (block) => this.generateProceduresDoThenReturn(block))
  }

  generateProcedureDefinition(block: Block): SchemeExpr {
    const procName = block.fields?.NAME || 'unnamed'
    const hasReturn = block.type === 'procedures_defreturn'

    const params = this.parseProcedureParams(block.mutation)

    let bodyScheme: SchemeExpr[]
    if (hasReturn) {
      const bodyStatements = block.statements?.STACK
        ? this.generator.statementToCode(block.statements.STACK)
        : []
      const returnValue = this.generator.valueToCode(block.values?.RETURN)

      if (bodyStatements.length > 0) {
        bodyScheme = [Scheme.begin(...bodyStatements), returnValue]
      } else {
        bodyScheme = [returnValue]
      }
    } else {
      const bodyStatements = block.statements?.STACK
        ? this.generator.statementToCode(block.statements.STACK)
        : []
      bodyScheme = bodyStatements
    }

    return yailProcedureDef(
      procName,
      params,
      bodyScheme,
      hasReturn
    )
  }

  generateProcedureCall(block: Block): SchemeExpr {
    const procName = (block.mutation?.name) ||
      block.fields?.PROCNAME ||
      block.fields?.NAME ||
      'unknown'

    const args = this.parseProcedureCallArgs(block)
    const argExprs = args.map(arg => {
      const argCode = this.generator.valueToCode(block.values?.[arg])
      return argCode
    })

    const procVar = Scheme.list(Scheme.symbol('get-var'), Scheme.symbol(`p$${procName}`))
    return Scheme.list(procVar, ...argExprs)
  }

  generateProcedureReturn(block: Block): SchemeExpr | SchemeExpr[] {
    const value = block.values?.VALUE
      ? this.generator.valueToCode(block.values.VALUE)
      : []
    return value
  }

  generateProcedureParameter(block: Block): SchemeExpr {
    const paramName = block.fields?.VAR || 'param'
    return Scheme.symbol(`$${paramName}`)
  }

  private parseProcedureParams(mutation: any): string[] {
    if (!mutation) return []

    if (mutation.parameters) {
      return mutation.parameters.split(',').map((param: string) => param.trim())
    }

    if (mutation.parameterNames) {
      return mutation.parameterNames.split(',').map((param: string) => param.trim())
    }

    return []
  }

  private parseProcedureCallArgs(block: Block): string[] {
    const args: string[] = []
    let i = 0
    while (block.values?.[`ARG${i}`]) {
      args.push(`ARG${i}`)
      i++
    }
    return args
  }

  generateProcedureWithStatement(block: Block): SchemeExpr {
    const body = this.generator.statementToCode(block.statements?.STACK)
    return body.length === 1 ? body[0] : Scheme.begin(...body)
  }

  generateProcedureIfReturn(block: Block): SchemeExpr {
    const condition = this.generator.valueToCode(block.values?.CONDITION)
    const value = this.generator.valueToCode(block.values?.VALUE)

    const conditionExpr = condition
    const valueExpr = value

    return Scheme.if(conditionExpr, valueExpr)
  }

  generateProcedureLexicalVariableGet(block: Block): SchemeExpr {
    // This delegates to the lexical variable getter from VariableBlocks
    // The implementation should be the same as lexical_variable_get
    const varName = block.fields?.VAR || ''

    if (varName.startsWith('global ')) {
      const globalVarName = varName.substring(7)
      return Scheme.list(
        Scheme.symbol('get-var'),
        Scheme.symbol(`g$${globalVarName}`)
      )
    } else {
      return Scheme.list(
        Scheme.symbol('lexical-value'),
        Scheme.symbol(`$${varName}`)
      )
    }
  }

  generateProceduresDoThenReturn(block: Block): SchemeExpr {
    // This should delegate to the control block do_then_return
    // Since we don't have access to control blocks here, we'll implement it directly
    const statements = block.statements?.STACK
      ? this.generator.statementToCode(block.statements.STACK)
      : []
    const returnValue = this.generator.valueToCode(block.values?.RETURN)

    if (statements.length > 0) {
      return Scheme.begin(...statements, returnValue)
    } else {
      return returnValue
    }
  }

}
