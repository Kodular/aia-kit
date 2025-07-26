export abstract class SchemeExpr {
  abstract format(): string
}

export class SchemeAtom extends SchemeExpr {
  constructor(public value: string | number | boolean) {
    super()
  }

  format(): string {
    return String(this.value)
  }
}

export class SchemeSymbol extends SchemeExpr {
  constructor(public name: string) {
    super()
  }

  format(): string {
    return this.name
  }
}

export class SchemeQuote extends SchemeExpr {
  constructor(public expr: SchemeExpr) {
    super()
  }

  format(): string {
    return `'${this.expr.format()}`
  }
}

export class SchemeString extends SchemeExpr {
  constructor(public text: string) {
    super()
  }

  format(): string {
    return `"${this.escapeString(this.text)}"`
  }

  private escapeString(str: string): string {
    return str.replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t')
      .replace(/[\u0080-\uFFFF]/g, (match) => {
        return '\\u' + ('0000' + match.charCodeAt(0).toString(16)).slice(-4)
      })
  }
}

export class SchemeList extends SchemeExpr {
  constructor(public elements: SchemeExpr[] = []) {
    super()
  }

  add(element: SchemeExpr): SchemeList {
    this.elements.push(element)
    return this
  }

  format(): string {
    return `(${this.elements.map(e => e.format()).join(' ')})`
  }
}

export class SchemeIf extends SchemeExpr {
  constructor(
    public condition: SchemeExpr,
    public thenExpr: SchemeExpr,
    public elseExpr: SchemeExpr | null = null
  ) {
    super()
  }

  format(): string {
    if (this.elseExpr) {
      return `(if ${this.condition.format()} ${this.thenExpr.format()} ${this.elseExpr.format()})`
    } else {
      return `(if ${this.condition.format()} ${this.thenExpr.format()})`
    }
  }
}

export class SchemeBegin extends SchemeExpr {
  constructor(public expressions: SchemeExpr[]) {
    super()
  }

  format(): string {
    const exprs = this.expressions.map(e => e.format()).join(' ')
    return `(begin ${exprs})`
  }
}

export class SchemeLet extends SchemeExpr {
  constructor(
    public bindings: Array<[string, SchemeExpr]>,
    public body: SchemeExpr
  ) {
    super()
  }

  format(): string {
    const bindingList = this.bindings.map(([name, value]) => `(${name} ${value.format()})`).join(' ')
    return `(let (${bindingList}) ${this.body.format()})`
  }
}

export class SchemeComment extends SchemeExpr {
  constructor(public text: string, public style: 'line' | 'block' = 'line') {
    super()
  }

  format(): string {
    if (this.style === 'block') {
      return `#|\n${this.text}\n|#`
    } else {
      // Handle multi-line comments by prefixing each line with ;;;
      const lines = this.text.split('\n')
      return lines.map(line => `;;; ${line}`).join('\n')
    }
  }
}

export const Scheme = {
  atom: (value: string | number | boolean) => new SchemeAtom(value),
  symbol: (name: string) => new SchemeSymbol(name),
  quote: (expr: SchemeExpr) => new SchemeQuote(expr),
  string: (text: string) => new SchemeString(text),
  list: (...elements: SchemeExpr[]) => new SchemeList(elements),

  if: (condition: SchemeExpr, thenExpr: SchemeExpr, elseExpr?: SchemeExpr) =>
    new SchemeIf(condition, thenExpr, elseExpr),
  begin: (...expressions: SchemeExpr[]) => new SchemeBegin(expressions),
  let: (bindings: Array<[string, SchemeExpr]>, body: SchemeExpr) => new SchemeLet(bindings, body),

  lineComment: (text: string) => new SchemeComment(text, 'line'),
  blockComment: (text: string) => new SchemeComment(text, 'block'),

  true: () => new SchemeAtom('#t'),
  false: () => new SchemeAtom('#f'),
  null: () => new SchemeSymbol('*the-null-value*'),
  emptyList: () => new SchemeSymbol("'()"),
}
