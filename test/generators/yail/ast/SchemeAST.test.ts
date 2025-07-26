import { describe, test, expect } from 'vitest'
import {
  SchemeExpr,
  SchemeAtom,
  SchemeSymbol,
  SchemeQuote,
  SchemeString,
  SchemeList,
  SchemeIf,
  SchemeBegin,
  SchemeLet,
  SchemeComment,
  Scheme
} from '../../../../src/generators/yail/ast/SchemeAST.js'

describe('SchemeAtom', () => {
  test('formats string values correctly', () => {
    const atom = new SchemeAtom('hello')
    expect(atom.format()).toBe('hello')
  })

  test('formats number values correctly', () => {
    const atom = new SchemeAtom(42)
    expect(atom.format()).toBe('42')
  })

  test('formats boolean values correctly', () => {
    const trueAtom = new SchemeAtom(true)
    const falseAtom = new SchemeAtom(false)
    expect(trueAtom.format()).toBe('true')
    expect(falseAtom.format()).toBe('false')
  })
})

describe('SchemeSymbol', () => {
  test('formats symbol names correctly', () => {
    const symbol = new SchemeSymbol('my-symbol')
    expect(symbol.format()).toBe('my-symbol')
  })

  test('handles special characters in symbol names', () => {
    const symbol = new SchemeSymbol('$test*')
    expect(symbol.format()).toBe('$test*')
  })
})

describe('SchemeQuote', () => {
  test('formats quoted symbols correctly', () => {
    const quote = new SchemeQuote(Scheme.symbol('symbol'))
    expect(quote.format()).toBe("'symbol")
  })
})

describe('SchemeString', () => {
  test('formats simple strings correctly', () => {
    const str = new SchemeString('hello world')
    expect(str.format()).toBe('"hello world"')
  })

  test('escapes backslashes correctly', () => {
    const str = new SchemeString('path\\to\\file')
    expect(str.format()).toBe('"path\\\\to\\\\file"')
  })

  test('escapes double quotes correctly', () => {
    const str = new SchemeString('say "hello"')
    expect(str.format()).toBe('"say \\"hello\\""')
  })

  test('escapes newlines correctly', () => {
    const str = new SchemeString('line1\nline2')
    expect(str.format()).toBe('"line1\\nline2"')
  })

  test('escapes carriage returns correctly', () => {
    const str = new SchemeString('line1\rline2')
    expect(str.format()).toBe('"line1\\rline2"')
  })

  test('escapes tabs correctly', () => {
    const str = new SchemeString('col1\tcol2')
    expect(str.format()).toBe('"col1\\tcol2"')
  })

  test('escapes unicode characters correctly', () => {
    const str = new SchemeString('café')
    expect(str.format()).toBe('"caf\\u00e9"')
  })
})

describe('SchemeList', () => {
  test('formats empty list correctly', () => {
    const list = new SchemeList()
    expect(list.format()).toBe('()')
  })

  test('formats list with single element correctly', () => {
    const list = new SchemeList([new SchemeAtom(42)])
    expect(list.format()).toBe('(42)')
  })

  test('formats list with multiple elements correctly', () => {
    const list = new SchemeList([
      new SchemeSymbol('add'),
      new SchemeAtom(1),
      new SchemeAtom(2)
    ])
    expect(list.format()).toBe('(add 1 2)')
  })

  test('add method works correctly', () => {
    const list = new SchemeList()
    const result = list.add(new SchemeAtom(42))
    expect(result).toBe(list)
    expect(list.format()).toBe('(42)')
  })

  test('handles nested lists correctly', () => {
    const innerList = new SchemeList([new SchemeAtom(1), new SchemeAtom(2)])
    const outerList = new SchemeList([new SchemeSymbol('list'), innerList])
    expect(outerList.format()).toBe('(list (1 2))')
  })
})

describe('SchemeIf', () => {
  test('formats if with else correctly', () => {
    const ifExpr = new SchemeIf(
      new SchemeSymbol('test'),
      new SchemeAtom('then'),
      new SchemeAtom('else')
    )
    expect(ifExpr.format()).toBe('(if test then else)')
  })

  test('formats if without else correctly', () => {
    const ifExpr = new SchemeIf(
      new SchemeSymbol('test'),
      new SchemeAtom('then')
    )
    expect(ifExpr.format()).toBe('(if test then)')
  })

  test('formats if with null else correctly', () => {
    const ifExpr = new SchemeIf(
      new SchemeSymbol('test'),
      new SchemeAtom('then'),
      null
    )
    expect(ifExpr.format()).toBe('(if test then)')
  })
})

describe('SchemeBegin', () => {
  test('formats begin with single expression correctly', () => {
    const begin = new SchemeBegin([new SchemeAtom(42)])
    expect(begin.format()).toBe('(begin 42)')
  })

  test('formats begin with multiple expressions correctly', () => {
    const begin = new SchemeBegin([
      new SchemeAtom(1),
      new SchemeAtom(2),
      new SchemeAtom(3)
    ])
    expect(begin.format()).toBe('(begin 1 2 3)')
  })
})

describe('SchemeLet', () => {
  test('formats let with single binding correctly', () => {
    const letExpr = new SchemeLet(
      [['x', new SchemeAtom(42)]],
      new SchemeSymbol('x')
    )
    expect(letExpr.format()).toBe('(let ((x 42)) x)')
  })

  test('formats let with multiple bindings correctly', () => {
    const letExpr = new SchemeLet(
      [
        ['x', new SchemeAtom(1)],
        ['y', new SchemeAtom(2)]
      ],
      new SchemeList([new SchemeSymbol('+'), new SchemeSymbol('x'), new SchemeSymbol('y')])
    )
    expect(letExpr.format()).toBe('(let ((x 1) (y 2)) (+ x y))')
  })
})

describe('SchemeComment', () => {
  test('formats line comments correctly', () => {
    const comment = new SchemeComment('This is a comment')
    expect(comment.format()).toBe(';;; This is a comment')
  })

  test('formats multi-line line comments correctly', () => {
    const comment = new SchemeComment('Line 1\nLine 2')
    expect(comment.format()).toBe(';;; Line 1\n;;; Line 2')
  })

  test('formats block comments correctly', () => {
    const comment = new SchemeComment('This is a block comment', 'block')
    expect(comment.format()).toBe('#|\nThis is a block comment\n|#')
  })
})

describe('Scheme helper functions', () => {
  test('atom helper creates SchemeAtom correctly', () => {
    const atom = Scheme.atom('test')
    expect(atom).toBeInstanceOf(SchemeAtom)
    expect(atom.format()).toBe('test')
  })

  test('symbol helper creates SchemeSymbol correctly', () => {
    const symbol = Scheme.symbol('test-symbol')
    expect(symbol).toBeInstanceOf(SchemeSymbol)
    expect(symbol.format()).toBe('test-symbol')
  })

  test('quote helper creates SchemeQuote correctly', () => {
    const quote = Scheme.quote(Scheme.symbol('symbol'))
    expect(quote).toBeInstanceOf(SchemeQuote)
    expect(quote.format()).toBe("'symbol")
  })

  test('string helper creates SchemeString correctly', () => {
    const str = Scheme.string('hello')
    expect(str).toBeInstanceOf(SchemeString)
    expect(str.format()).toBe('"hello"')
  })

  test('list helper creates SchemeList correctly', () => {
    const list = Scheme.list(Scheme.atom(1), Scheme.atom(2))
    expect(list).toBeInstanceOf(SchemeList)
    expect(list.format()).toBe('(1 2)')
  })

  test('if helper creates SchemeIf correctly', () => {
    const ifExpr = Scheme.if(Scheme.symbol('test'), Scheme.atom('then'))
    expect(ifExpr).toBeInstanceOf(SchemeIf)
    expect(ifExpr.format()).toBe('(if test then)')
  })

  test('begin helper creates SchemeBegin correctly', () => {
    const begin = Scheme.begin(Scheme.atom(1), Scheme.atom(2))
    expect(begin).toBeInstanceOf(SchemeBegin)
    expect(begin.format()).toBe('(begin 1 2)')
  })

  test('let helper creates SchemeLet correctly', () => {
    const letExpr = Scheme.let([['x', Scheme.atom(42)]], Scheme.symbol('x'))
    expect(letExpr).toBeInstanceOf(SchemeLet)
    expect(letExpr.format()).toBe('(let ((x 42)) x)')
  })

  test('lineComment helper creates line comment correctly', () => {
    const comment = Scheme.lineComment('test comment')
    expect(comment).toBeInstanceOf(SchemeComment)
    expect(comment.format()).toBe(';;; test comment')
  })

  test('blockComment helper creates block comment correctly', () => {
    const comment = Scheme.blockComment('test comment')
    expect(comment).toBeInstanceOf(SchemeComment)
    expect(comment.format()).toBe('#|\ntest comment\n|#')
  })

  test('true helper creates correct atom', () => {
    const trueAtom = Scheme.true()
    expect(trueAtom).toBeInstanceOf(SchemeAtom)
    expect(trueAtom.format()).toBe('#t')
  })

  test('false helper creates correct atom', () => {
    const falseAtom = Scheme.false()
    expect(falseAtom).toBeInstanceOf(SchemeAtom)
    expect(falseAtom.format()).toBe('#f')
  })

  test('null helper creates correct symbol', () => {
    const nullValue = Scheme.null()
    expect(nullValue).toBeInstanceOf(SchemeSymbol)
    expect(nullValue.format()).toBe('*the-null-value*')
  })

  test('emptyList helper creates correct symbol', () => {
    const emptyList = Scheme.emptyList()
    expect(emptyList).toBeInstanceOf(SchemeSymbol)
    expect(emptyList.format()).toBe("'()")
  })
})