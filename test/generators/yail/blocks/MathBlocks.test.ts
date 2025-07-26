import { describe, test, expect, beforeEach, vi } from 'vitest'
import MathBlocks from '../../../../src/generators/yail/blocks/MathBlocks.js'
import type YailGenerator from '../../../../src/generators/yail/YailGenerator.js'
import type { Block } from "../../../../src/types.js"

const mockRegister = vi.fn(() => {})
const mockStatementToCode = vi.fn((block: any) => block ? [{ format: () => 'mockValue' }] : [])
const mockValueToCode = vi.fn((block: any) => block ? ({ format: () => 'mockValue' }) : undefined)

const mockGenerator = {
  register: mockRegister,
  statementToCode: mockStatementToCode,
  valueToCode: mockValueToCode
} as unknown as YailGenerator

describe('MathBlocks', () => {
  let mathBlocks: MathBlocks

  beforeEach(() => {
    mathBlocks = new MathBlocks(mockGenerator)
    mathBlocks.registerBlocks()  // Manually register blocks in tests
    mockRegister.mockClear()
    mockStatementToCode.mockClear()
    mockValueToCode.mockClear()
  })

  describe('generateNumber', () => {
    test('generates number from field', () => {
      const block: Block = {
        type: 'math_number',
        fields: {
          NUM: 42
        }
      }

      const result = mathBlocks.generateNumber(block)
      expect(result.format()).toBe('42')
    })

    test('defaults to 0 when field is missing', () => {
      const block: Block = {
        type: 'math_number'
      }

      const result = mathBlocks.generateNumber(block)
      expect(result.format()).toBe('0')
    })
  })

  describe('generateMathOperation', () => {
    test('generates addition operation', () => {
      const block: Block = {
        type: 'math_arithmetic',
        fields: {
          OP: 'ADD'
        },
        values: {
          A: { type: 'math_number' },
          B: { type: 'math_number' }
        }
      }

      const result = mathBlocks.generateMathOperation(block)
      expect(result.format()).toContain('call-yail-primitive +')
    })

    test('generates subtraction operation', () => {
      const block: Block = {
        type: 'math_arithmetic',
        fields: {
          OP: 'MINUS'
        },
        values: {
          A: { type: 'math_number' },
          B: { type: 'math_number' }
        }
      }

      const result = mathBlocks.generateMathOperation(block)
      expect(result.format()).toContain('call-yail-primitive -')
    })

    test('generates multiplication operation', () => {
      const block: Block = {
        type: 'math_arithmetic',
        fields: {
          OP: 'MULTIPLY'
        },
        values: {
          A: { type: 'math_number' },
          B: { type: 'math_number' }
        }
      }

      const result = mathBlocks.generateMathOperation(block)
      expect(result.format()).toContain('call-yail-primitive *')
    })

    test('generates division operation', () => {
      const block: Block = {
        type: 'math_arithmetic',
        fields: {
          OP: 'DIVIDE'
        },
        values: {
          A: { type: 'math_number' },
          B: { type: 'math_number' }
        }
      }

      const result = mathBlocks.generateMathOperation(block)
      expect(result.format()).toContain('call-yail-primitive /')
    })

    test('generates power operation', () => {
      const block: Block = {
        type: 'math_arithmetic',
        fields: {
          OP: 'POWER'
        },
        values: {
          A: { type: 'math_number' },
          B: { type: 'math_number' }
        }
      }

      const result = mathBlocks.generateMathOperation(block)
      expect(result.format()).toContain('call-yail-primitive expt')
    })

    test('defaults to addition when OP field is missing', () => {
      const block: Block = {
        type: 'math_arithmetic',
        values: {
          A: { type: 'math_number' },
          B: { type: 'math_number' }
        }
      }

      const result = mathBlocks.generateMathOperation(block)
      expect(result.format()).toContain('call-yail-primitive +')
    })
  })

  describe('generateSingleMathOperation', () => {
    test('generates square root operation', () => {
      const block: Block = {
        type: 'math_single',
        fields: {
          OP: 'ROOT'
        },
        values: {
          NUM: { type: 'math_number' }
        }
      }

      const result = mathBlocks.generateSingleMathOperation(block)
      expect(result.format()).toContain('call-yail-primitive sqrt')
    })

    test('generates absolute value operation', () => {
      const block: Block = {
        type: 'math_single',
        fields: {
          OP: 'ABS'
        },
        values: {
          NUM: { type: 'math_number' }
        }
      }

      const result = mathBlocks.generateSingleMathOperation(block)
      expect(result.format()).toContain('call-yail-primitive abs')
    })

    test('generates negate operation', () => {
      const block: Block = {
        type: 'math_single',
        fields: {
          OP: 'NEG'
        },
        values: {
          NUM: { type: 'math_number' }
        }
      }

      const result = mathBlocks.generateSingleMathOperation(block)
      expect(result.format()).toContain('call-yail-primitive -')
    })

    test('generates natural logarithm operation', () => {
      const block: Block = {
        type: 'math_single',
        fields: {
          OP: 'LN'
        },
        values: {
          NUM: { type: 'math_number' }
        }
      }

      const result = mathBlocks.generateSingleMathOperation(block)
      expect(result.format()).toContain('call-yail-primitive log')
    })

    test('generates base 10 logarithm operation', () => {
      const block: Block = {
        type: 'math_single',
        fields: {
          OP: 'LOG10'
        },
        values: {
          NUM: { type: 'math_number' }
        }
      }

      const result = mathBlocks.generateSingleMathOperation(block)
      expect(result.format()).toContain('call-yail-primitive log10')
    })

    test('generates exponential operation', () => {
      const block: Block = {
        type: 'math_single',
        fields: {
          OP: 'EXP'
        },
        values: {
          NUM: { type: 'math_number' }
        }
      }

      const result = mathBlocks.generateSingleMathOperation(block)
      expect(result.format()).toContain('call-yail-primitive exp')
    })

    test('generates power of 10 operation', () => {
      const block: Block = {
        type: 'math_single',
        fields: {
          OP: 'POW10'
        },
        values: {
          NUM: { type: 'math_number' }
        }
      }

      const result = mathBlocks.generateSingleMathOperation(block)
      expect(result.format()).toContain('call-yail-primitive expt-10')
    })
  })

  describe('generateTrigFunction', () => {
    test('generates sine function', () => {
      const block: Block = {
        type: 'math_trig',
        fields: {
          OP: 'SIN'
        },
        values: {
          NUM: { type: 'math_number' }
        }
      }

      const result = mathBlocks.generateTrigFunction(block)
      expect(result.format()).toContain('call-yail-primitive sin-degrees')
    })

    test('generates cosine function', () => {
      const block: Block = {
        type: 'math_trig',
        fields: {
          OP: 'COS'
        },
        values: {
          NUM: { type: 'math_number' }
        }
      }

      const result = mathBlocks.generateTrigFunction(block)
      expect(result.format()).toContain('call-yail-primitive cos-degrees')
    })

    test('generates tangent function', () => {
      const block: Block = {
        type: 'math_trig',
        fields: {
          OP: 'TAN'
        },
        values: {
          NUM: { type: 'math_number' }
        }
      }

      const result = mathBlocks.generateTrigFunction(block)
      expect(result.format()).toContain('call-yail-primitive tan-degrees')
    })

    test('generates arcsine function', () => {
      const block: Block = {
        type: 'math_trig',
        fields: {
          OP: 'ASIN'
        },
        values: {
          NUM: { type: 'math_number' }
        }
      }

      const result = mathBlocks.generateTrigFunction(block)
      expect(result.format()).toContain('call-yail-primitive asin-degrees')
    })
  })

  describe('generateRandomNumber', () => {
    test('generates random integer between bounds', () => {
      const block: Block = {
        type: 'math_random_int',
        values: {
          FROM: { type: 'math_number' },
          TO: { type: 'math_number' }
        }
      }

      const result = mathBlocks.generateRandomNumber(block)
      expect(result.format()).toContain('call-yail-primitive random-integer')
    })
  })

  describe('generateRandomFraction', () => {
    test('generates random fraction', () => {
      const block: Block = {
        type: 'math_random_float'
      }

      const result = mathBlocks.generateRandomFraction(block)
      expect(result.format()).toBe("(call-yail-primitive random-fraction (*list-for-runtime*) '() \"random fraction\")")
    })
  })

  describe('generateModulo', () => {
    test('generates modulo operation', () => {
      const block: Block = {
        type: 'math_modulo',
        values: {
          DIVIDEND: { type: 'math_number' },
          DIVISOR: { type: 'math_number' }
        }
      }

      const result = mathBlocks.generateModulo(block)
      expect(result.format()).toContain('call-yail-primitive modulo')
    })
  })

  describe('generateRound', () => {
    test('generates round operation', () => {
      const block: Block = {
        type: 'math_round',
        fields: {
          OP: 'ROUND'
        },
        values: {
          NUM: { type: 'math_number' }
        }
      }

      const result = mathBlocks.generateRound(block)
      expect(result.format()).toContain('call-yail-primitive round')
    })

    test('generates round up (ceiling) operation', () => {
      const block: Block = {
        type: 'math_round',
        fields: {
          OP: 'ROUNDUP'
        },
        values: {
          NUM: { type: 'math_number' }
        }
      }

      const result = mathBlocks.generateRound(block)
      expect(result.format()).toContain('call-yail-primitive ceiling')
    })

    test('generates round down (floor) operation', () => {
      const block: Block = {
        type: 'math_round',
        fields: {
          OP: 'ROUNDDOWN'
        },
        values: {
          NUM: { type: 'math_number' }
        }
      }

      const result = mathBlocks.generateRound(block)
      expect(result.format()).toContain('call-yail-primitive floor')
    })
  })

  describe('generateMinMax', () => {
    test('generates minimum operation', () => {
      const block: Block = {
        type: 'math_minmax',
        fields: {
          OP: 'MIN'
        },
        values: {
          A: { type: 'math_number' },
          B: { type: 'math_number' }
        }
      }

      const result = mathBlocks.generateMinMax(block)
      expect(result.format()).toContain('call-yail-primitive min')
    })

    test('generates maximum operation', () => {
      const block: Block = {
        type: 'math_minmax',
        fields: {
          OP: 'MAX'
        },
        values: {
          A: { type: 'math_number' },
          B: { type: 'math_number' }
        }
      }

      const result = mathBlocks.generateMinMax(block)
      expect(result.format()).toContain('call-yail-primitive max')
    })
  })

  describe('generateMathCompare', () => {
    test('generates equality comparison', () => {
      const block: Block = {
        type: 'math_compare',
        fields: {
          OP: 'EQ'
        },
        values: {
          A: { type: 'math_number' },
          B: { type: 'math_number' }
        }
      }

      const result = mathBlocks.generateMathCompare(block)
      expect(result.format()).toContain('call-yail-primitive yail-equal?')
      expect(result.format()).toContain('"="')
    })

    test('generates not equal comparison', () => {
      const block: Block = {
        type: 'math_compare',
        fields: {
          OP: 'NEQ'
        },
        values: {
          A: { type: 'math_number' },
          B: { type: 'math_number' }
        }
      }

      const result = mathBlocks.generateMathCompare(block)
      expect(result.format()).toContain('call-yail-primitive yail-not-equal?')
      expect(result.format()).toContain('\"\\u2260\"')
    })

    test('generates less than comparison', () => {
      const block: Block = {
        type: 'math_compare',
        fields: {
          OP: 'LT'
        },
        values: {
          A: { type: 'math_number' },
          B: { type: 'math_number' }
        }
      }

      const result = mathBlocks.generateMathCompare(block)
      expect(result.format()).toContain('call-yail-primitive yail-less?')
      expect(result.format()).toContain('"<"')
    })

    test('generates greater than comparison', () => {
      const block: Block = {
        type: 'math_compare',
        fields: {
          OP: 'GT'
        },
        values: {
          A: { type: 'math_number' },
          B: { type: 'math_number' }
        }
      }

      const result = mathBlocks.generateMathCompare(block)
      expect(result.format()).toContain('call-yail-primitive yail-greater?')
      expect(result.format()).toContain('">"')
    })

    test('uses ANY type for equality operations', () => {
      const block: Block = {
        type: 'math_compare',
        fields: {
          OP: 'EQ'
        },
        values: {
          A: { type: 'text' },
          B: { type: 'text' }
        }
      }

      const result = mathBlocks.generateMathCompare(block)
      expect(result.format()).toContain('(any any)')
    })

    test('uses NUMBER type for numerical comparisons', () => {
      const block: Block = {
        type: 'math_compare',
        fields: {
          OP: 'LT'
        },
        values: {
          A: { type: 'math_number' },
          B: { type: 'math_number' }
        }
      }

      const result = mathBlocks.generateMathCompare(block)
      expect(result.format()).toContain('(number number)')
    })
  })
})
