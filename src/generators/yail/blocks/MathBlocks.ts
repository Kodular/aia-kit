import { Scheme, type SchemeExpr } from '../ast/SchemeAST.js'
import { yailPrimitiveCall } from '../ast/YailConstructs.js'
import { YAIL_TYPES, type YailType } from '../../../types.js'
import type { Block } from '../../../types.js'
import type YailGenerator from '../YailGenerator.js'

export default class MathBlocks {
  constructor(private generator: YailGenerator) {}

  registerBlocks(): void {
    this.generator.register('math_number', (block) => this.generateNumber(block))
    this.generator.register('math_number_radix', (block) => this.generateNumberRadix(block))
    this.generator.register('math_arithmetic', (block) => this.generateMathOperation(block))
    this.generator.register('math_subtract', (block) => this.generateSubtract(block))
    this.generator.register('math_division', (block) => this.generateDivision(block))
    this.generator.register('math_power', (block) => this.generatePower(block))
    this.generator.register('math_add', (block) => this.generateAdd(block))
    this.generator.register('math_multiply', (block) => this.generateMultiply(block))
    this.generator.register('math_single', (block) => this.generateSingleMathOperation(block))
    this.generator.register('math_bitwise', (block) => this.generateBitwise(block))
    this.generator.register('math_abs', (block) => this.generateAbs(block))
    this.generator.register('math_neg', (block) => this.generateNeg(block))
    this.generator.register('math_ceiling', (block) => this.generateCeiling(block))
    this.generator.register('math_floor', (block) => this.generateFloor(block))
    this.generator.register('math_trig', (block) => this.generateTrigFunction(block))
    this.generator.register('math_cos', (block) => this.generateCos(block))
    this.generator.register('math_tan', (block) => this.generateTan(block))
    this.generator.register('math_atan2', (block) => this.generateAtan2(block))
    this.generator.register('math_random_int', (block) => this.generateRandomNumber(block))
    this.generator.register('math_random_float', (block) => this.generateRandomFraction(block))
    this.generator.register('math_random_set_seed', (block) => this.generateRandomSetSeed(block))
    this.generator.register('math_modulo', (block) => this.generateModulo(block))
    this.generator.register('math_round', (block) => this.generateRound(block))
    this.generator.register('math_min_max', (block) => this.generateMinMax(block))
    this.generator.register('math_on_list', (block) => this.generateMathOnList(block))
    this.generator.register('math_divide', (block) => this.generateMathDivide(block))
    this.generator.register('math_convert_angles', (block) => this.generateConvertAngles(block))
    this.generator.register('math_format_as_decimal', (block) => this.generateFormatAsDecimal(block))
    this.generator.register('math_is_a_number', (block) => this.generateIsANumber(block))
    this.generator.register('math_convert_number', (block) => this.generateConvertNumber(block))
    this.generator.register('math_compare', (block) => this.generateMathCompare(block))
  }

  generateNumber(block: Block): SchemeExpr {
    return Scheme.atom(block.fields?.NUM || 0)
  }

  generateMathOperation(block: Block): SchemeExpr {
    const op = block.fields?.OP || 'ADD'
    const a = this.generator.valueToCode(block.values?.A)
    const b = this.generator.valueToCode(block.values?.B)

    const aScheme = a
    const bScheme = b

    const opMap: { [key: string]: string } = {
      'ADD': '+',
      'MINUS': '-',
      'MULTIPLY': '*',
      'DIVIDE': '/',
      'POWER': 'expt'
    }

    const yailOp = opMap[op] || '+'
    return yailPrimitiveCall(
      yailOp,
      [aScheme, bScheme],
      [YAIL_TYPES.NUMBER, YAIL_TYPES.NUMBER],
      yailOp
    )
  }

  generateSingleMathOperation(block: Block): SchemeExpr {
    const op = block.fields?.OP || 'ROOT'
    const value = this.generator.valueToCode(block.values?.NUM)

    const valueScheme = value

    const opMap: { [key: string]: string } = {
      'ROOT': 'sqrt',
      'ABS': 'abs',
      'NEG': '-',
      'LN': 'log',
      'LOG10': 'log10',
      'EXP': 'exp',
      'POW10': 'expt-10'
    }

    const yailOp = opMap[op] || 'abs'
    const opName = op.toLowerCase().replace('root', 'square root').replace('neg', 'negate')

    return yailPrimitiveCall(
      yailOp,
      [valueScheme],
      [YAIL_TYPES.NUMBER],
      opName
    )
  }

  generateTrigFunction(block: Block): SchemeExpr {
    const op = block.fields?.OP || 'SIN'
    const value = this.generator.valueToCode(block.values?.NUM)

    const valueScheme = value

    const opMap: { [key: string]: string } = {
      'SIN': 'sin-degrees',
      'COS': 'cos-degrees',
      'TAN': 'tan-degrees',
      'ASIN': 'asin-degrees',
      'ACOS': 'acos-degrees',
      'ATAN': 'atan-degrees'
    }

    const yailOp = opMap[op] || 'sin-degrees'
    const opName = op.toLowerCase()

    return yailPrimitiveCall(
      yailOp,
      [valueScheme],
      [YAIL_TYPES.NUMBER],
      opName
    )
  }

  generateRandomNumber(block: Block): SchemeExpr {
    const from = this.generator.valueToCode(block.values?.FROM)
    const to = this.generator.valueToCode(block.values?.TO)

    const fromScheme = from
    const toScheme = to

    return yailPrimitiveCall(
      'random-integer',
      [fromScheme, toScheme],
      [YAIL_TYPES.NUMBER, YAIL_TYPES.NUMBER],
      'random integer'
    )
  }

  generateRandomFraction(block: Block): SchemeExpr {
    return yailPrimitiveCall(
      'random-fraction',
      [],
      [],
      'random fraction'
    )
  }

  generateModulo(block: Block): SchemeExpr {
    const dividend = this.generator.valueToCode(block.values?.DIVIDEND)
    const divisor = this.generator.valueToCode(block.values?.DIVISOR)

    const dividendScheme = dividend
    const divisorScheme = divisor

    return yailPrimitiveCall(
      'modulo',
      [dividendScheme, divisorScheme],
      [YAIL_TYPES.NUMBER, YAIL_TYPES.NUMBER],
      'modulo'
    )
  }

  generateRound(block: Block): SchemeExpr {
    const op = block.fields?.OP || 'ROUND'
    const value = this.generator.valueToCode(block.values?.NUM)

    const valueScheme = value

    const opMap: { [key: string]: string } = {
      'ROUND': 'round',
      'ROUNDUP': 'ceiling',
      'ROUNDDOWN': 'floor'
    }

    const yailOp = opMap[op] || 'round'
    const opName = op.toLowerCase().replace('roundup', 'ceiling').replace('rounddown', 'floor')

    return yailPrimitiveCall(
      yailOp,
      [valueScheme],
      [YAIL_TYPES.NUMBER],
      opName
    )
  }

  generateMinMax(block: Block): SchemeExpr {
    const op = block.fields?.OP || 'MIN'
    const a = this.generator.valueToCode(block.values?.A)
    const b = this.generator.valueToCode(block.values?.B)

    const aScheme = a
    const bScheme = b

    const yailOp = op.toLowerCase()
    return yailPrimitiveCall(
      yailOp,
      [aScheme, bScheme],
      [YAIL_TYPES.NUMBER, YAIL_TYPES.NUMBER],
      yailOp
    )
  }

  generateMathCompare(block: Block): SchemeExpr {
    const op = block.fields?.OP || 'EQ'
    const a = this.generator.valueToCode(block.values?.A)
    const b = this.generator.valueToCode(block.values?.B)

    const aScheme = a
    const bScheme = b

    const opMap: { [key: string]: string } = {
      'EQ': 'yail-equal?',
      'NEQ': 'yail-not-equal?',
      'LT': 'yail-less?',
      'LTE': 'yail-not-greater?',
      'GT': 'yail-greater?',
      'GTE': 'yail-not-less?'
    }

    const displayMap: { [key: string]: string } = {
      'EQ': '=',
      'NEQ': '≠',
      'LT': '<',
      'LTE': '≤',
      'GT': '>',
      'GTE': '≥'
    }

    const yailOp = opMap[op] || 'yail-equal?'
    const displayName = displayMap[op] || '='
    const argTypes = (op === 'EQ' || op === 'NEQ') ? [YAIL_TYPES.ANY, YAIL_TYPES.ANY] : [YAIL_TYPES.NUMBER, YAIL_TYPES.NUMBER]

    return yailPrimitiveCall(
      yailOp,
      [aScheme, bScheme],
      argTypes,
      displayName
    )
  }

  generateNumberRadix(block: Block): SchemeExpr {
    const op = block.fields?.OP || 'DEC'
    const prefix = op === 'HEX' ? '0x' : op === 'BIN' ? '0b' : ''
    const code = Number(prefix + (block.fields?.NUM || 0))
    return Scheme.atom(code)
  }

  generateSubtract(block: Block): SchemeExpr {
    const a = this.generator.valueToCode(block.values?.A)
    const b = this.generator.valueToCode(block.values?.B)
    return yailPrimitiveCall(
      '-',
      [a, b],
      [YAIL_TYPES.NUMBER, YAIL_TYPES.NUMBER],
      '-'
    )
  }

  generateDivision(block: Block): SchemeExpr {
    const a = this.generator.valueToCode(block.values?.A)
    const b = this.generator.valueToCode(block.values?.B)
    return yailPrimitiveCall(
      'yail-divide',
      [a, b],
      [YAIL_TYPES.NUMBER, YAIL_TYPES.NUMBER],
      '/'
    )
  }

  generatePower(block: Block): SchemeExpr {
    const a = this.generator.valueToCode(block.values?.A)
    const b = this.generator.valueToCode(block.values?.B)
    return yailPrimitiveCall(
      'expt',
      [a, b],
      [YAIL_TYPES.NUMBER, YAIL_TYPES.NUMBER],
      'expt'
    )
  }

  generateAdd(block: Block): SchemeExpr {
    const items: SchemeExpr[] = []
    const itemTypes: YailType[] = []
    const itemCount = parseInt(block.mutation?.items || '2')

    for (let i = 0; i < itemCount; i++) {
      const item = this.generator.valueToCode(block.values?.[`NUM${i}`])
      items.push(item)
      itemTypes.push(YAIL_TYPES.NUMBER)
    }

    return yailPrimitiveCall(
      '+',
      items,
      itemTypes,
      '+'
    )
  }

  generateMultiply(block: Block): SchemeExpr {
    const items: SchemeExpr[] = []
    const itemTypes: YailType[] = []
    const itemCount = parseInt(block.mutation?.items || '2')

    for (let i = 0; i < itemCount; i++) {
      const item = this.generator.valueToCode(block.values?.[`NUM${i}`])
      items.push(item)
      itemTypes.push(YAIL_TYPES.NUMBER)
    }

    return yailPrimitiveCall(
      '*',
      items,
      itemTypes,
      '*'
    )
  }

  generateBitwise(block: Block): SchemeExpr {
    const op = block.fields?.OP || 'BITAND'
    const opMap: { [key: string]: string } = {
      'BITAND': 'bitwise-and',
      'BITIOR': 'bitwise-ior',
      'BITXOR': 'bitwise-xor'
    }

    const items: SchemeExpr[] = []
    const itemTypes: YailType[] = []
    const itemCount = parseInt(block.mutation?.items || '2')

    for (let i = 0; i < itemCount; i++) {
      const item = this.generator.valueToCode(block.values?.[`NUM${i}`])
      items.push(item)
      itemTypes.push(YAIL_TYPES.NUMBER)
    }

    const yailOp = opMap[op] || 'bitwise-and'
    return yailPrimitiveCall(
      yailOp,
      items,
      itemTypes,
      yailOp
    )
  }

  generateAbs(block: Block): SchemeExpr {
    const value = this.generator.valueToCode(block.values?.NUM)
    return yailPrimitiveCall(
      'abs',
      [value],
      [YAIL_TYPES.NUMBER],
      'abs'
    )
  }

  generateNeg(block: Block): SchemeExpr {
    const value = this.generator.valueToCode(block.values?.NUM)
    return yailPrimitiveCall(
      '-',
      [value],
      [YAIL_TYPES.NUMBER],
      'negate'
    )
  }

  generateCeiling(block: Block): SchemeExpr {
    const value = this.generator.valueToCode(block.values?.NUM)
    return yailPrimitiveCall(
      'yail-ceiling',
      [value],
      [YAIL_TYPES.NUMBER],
      'ceiling'
    )
  }

  generateFloor(block: Block): SchemeExpr {
    const value = this.generator.valueToCode(block.values?.NUM)
    return yailPrimitiveCall(
      'yail-floor',
      [value],
      [YAIL_TYPES.NUMBER],
      'floor'
    )
  }

  generateCos(block: Block): SchemeExpr {
    const value = this.generator.valueToCode(block.values?.NUM)
    return yailPrimitiveCall(
      'cos-degrees',
      [value],
      [YAIL_TYPES.NUMBER],
      'cos'
    )
  }

  generateTan(block: Block): SchemeExpr {
    const value = this.generator.valueToCode(block.values?.NUM)
    return yailPrimitiveCall(
      'tan-degrees',
      [value],
      [YAIL_TYPES.NUMBER],
      'tan'
    )
  }

  generateAtan2(block: Block): SchemeExpr {
    const y = this.generator.valueToCode(block.values?.Y)
    const x = this.generator.valueToCode(block.values?.X)
    return yailPrimitiveCall(
      'atan2-degrees',
      [y, x],
      [YAIL_TYPES.NUMBER, YAIL_TYPES.NUMBER],
      'atan2'
    )
  }

  generateRandomSetSeed(block: Block): SchemeExpr {
    const seed = this.generator.valueToCode(block.values?.NUM)
    return yailPrimitiveCall(
      'random-set-seed',
      [seed],
      [YAIL_TYPES.NUMBER],
      'random set seed'
    )
  }

  generateMathOnList(block: Block): SchemeExpr {
    const op = block.fields?.OP || 'MIN'
    const opMap: { [key: string]: string } = {
      'MIN': 'min',
      'MAX': 'max'
    }

    const items: SchemeExpr[] = []
    const itemTypes: YailType[] = []
    const itemCount = parseInt(block.mutation?.items || '1')

    if (itemCount === 0) {
      const identity = op === 'MIN' ? Scheme.atom('+inf.0') : Scheme.atom('-inf.0')
      items.push(identity)
      itemTypes.push(YAIL_TYPES.NUMBER)
    } else {
      for (let i = 0; i < itemCount; i++) {
        const item = this.generator.valueToCode(block.values?.[`NUM${i}`])
        items.push(item)
        itemTypes.push(YAIL_TYPES.NUMBER)
      }
    }

    const yailOp = opMap[op] || 'min'
    return yailPrimitiveCall(
      yailOp,
      items,
      itemTypes,
      yailOp
    )
  }

  generateMathDivide(block: Block): SchemeExpr {
    const op = block.fields?.OP || 'MODULO'
    const dividend = this.generator.valueToCode(block.values?.DIVIDEND)
    const divisor = this.generator.valueToCode(block.values?.DIVISOR)

    const opMap: { [key: string]: string } = {
      'MODULO': 'modulo',
      'REMAINDER': 'remainder',
      'QUOTIENT': 'quotient'
    }

    const yailOp = opMap[op] || 'modulo'
    return yailPrimitiveCall(
      yailOp,
      [dividend, divisor],
      [YAIL_TYPES.NUMBER, YAIL_TYPES.NUMBER],
      yailOp
    )
  }

  generateConvertAngles(block: Block): SchemeExpr {
    const op = block.fields?.OP || 'RADIANS_TO_DEGREES'
    const value = this.generator.valueToCode(block.values?.NUM)

    const opMap: { [key: string]: string } = {
      'RADIANS_TO_DEGREES': 'radians->degrees',
      'DEGREES_TO_RADIANS': 'degrees->radians'
    }

    const displayMap: { [key: string]: string } = {
      'RADIANS_TO_DEGREES': 'convert radians to degrees',
      'DEGREES_TO_RADIANS': 'convert degrees to radians'
    }

    const yailOp = opMap[op] || 'radians->degrees'
    const displayName = displayMap[op] || 'convert radians to degrees'

    return yailPrimitiveCall(
      yailOp,
      [value],
      [YAIL_TYPES.NUMBER],
      displayName
    )
  }

  generateFormatAsDecimal(block: Block): SchemeExpr {
    const num = this.generator.valueToCode(block.values?.NUM)
    const places = this.generator.valueToCode(block.values?.PLACES)
    return yailPrimitiveCall(
      'format-as-decimal',
      [num, places],
      [YAIL_TYPES.NUMBER, YAIL_TYPES.NUMBER],
      'format as decimal'
    )
  }

  generateIsANumber(block: Block): SchemeExpr {
    const op = block.fields?.OP || 'NUMBER'
    const value = this.generator.valueToCode(block.values?.NUM)

    const opMap: { [key: string]: string } = {
      'NUMBER': 'is-number?',
      'BASE10': 'is-base10?',
      'HEXADECIMAL': 'is-hexadecimal?',
      'BINARY': 'is-binary?'
    }

    const displayMap: { [key: string]: string } = {
      'NUMBER': 'is a number?',
      'BASE10': 'is base10?',
      'HEXADECIMAL': 'is hexadecimal?',
      'BINARY': 'is binary?'
    }

    const yailOp = opMap[op] || 'is-number?'
    const displayName = displayMap[op] || 'is a number?'

    return yailPrimitiveCall(
      yailOp,
      [value],
      [YAIL_TYPES.TEXT],
      displayName
    )
  }

  generateConvertNumber(block: Block): SchemeExpr {
    const op = block.fields?.OP || 'DEC_TO_HEX'
    const value = this.generator.valueToCode(block.values?.NUM)

    const opMap: { [key: string]: string } = {
      'DEC_TO_HEX': 'math-convert-dec-hex',
      'HEX_TO_DEC': 'math-convert-hex-dec',
      'DEC_TO_BIN': 'math-convert-dec-bin',
      'BIN_TO_DEC': 'math-convert-bin-dec'
    }

    const displayMap: { [key: string]: string } = {
      'DEC_TO_HEX': 'convert Dec to Hex',
      'HEX_TO_DEC': 'convert Hex to Dec',
      'DEC_TO_BIN': 'convert Dec to Bin',
      'BIN_TO_DEC': 'convert Bin to Dec'
    }

    const yailOp = opMap[op] || 'math-convert-dec-hex'
    const displayName = displayMap[op] || 'convert Dec to Hex'

    return yailPrimitiveCall(
      yailOp,
      [value],
      [YAIL_TYPES.TEXT],
      displayName
    )
  }

}
