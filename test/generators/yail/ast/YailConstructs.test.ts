import { describe, test, expect } from 'vitest'
import {
  yailFormDef,
  yailGlobalDef,
  yailProcedureDef,
  yailAddComponent,
  yailSetProperty,
  yailGetProperty,
  yailMethodCall,
  yailEventDef,
  yailPrimitiveCall,
  yailFormSetup,
  yailGetComponent,
  yailOrDelayed,
  yailAndDelayed
} from '../../../../src/generators/yail/ast/YailConstructs.js'
import { Scheme } from '../../../../src/generators/yail/ast/SchemeAST.js'

describe('yailFormDef', () => {
  test('creates form definition correctly', () => {
    const formDef = yailFormDef('com.example', 'MyForm')
    expect(formDef.format()).toBe('(define-repl-form com.example.MyForm MyForm)')
  })

  test('handles complex package names', () => {
    const formDef = yailFormDef('com.example.deep.package', 'TestForm')
    expect(formDef.format()).toBe('(define-repl-form com.example.deep.package.TestForm TestForm)')
  })
})

describe('yailGlobalDef', () => {
  test('creates global variable definition with atom value', () => {
    const globalDef = yailGlobalDef('myVar', Scheme.atom(42))
    expect(globalDef.format()).toBe('(def g$myVar 42)')
  })

  test('creates global variable definition with string value', () => {
    const globalDef = yailGlobalDef('message', Scheme.string('Hello World'))
    expect(globalDef.format()).toBe('(def g$message "Hello World")')
  })

  test('creates global variable definition with list value', () => {
    const globalDef = yailGlobalDef('numbers', Scheme.list(Scheme.atom(1), Scheme.atom(2), Scheme.atom(3)))
    expect(globalDef.format()).toBe('(def g$numbers (1 2 3))')
  })
})

describe('yailProcedureDef', () => {
  test('creates procedure definition without parameters', () => {
    const procDef = yailProcedureDef('myProc', [], [Scheme.atom(42)])
    expect(procDef.format()).toBe('(def (p$myProc) 42)')
  })

  test('creates procedure definition with single parameter', () => {
    const procDef = yailProcedureDef('add1', ['x'], [Scheme.list(Scheme.symbol('+'), Scheme.symbol('$x'), Scheme.atom(1))])
    expect(procDef.format()).toBe('(def (p$add1 $x) (+ $x 1))')
  })

  test('creates procedure definition with multiple parameters', () => {
    const procDef = yailProcedureDef('add', ['x', 'y'], [Scheme.list(Scheme.symbol('+'), Scheme.symbol('$x'), Scheme.symbol('$y'))])
    expect(procDef.format()).toBe('(def (p$add $x $y) (+ $x $y))')
  })

  test('creates procedure definition with multiple body expressions', () => {
    const procDef = yailProcedureDef('myProc', ['x'], [
      Scheme.list(Scheme.symbol('print'), Scheme.symbol('$x')),
      Scheme.list(Scheme.symbol('+'), Scheme.symbol('$x'), Scheme.atom(1))
    ])
    expect(procDef.format()).toBe('(def (p$myProc $x) (print $x) (+ $x 1))')
  })

  test('handles hasReturn parameter', () => {
    const procDef = yailProcedureDef('returnProc', ['x'], [Scheme.symbol('$x')], true)
    expect(procDef.format()).toBe('(def (p$returnProc $x) $x)')
  })
})

describe('yailAddComponent', () => {
  test('creates add component call without properties', () => {
    const addComp = yailAddComponent('Screen1', 'Button', 'Button1')
    expect(addComp.format()).toBe('(add-component Screen1 Button Button1)')
  })

  test('creates add component call with properties', () => {
    const addComp = yailAddComponent('Screen1', 'Button', 'Button1', [
      Scheme.string('Text'),
      Scheme.string('Click Me')
    ])
    expect(addComp.format()).toBe('(add-component Screen1 Button Button1 "Text" "Click Me")')
  })
})

describe('yailSetProperty', () => {
  test('creates set property call', () => {
    const setProp = yailSetProperty('Button1', 'Text', Scheme.string('Hello'), 'text')
    expect(setProp.format()).toBe("(set-and-coerce-property! 'Button1 'Text \"Hello\" 'text)")
  })

  test('creates set property call with different value types', () => {
    const setProp = yailSetProperty('Button1', 'Visible', Scheme.true(), 'boolean')
    expect(setProp.format()).toBe("(set-and-coerce-property! 'Button1 'Visible #t 'boolean)")
  })
})

describe('yailGetProperty', () => {
  test('creates get property call', () => {
    const getProp = yailGetProperty('Button1', 'Text')
    expect(getProp.format()).toBe("(get-property 'Button1 'Text)")
  })

  test('creates get property call with different property names', () => {
    const getProp = yailGetProperty('Screen1', 'BackgroundColor')
    expect(getProp.format()).toBe("(get-property 'Screen1 'BackgroundColor)")
  })
})

describe('yailMethodCall', () => {
  test('creates method call without arguments', () => {
    const methodCall = yailMethodCall('Button1', 'Click', [], [])
    expect(methodCall.format()).toBe("(call-component-method 'Button1 'Click (*list-for-runtime*) '())")
  })

  test('creates method call with single argument', () => {
    const methodCall = yailMethodCall('TextBox1', 'SetText', [Scheme.string('Hello')], ['text'])
    expect(methodCall.format()).toBe("(call-component-method 'TextBox1 'SetText (*list-for-runtime* \"Hello\") '(text))")
  })

  test('creates method call with multiple arguments', () => {
    const methodCall = yailMethodCall('Canvas1', 'DrawLine', [
      Scheme.atom(10),
      Scheme.atom(20),
      Scheme.atom(30),
      Scheme.atom(40)
    ], ['number', 'number', 'number', 'number'])
    expect(methodCall.format()).toBe("(call-component-method 'Canvas1 'DrawLine (*list-for-runtime* 10 20 30 40) '(number number number number))")
  })
})

describe('yailEventDef', () => {
  test('creates event definition without parameters', () => {
    const eventDef = yailEventDef('Button1', 'Click', [], [Scheme.atom(42)])
    expect(eventDef.format()).toBe('(define-event Button1 Click () (set-this-form) 42)')
  })

  test('creates event definition with parameters', () => {
    const eventDef = yailEventDef('Screen1', 'Initialize', ['param1'], [
      Scheme.list(Scheme.symbol('print'), Scheme.symbol('$param1'))
    ])
    expect(eventDef.format()).toBe('(define-event Screen1 Initialize ($param1) (set-this-form) (print $param1))')
  })

  test('creates event definition with multiple parameters and body expressions', () => {
    const eventDef = yailEventDef('Button1', 'TouchDown', ['x', 'y'], [
      Scheme.list(Scheme.symbol('print'), Scheme.string('Touch at:')),
      Scheme.list(Scheme.symbol('print'), Scheme.symbol('$x')),
      Scheme.list(Scheme.symbol('print'), Scheme.symbol('$y'))
    ])
    expect(eventDef.format()).toBe('(define-event Button1 TouchDown ($x $y) (set-this-form) (print "Touch at:") (print $x) (print $y))')
  })
})

describe('yailPrimitiveCall', () => {
  test('creates primitive call without arguments', () => {
    const primCall = yailPrimitiveCall('random-integer', [], [], 'random integer')
    expect(primCall.format()).toBe('(call-yail-primitive random-integer (*list-for-runtime*) \'() "random integer")')
  })

  test('creates primitive call with single argument', () => {
    const primCall = yailPrimitiveCall('abs', [Scheme.atom(-5)], ['number'], 'absolute value')
    expect(primCall.format()).toBe('(call-yail-primitive abs (*list-for-runtime* -5) \'(number) "absolute value")')
  })

  test('creates primitive call with multiple arguments', () => {
    const primCall = yailPrimitiveCall('max', [
      Scheme.atom(10),
      Scheme.atom(20)
    ], ['number', 'number'], 'maximum')
    expect(primCall.format()).toBe('(call-yail-primitive max (*list-for-runtime* 10 20) \'(number number) "maximum")')
  })
})

describe('yailFormSetup', () => {
  test('creates form setup without properties', () => {
    const formSetup = yailFormSetup([])
    expect(formSetup.format()).toBe('(do-after-form-creation)')
  })

  test('creates form setup with properties', () => {
    const formSetup = yailFormSetup([
      Scheme.list(Scheme.symbol('set-property'), Scheme.string('Title'), Scheme.string('My App')),
      Scheme.list(Scheme.symbol('set-property'), Scheme.string('BackgroundColor'), Scheme.atom('#FFFFFF'))
    ])
    expect(formSetup.format()).toBe('(do-after-form-creation (set-property "Title" "My App") (set-property "BackgroundColor" #FFFFFF))')
  })
})

describe('yailGetComponent', () => {
  test('creates get component call', () => {
    const getComp = yailGetComponent('Button1')
    expect(getComp.format()).toBe('(get-component Button1)')
  })

  test('creates get component call with different component names', () => {
    const getComp = yailGetComponent('Screen1')
    expect(getComp.format()).toBe('(get-component Screen1)')
  })
})

describe('yailOrDelayed', () => {
  test('creates or-delayed with single expression', () => {
    const orDelayed = yailOrDelayed([Scheme.symbol('condition1')])
    expect(orDelayed.format()).toBe('(or-delayed condition1)')
  })

  test('creates or-delayed with multiple expressions', () => {
    const orDelayed = yailOrDelayed([
      Scheme.symbol('condition1'),
      Scheme.symbol('condition2'),
      Scheme.symbol('condition3')
    ])
    expect(orDelayed.format()).toBe('(or-delayed condition1 condition2 condition3)')
  })

  test('creates or-delayed with empty array', () => {
    const orDelayed = yailOrDelayed([])
    expect(orDelayed.format()).toBe('(or-delayed)')
  })
})

describe('yailAndDelayed', () => {
  test('creates and-delayed with single expression', () => {
    const andDelayed = yailAndDelayed([Scheme.symbol('condition1')])
    expect(andDelayed.format()).toBe('(and-delayed condition1)')
  })

  test('creates and-delayed with multiple expressions', () => {
    const andDelayed = yailAndDelayed([
      Scheme.symbol('condition1'),
      Scheme.symbol('condition2'),
      Scheme.symbol('condition3')
    ])
    expect(andDelayed.format()).toBe('(and-delayed condition1 condition2 condition3)')
  })

  test('creates and-delayed with empty array', () => {
    const andDelayed = yailAndDelayed([])
    expect(andDelayed.format()).toBe('(and-delayed)')
  })
})
