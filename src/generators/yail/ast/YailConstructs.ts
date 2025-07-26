import type { YailType } from '../../../types.js'
import { Scheme, SchemeExpr } from './SchemeAST.js'

export function yailFormDef(packageName: string, formName: string): SchemeExpr {
  return Scheme.list(
    Scheme.symbol('define-repl-form'),
    Scheme.symbol(`${packageName}.${formName}`),
    Scheme.symbol(formName)
  )
}

export function yailGlobalDef(name: string, value: SchemeExpr): SchemeExpr {
  return Scheme.list(
    Scheme.symbol('def'),
    Scheme.symbol(`g$${name}`),
    value
  )
}

export function yailProcedureDef(
  name: string,
  params: string[],
  body: SchemeExpr[],
  hasReturn: boolean = false
): SchemeExpr {
  const paramList = params.map(p => Scheme.symbol(`$${p}`))
  const procName = Scheme.symbol(`p$${name}`)

  return Scheme.list(
    Scheme.symbol('def'),
    Scheme.list(procName, ...paramList),
    ...body
  )
}

export function yailAddComponent(
  parentName: string,
  componentType: string,
  componentName: string,
  properties: SchemeExpr[] = []
): SchemeExpr {
  return Scheme.list(
    Scheme.symbol('add-component'),
    Scheme.symbol(parentName),
    Scheme.symbol(componentType),
    Scheme.symbol(componentName),
    ...properties
  )
}

export function yailSetProperty(
  componentName: string,
  propertyName: string,
  value: SchemeExpr,
  valueType: YailType
): SchemeExpr {
  return Scheme.list(
    Scheme.symbol('set-and-coerce-property!'),
    Scheme.quote(Scheme.symbol(componentName)),
    Scheme.quote(Scheme.symbol(propertyName)),
    value,
    Scheme.quote(Scheme.symbol(valueType))
  )
}

export function yailGetProperty(componentName: string, propertyName: string): SchemeExpr {
  return Scheme.list(
    Scheme.symbol('get-property'),
    Scheme.quote(Scheme.symbol(componentName)),
    Scheme.quote(Scheme.symbol(propertyName))
  )
}

export function yailMethodCall(
  componentName: string,
  methodName: string,
  args: SchemeExpr[],
  argTypes: YailType[]
): SchemeExpr {
  const argList = Scheme.list(
    Scheme.symbol('*list-for-runtime*'),
    ...args
  )
  const typeList = Scheme.list(
    ...argTypes.map(type => Scheme.symbol(type))
  )

  return Scheme.list(
    Scheme.symbol('call-component-method'),
    Scheme.quote(Scheme.symbol(componentName)),
    Scheme.quote(Scheme.symbol(methodName)),
    argList,
    Scheme.quote(Scheme.symbol(typeList.format()))
  )
}

export function yailEventDef(
  componentName: string,
  eventName: string,
  params: string[],
  body: SchemeExpr[]
): SchemeExpr {
  const paramList = params.map(p => Scheme.symbol(`$${p}`))

  return Scheme.list(
    Scheme.symbol('define-event'),
    Scheme.symbol(componentName),
    Scheme.symbol(eventName),
    Scheme.list(...paramList),
    Scheme.list(Scheme.symbol('set-this-form')),
    ...body
  )
}

export function yailPrimitiveCall(
  primitiveName: string,
  args: SchemeExpr[],
  argTypes: YailType[],
  displayName: string
): SchemeExpr {
  const argList = Scheme.list(
    Scheme.symbol('*list-for-runtime*'),
    ...args
  )
  const typeList = Scheme.list(
    ...argTypes.map(type => Scheme.symbol(type))
  )

  return Scheme.list(
    Scheme.symbol('call-yail-primitive'),
    Scheme.symbol(primitiveName),
    argList,
    Scheme.quote(Scheme.symbol(typeList.format())),
    Scheme.string(displayName)
  )
}

export function yailFormSetup(properties: SchemeExpr[]): SchemeExpr {
  return Scheme.list(
    Scheme.symbol('do-after-form-creation'),
    ...properties
  )
}

export function yailGetComponent(componentName: string): SchemeExpr {
  return Scheme.list(
    Scheme.symbol('get-component'),
    Scheme.symbol(componentName)
  )
}

export function yailOrDelayed(expressions: SchemeExpr[]): SchemeExpr {
  return Scheme.list(
    Scheme.symbol('or-delayed'),
    ...expressions
  )
}

export function yailAndDelayed(expressions: SchemeExpr[]): SchemeExpr {
  return Scheme.list(
    Scheme.symbol('and-delayed'),
    ...expressions
  )
}
