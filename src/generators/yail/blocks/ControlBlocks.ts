import { Scheme, SchemeExpr } from '../ast/SchemeAST.js'
import { yailPrimitiveCall } from '../ast/YailConstructs.js'
import { YAIL_TYPES } from '../../../types.js'
import type { Block } from '../../../types.js'
import type YailGenerator from '../YailGenerator.js'

export default class ControlBlocks {
  constructor(private generator: YailGenerator) {}

  registerBlocks(): void {
    this.generator.register('controls_if', (block) => this.generateIfStatement(block))
    this.generator.register('controls_repeat_ext', (block) => this.generateRepeatLoop(block))
    this.generator.register('controls_whileUntil', (block) => this.generateWhileLoop(block))
    this.generator.register('controls_forEach', (block) => this.generateForEachLoop(block))
    this.generator.register('controls_for', (block) => this.generateForRangeLoop(block))
    this.generator.register('controls_choose', (block) => this.generateChooseStatement(block))
    this.generator.register('controls_do_then_return', (block) => this.generateDoThenReturn(block))

    // Missing control blocks
    this.generator.register('controls_for_each_dict', (block) => this.generateForEachDictLoop(block))
    this.generator.register('controls_break', (block) => this.generateBreak(block))
    this.generator.register('controls_forRange', (block) => this.generateForRangeLoop(block)) // Alias
    this.generator.register('for_lexical_variable_get', (block) => this.generateForLexicalVariableGet(block))
    this.generator.register('controls_while', (block) => this.generateWhileLoop(block)) // Alias
    this.generator.register('controls_eval_but_ignore', (block) => this.generateEvalButIgnore(block))
    this.generator.register('controls_nothing', (block) => this.generateNothing(block))
    this.generator.register('controls_openAnotherScreen', (block) => this.generateOpenAnotherScreen(block))
    this.generator.register('controls_openAnotherScreenWithStartValue', (block) => this.generateOpenAnotherScreenWithStartValue(block))
    this.generator.register('controls_getStartValue', (block) => this.generateGetStartValue(block))
    this.generator.register('controls_closeScreen', (block) => this.generateCloseScreen(block))
    this.generator.register('controls_closeScreenWithValue', (block) => this.generateCloseScreenWithValue(block))
    this.generator.register('controls_closeApplication', (block) => this.generateCloseApplication(block))
    this.generator.register('controls_getPlainStartText', (block) => this.generateGetPlainStartText(block))
    this.generator.register('controls_closeScreenWithPlainText', (block) => this.generateCloseScreenWithPlainText(block))
  }

  generateIfStatement(block: Block): SchemeExpr {
    const conditionExpr = this.generator.valueToCode(block.values?.IF0)
    const thenBranch = this.generator.statementToCode(block.statements?.DO0)
    const elseBranch = block.statements?.ELSE
      ? this.generator.statementToCode(block.statements.ELSE)
      : null

    const thenExpr = Scheme.begin(...thenBranch)
    const elseExpr = elseBranch ? Scheme.begin(...elseBranch) : undefined

    return Scheme.if(conditionExpr, thenExpr, elseExpr)
  }

  generateRepeatLoop(block: Block): SchemeExpr {
    const timesExpr = this.generator.valueToCode(block.values?.TIMES)
    const body = this.generator.statementToCode(block.statements?.DO)

    const lambdaExpr = Scheme.list(Scheme.symbol('lambda'), Scheme.list(), Scheme.begin(...body))

    return yailPrimitiveCall(
      'yail-repeat',
      [timesExpr, lambdaExpr],
      [YAIL_TYPES.NUMBER, YAIL_TYPES.PROCEDURE],
      'repeat'
    )
  }

  generateWhileLoop(block: Block): SchemeExpr {
    const conditionExpr = this.generator.valueToCode(block.values?.TEST)
    const body = this.generator.statementToCode(block.statements?.STATEMENT)

    const conditionLambda = Scheme.list(Scheme.symbol('lambda'), Scheme.list(), conditionExpr)
    const bodyLambda = Scheme.list(Scheme.symbol('lambda'), Scheme.list(), Scheme.begin(...body))

    return yailPrimitiveCall(
      'yail-while',
      [conditionLambda, bodyLambda],
      [YAIL_TYPES.PROCEDURE, YAIL_TYPES.PROCEDURE],
      'while'
    )
  }

  generateForEachLoop(block: Block): SchemeExpr {
    const variable = block.fields?.VAR || 'item'
    const listExpr = this.generator.valueToCode(block.values?.LIST)
    const body = this.generator.statementToCode(block.statements?.DO)

    const varSymbol = Scheme.symbol(variable)
    const lambdaExpr = Scheme.list(Scheme.symbol('lambda'), Scheme.list(varSymbol), Scheme.begin(...body))

    return yailPrimitiveCall(
      'yail-for-each',
      [lambdaExpr, listExpr],
      [YAIL_TYPES.PROCEDURE, YAIL_TYPES.LIST],
      'for each'
    )
  }

  generateForRangeLoop(block: Block): SchemeExpr {
    const variable = block.fields?.VAR || 'i'
    const startExpr = this.generator.valueToCode(block.values?.FROM)
    const endExpr = this.generator.valueToCode(block.values?.TO)
    const stepExpr = block.values?.BY ? this.generator.valueToCode(block.values.BY) : Scheme.atom(1)
    const body = this.generator.statementToCode(block.statements?.DO)

    const varSymbol = Scheme.symbol(variable)
    const lambdaExpr = Scheme.list(Scheme.symbol('lambda'), Scheme.list(varSymbol), Scheme.begin(...body))

    return yailPrimitiveCall(
      'yail-for-range',
      [lambdaExpr, startExpr, endExpr, stepExpr],
      [YAIL_TYPES.PROCEDURE, YAIL_TYPES.NUMBER, YAIL_TYPES.NUMBER, YAIL_TYPES.NUMBER],
      'for range'
    )
  }

  generateChooseStatement(block: Block): SchemeExpr {
    const testExpr = this.generator.valueToCode(block.values?.TEST)
    const thenExpr = this.generator.valueToCode(block.values?.THENRETURN)
    const elseExpr = this.generator.valueToCode(block.values?.ELSERETURN)

    return Scheme.if(testExpr, thenExpr, elseExpr)
  }

  generateDoThenReturn(block: Block): SchemeExpr {
    const body = this.generator.statementToCode(block.statements?.STACK)
    const returnExpr = this.generator.valueToCode(block.values?.RETURN)

    if (body.length > 0 && returnExpr) {
      return Scheme.begin(...body, returnExpr)
    } else if (returnExpr) {
      return returnExpr
    } else if (body.length > 0) {
      return body.length === 1 ? body[0] : Scheme.begin(...body)
    } else {
      return Scheme.string('')
    }
  }

  generateForEachDictLoop(block: Block): SchemeExpr {
    const keyName = '$local_' + (block.fields?.KEY || 'key')
    const valueName = '$local_' + (block.fields?.VALUE || 'value')
    const loopIndexName = 'item'

    const body = this.generator.statementToCode(block.statements?.DO)
    const dictExpr = this.generator.valueToCode(block.values?.DICT) || this.getEmptyDict()

    // This is a complex block that requires let bindings and foreach
    const getListCode = Scheme.list(Scheme.symbol('get-var'), Scheme.symbol(loopIndexName))
    const getKeyCode = this.generateGetListItemCode(getListCode, 1)
    const getValueCode = this.generateGetListItemCode(getListCode, 2)
    const setKeyCode = Scheme.list(Scheme.symbol(keyName), getKeyCode)
    const setValueCode = Scheme.list(Scheme.symbol(valueName), getValueCode)

    const letCode = Scheme.list(
      Scheme.symbol('let'),
      Scheme.list(setKeyCode, setValueCode),
      ...body
    )

    return Scheme.list(
      Scheme.symbol('foreach'),
      Scheme.symbol(loopIndexName),
      letCode,
      dictExpr
    )
  }

  generateBreak(block: Block): SchemeExpr {
    return Scheme.list(Scheme.symbol('*yail-break*'), Scheme.false())
  }

  generateForLexicalVariableGet(block: Block): SchemeExpr {
    // This should delegate to the variable blocks
    return this.generator.valueToCode(block) // Recursive call will handle it
  }

  generateEvalButIgnore(block: Block): SchemeExpr {
    const toEval = this.generator.valueToCode(block.values?.VALUE) || Scheme.false()
    return Scheme.begin(toEval, Scheme.string('ignored'))
  }

  generateNothing(block: Block): SchemeExpr {
    return Scheme.symbol('*the-null-value*')
  }

  generateOpenAnotherScreen(block: Block): SchemeExpr {
    const screenName = this.generator.valueToCode(block.values?.SCREEN) || Scheme.symbol('null')

    return yailPrimitiveCall(
      'open-another-screen',
      [screenName],
      [YAIL_TYPES.TEXT],
      'open another screen'
    )
  }

  generateOpenAnotherScreenWithStartValue(block: Block): SchemeExpr {
    const screenName = this.generator.valueToCode(block.values?.SCREENNAME) || Scheme.symbol('null')
    const startValue = this.generator.valueToCode(block.values?.STARTVALUE) || Scheme.symbol('null')

    return yailPrimitiveCall(
      'open-another-screen-with-start-value',
      [screenName, startValue],
      [YAIL_TYPES.TEXT, YAIL_TYPES.ANY],
      'open another screen with start value'
    )
  }

  generateGetStartValue(block: Block): SchemeExpr {
    return yailPrimitiveCall(
      'get-start-value',
      [],
      [],
      'get start value'
    )
  }

  generateCloseScreen(block: Block): SchemeExpr {
    return yailPrimitiveCall(
      'close-screen',
      [],
      [],
      'close screen'
    )
  }

  generateCloseScreenWithValue(block: Block): SchemeExpr {
    const value = this.generator.valueToCode(block.values?.SCREEN) || Scheme.symbol('null')

    return yailPrimitiveCall(
      'close-screen-with-value',
      [value],
      [YAIL_TYPES.ANY],
      'close screen with value'
    )
  }

  generateCloseApplication(block: Block): SchemeExpr {
    return yailPrimitiveCall(
      'close-application',
      [],
      [],
      'close application'
    )
  }

  generateGetPlainStartText(block: Block): SchemeExpr {
    return yailPrimitiveCall(
      'get-plain-start-text',
      [],
      [],
      'get plain start text'
    )
  }

  generateCloseScreenWithPlainText(block: Block): SchemeExpr {
    const text = this.generator.valueToCode(block.values?.TEXT) || Scheme.false()

    return yailPrimitiveCall(
      'close-screen-with-plain-text',
      [text],
      [YAIL_TYPES.TEXT],
      'close screen with plain text'
    )
  }

  private getEmptyDict(): SchemeExpr {
    return Scheme.list(
      Scheme.symbol('make'),
      Scheme.symbol('com.google.appinventor.components.runtime.util.YailDictionary')
    )
  }

  private generateGetListItemCode(getListCode: SchemeExpr, index: number): SchemeExpr {
    return yailPrimitiveCall(
      'yail-list-get-item',
      [getListCode, Scheme.atom(index)],
      [YAIL_TYPES.LIST, YAIL_TYPES.NUMBER],
      'select list item'
    )
  }
}
