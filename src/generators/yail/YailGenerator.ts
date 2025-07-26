import { BkyParser } from '../../parsers/BkyParser.js'
import componentMetadata from '../../ComponentMetadata.js'
import ScmParser from '../../parsers/ScmParser.js'

import ColorBlocks from './blocks/ColorBlocks.js'
import ComponentBlocks from './blocks/ComponentBlocks.js'
import ControlBlocks from './blocks/ControlBlocks.js'
import DictionaryBlocks from './blocks/DictionaryBlocks.js'
import HelperBlocks from './blocks/HelperBlocks.js'
import ListBlocks from './blocks/ListBlocks.js'
import LogicBlocks from './blocks/LogicBlocks.js'
import MathBlocks from './blocks/MathBlocks.js'
import ProcedureBlocks from './blocks/ProcedureBlocks.js'
import TextBlocks from './blocks/TextBlocks.js'
import VariableBlocks from './blocks/VariableBlocks.js'

import { Scheme, type SchemeExpr } from './ast/SchemeAST.js'
import * as YailConstructs from './ast/YailConstructs.js'
import { YAIL_TYPES, type Block, type YailType } from '../../types.js'

class YailGenerator {
  private scmParser: ScmParser
  private bkyParser: BkyParser
  private formName: string
  private packageName: string
  private indent: string
  private variableTypes: Map<string, YailType>
  private blockRegistry: Map<string, (block: Block) => SchemeExpr>

  private componentBlocks: ComponentBlocks
  private controlBlocks: ControlBlocks
  private dictionaryBlocks: DictionaryBlocks
  private helperBlocks: HelperBlocks
  private logicBlocks: LogicBlocks
  private mathBlocks: MathBlocks
  private textBlocks: TextBlocks
  private variableBlocks: VariableBlocks
  private procedureBlocks: ProcedureBlocks
  private listBlocks: ListBlocks
  private colorBlocks: ColorBlocks

  static async generate(scmContent: string, bkyContent: string): Promise<string> {
    await componentMetadata.load()

    const scmParser = ScmParser.parse(scmContent)
    const bkyParser = BkyParser.parse(bkyContent)

    const generator = new YailGenerator(scmParser, bkyParser)
    return generator.generateYail()
  }

  constructor(scmParser: ScmParser, bkyParser: BkyParser) {
    this.scmParser = scmParser
    this.bkyParser = bkyParser
    this.formName = scmParser.getFormName()
    this.packageName = 'io.makeroid.companion'
    this.indent = '    '

    this.variableTypes = new Map<string, YailType>()
    this.blockRegistry = new Map<string, (block: Block) => SchemeExpr>()

    // Initialize block classes without registering blocks yet
    this.componentBlocks = new ComponentBlocks(this)
    this.controlBlocks = new ControlBlocks(this)
    this.dictionaryBlocks = new DictionaryBlocks(this)
    this.helperBlocks = new HelperBlocks(this)
    this.logicBlocks = new LogicBlocks(this)
    this.mathBlocks = new MathBlocks(this)
    this.textBlocks = new TextBlocks(this)
    this.variableBlocks = new VariableBlocks(this)
    this.procedureBlocks = new ProcedureBlocks(this)
    this.listBlocks = new ListBlocks(this)
    this.colorBlocks = new ColorBlocks(this)

    // Now register all the blocks after all instances are created
    this.registerAllBlocks()
  }

  private registerAllBlocks(): void {
    this.componentBlocks.registerBlocks()
    this.controlBlocks.registerBlocks()
    this.dictionaryBlocks.registerBlocks()
    this.helperBlocks.registerBlocks()
    this.logicBlocks.registerBlocks()
    this.mathBlocks.registerBlocks()
    this.textBlocks.registerBlocks()
    this.variableBlocks.registerBlocks()
    this.procedureBlocks.registerBlocks()
    this.listBlocks.registerBlocks()
    this.colorBlocks.registerBlocks()
  }

  generateYail(): string {
    const components = this.scmParser.getAllComponents()
    const validation = componentMetadata.validateComponents(components)

    if (!validation.valid) {
      console.warn('Component validation warnings:', validation.errors)
    }

    const sections = [
      this.generateHeader(),
      this.generateGlobalVariables(),
      this.generateProcedures(),
      this.generateFormSetup(),
      this.generateComponents(),
      this.generateInitRuntime()
    ]

    return sections.flat().map(section => section.format()).join('\n\n') + '\n'
  }

  private generateHeader(): SchemeExpr[] {
    const yailHeader = Scheme.blockComment("$Source $Yail")
    const formDef = YailConstructs.yailFormDef(this.packageName, this.formName)
    const require = Scheme.list(
      Scheme.symbol('require'),
      Scheme.symbol('<com.google.youngandroid.runtime>')
    )

    return [yailHeader, formDef, require]
  }

  private generateGlobalVariables(): SchemeExpr[] {
    const globalVars = this.bkyParser.getGlobalVariables()

    return globalVars.map(varBlock => {
      const varName = varBlock.fields?.NAME
      if (!varName) return

      const varValue = this.statementToCode(varBlock.values?.VALUE)

      const schemeValue = varValue[0]
      if (!schemeValue) return

      return YailConstructs.yailGlobalDef(varName, schemeValue)
    }).filter(e => e != null)
  }

  private generateProcedures(): SchemeExpr[] {
    const procedures = this.bkyParser.getProcedureDefinitions()

    return procedures.map(procBlock => {
      return this.procedureBlocks.generateProcedureDefinition(procBlock)
    })
  }

  private generateFormSetup(): SchemeExpr[] {
    const formProps = this.scmParser.getFormProperties()
    const formComment = Scheme.lineComment(this.formName)
    const setupCode: SchemeExpr[] = [formComment]

    const properties: SchemeExpr[] = Object.entries(formProps).map(([key, value]) => {
      if (!key.startsWith('$') && key !== 'Uuid') {
        const yailType = this.getPropertyType('Form', key, value)
        const yailValue = this.convertToYailValue(value, yailType)

        return YailConstructs.yailSetProperty(
          this.formName,
          key,
          yailValue,
          yailType
        )
      }
    }).filter(e => e != null)

    const formSetup = YailConstructs.yailFormSetup(properties)
    setupCode.push(formSetup)

    const formEvents = this.getEventHandlersForComponent(this.formName)
    setupCode.push(...formEvents)

    return setupCode
  }

  private generateComponents(): SchemeExpr[] {
    const components = this.scmParser.getAllComponents()
    const componentCode: SchemeExpr[] = []

    const nonFormComponents = components.filter(comp => comp.name !== this.formName)

    nonFormComponents.forEach(comp => {
      const componentComment = Scheme.lineComment(comp.name)
      componentCode.push(componentComment)

      const properties: SchemeExpr[] = Object.entries(comp.properties).map(([key, value]) => {
        const yailType = this.getPropertyType(comp.type, key, value)
        const yailValue = this.convertToYailValue(value, yailType)

        return YailConstructs.yailSetProperty(
          comp.name,
          key,
          yailValue,
          yailType
        )
      })

      const parentName = comp.parent || this.formName
      const addComponent = YailConstructs.yailAddComponent(
        parentName,
        `com.google.appinventor.components.runtime.${comp.type}`,
        comp.name,
        properties
      )
      componentCode.push(addComponent)

      const componentEvents = this.getEventHandlersForComponent(comp.name)
      componentCode.push(...componentEvents)
    })

    return componentCode
  }

  private getEventHandlersForComponent(componentName: string): SchemeExpr[] {
    const eventHandlers = this.bkyParser.getEventHandlers()

    return eventHandlers.map(eventBlock => {
      const blockComponentName = (eventBlock.mutation?.instance_name) ||
        eventBlock.fields?.COMPONENT_SELECTOR || 'Screen1'

      if (blockComponentName === componentName) {
        const eventName = this.parseEventName(eventBlock)
        const componentType = (eventBlock.mutation?.component_type) || 'Form'
        const params = this.parseEventParamsFromMetadata(componentType, eventName)

        const body = eventBlock.statements?.DO
          ? this.statementToCode(eventBlock.statements.DO)
          : ''

        const bodyExpr = body ? body : []
        return YailConstructs.yailEventDef(componentName, eventName, params, bodyExpr)
      }
    }).filter(e => e != null)
  }

  private generateInitRuntime(): SchemeExpr[] {
    return [Scheme.list(Scheme.symbol('init-runtime'))]
  }

  statementToCode(block?: Block): SchemeExpr[] {
    if (!block) return []

    const blockCode = this.valueToCode(block)

    if (block.next) {
      const nextBlockCode = this.statementToCode(block.next)
      if (nextBlockCode) {
        return [blockCode, ...nextBlockCode]
      }
    }

    return [blockCode]
  }

  /**
   * Register a block generator function for a specific block type
   */
  register(blockType: string, generator: (block: Block) => SchemeExpr): void {
    this.blockRegistry.set(blockType, generator)
  }

  valueToCode(block?: Block): SchemeExpr {
    if (!block) {
      return Scheme.blockComment('; Empty block')
    }

    const generator = this.blockRegistry.get(block.type)
    if (!generator) {
      throw new Error(`No generator registered for block type: ${block.type}`)
    }

    return generator(block)
  }

  private generateGenericBlock(block: Block): SchemeExpr {
    return Scheme.blockComment(`; TODO: Handle block type '${block.type}'`)
  }

  // Helper methods continue in next part due to length...
  convertToYailValue(value: any, yailType: YailType): SchemeExpr {
    switch (yailType) {
      case 'number':
        if (typeof value === 'string' && value.startsWith('&H')) {
          return Scheme.atom(`#x${value.substring(2).toUpperCase()}`)
        }
        if (typeof value === 'string') {
          const numValue = parseFloat(value)
          return isNaN(numValue) ? Scheme.atom(0) : Scheme.atom(numValue)
        }
        if (typeof value === 'number') {
          return Scheme.atom(value)
        }
        if (typeof value === 'boolean') {
          return value ? Scheme.atom(1) : Scheme.atom(0)
        }
        return Scheme.atom(0)

      case 'boolean':
        if (typeof value === 'boolean') {
          return value ? Scheme.true() : Scheme.false()
        }
        if (typeof value === 'string') {
          const lowerValue = value.toLowerCase()
          return (lowerValue === 'true' || lowerValue === 't' || lowerValue === '1') ? Scheme.true() : Scheme.false()
        }
        if (typeof value === 'number') {
          return value !== 0 ? Scheme.true() : Scheme.false()
        }
        return Scheme.false()

      case 'text':
      default:
        if (typeof value === 'string') {
          return Scheme.string(value)
        }
        if (typeof value === 'number') {
          return Scheme.string(String(value))
        }
        if (typeof value === 'boolean') {
          return Scheme.string(String(value))
        }
        return Scheme.string(value)
    }
  }

  getPropertyType(componentType: string, propertyName: string, value: any): YailType {
    try {
      const propertyMetadata = componentMetadata.getProperty(componentType, propertyName)
      if (propertyMetadata) {
        return propertyMetadata.type
      }
    } catch (error) {
      console.warn(`Could not get property type for ${componentType}.${propertyName}:`, (error as Error).message)
    }
    return this.getYailType(value)
  }

  getYailType(value: any): YailType {
    if (typeof value === 'string') {
      if (value.startsWith('&H')) return 'number'
      return 'text'
    }
    if (typeof value === 'number') return 'number'
    if (typeof value === 'boolean') return 'boolean'
    return 'text'
  }

  inferYailType(block?: Block): YailType {
    if (!block) return YAIL_TYPES.TEXT

    switch (block.type) {
      case 'math_number': return YAIL_TYPES.NUMBER
      case 'logic_boolean': return YAIL_TYPES.BOOLEAN
      case 'text': return YAIL_TYPES.TEXT
      case 'lists_create_with': return YAIL_TYPES.LIST
      case 'lists_empty': return YAIL_TYPES.LIST

      case 'math_arithmetic':
      case 'math_single':
      case 'math_round':
      case 'math_random_int':
      case 'math_random_float':
      case 'math_constant':
        return YAIL_TYPES.NUMBER

      case 'logic_compare':
      case 'logic_operation':
      case 'logic_negate':
        return YAIL_TYPES.BOOLEAN

      case 'text_join':
      case 'text_append':
      case 'text_changeCase':
      case 'text_trim':
      case 'text_charAt':
      case 'text_getSubstring':
        return YAIL_TYPES.TEXT

      case 'color_picker':
      case 'color_make_color':
        return YAIL_TYPES.NUMBER

      case 'component_method':
        return this.inferComponentMethodReturnType(block)

      case 'component_get_property':
        return this.inferComponentPropertyType(block)

      case 'lexical_variable_get':
      case 'global_declaration':
        return this.inferVariableType(block)

      case 'procedures_callnoreturn':
      case 'procedures_callreturn':
        return this.inferProcedureReturnType(block)

      default:
        if (block.fields?.VALUE) {
          return this.inferTypeFromValue(block.fields.VALUE)
        }
        return YAIL_TYPES.ANY
    }
  }

  // Additional helper methods would continue here...
  private inferComponentMethodReturnType(block: Block): YailType {
    try {
      const componentType = this.getComponentType(block)
      const methodName = this.getMethodName(block)

      if (componentType && methodName) {
        const methodMetadata = componentMetadata.getMethod(componentType, methodName)
        if (methodMetadata?.returnType) {
          return componentMetadata.normalizePropertyType(methodMetadata.returnType)
        }
      }
    } catch (error) {
      // Fallback to any if metadata unavailable
    }
    return YAIL_TYPES.ANY
  }

  private inferComponentPropertyType(block: Block): YailType {
    try {
      const componentType = this.getComponentType(block)
      const propertyName = this.getPropertyName(block)

      if (componentType && propertyName) {
        const propertyMetadata = componentMetadata.getProperty(componentType, propertyName)
        if (propertyMetadata?.type) {
          return componentMetadata.normalizePropertyType(propertyMetadata.type)
        }
      }
    } catch (error) {
      // Fallback to any if metadata unavailable
    }
    return YAIL_TYPES.ANY
  }

  private inferVariableType(block: Block): YailType {
    const variableName = this.getVariableName(block)
    if (variableName && this.variableTypes.has(variableName)) {
      return this.variableTypes.get(variableName)!
    }
    return YAIL_TYPES.ANY
  }

  trackVariableType(variableName: string, valueBlock?: Block): void {
    if (variableName && valueBlock) {
      const inferredType = this.inferYailType(valueBlock)
      if (inferredType !== YAIL_TYPES.ANY) {
        this.variableTypes.set(variableName, inferredType)
      }
    }
  }

  getVariableName(block: Block): string | null {
    if (block.fields?.VAR) {
      return block.fields.VAR
    }
    if (block.fields?.VARIABLE) {
      return block.fields.VARIABLE
    }
    if (block.mutation?.variable_name) {
      return block.mutation.variable_name
    }
    return null
  }

  private inferProcedureReturnType(block: Block): YailType {
    if (block.type === 'procedures_callnoreturn') {
      return YAIL_TYPES.TEXT
    }
    return YAIL_TYPES.ANY
  }

  private getComponentType(block: Block): string | null {
    if (block.fields?.COMPONENT_SELECTOR) {
      return block.fields.COMPONENT_SELECTOR.split('.')[0]
    }
    if (block.mutation?.component_type) {
      return block.mutation.component_type
    }
    return null
  }

  private getMethodName(block: Block): string | null {
    if (block.fields?.METHOD_NAME) {
      return block.fields.METHOD_NAME
    }
    if (block.mutation?.method_name) {
      return block.mutation.method_name
    }
    return null
  }

  private getPropertyName(block: Block): string | null {
    if (block.fields?.PROPERTY_NAME) {
      return block.fields.PROPERTY_NAME
    }
    if (block.mutation?.property_name) {
      return block.mutation.property_name
    }
    return null
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

  parseEventName(eventBlock: Block): string {
    if (eventBlock.mutation?.event_name) {
      return eventBlock.mutation.event_name
    }
    if (eventBlock.fields?.EVENT_NAME) {
      return eventBlock.fields.EVENT_NAME
    }
    if (eventBlock.type) {
      if (eventBlock.type.includes('_when')) {
        const parts = eventBlock.type.split('_when_')
        if (parts.length > 1) {
          if (!parts[1]) throw new Error("todo")
          return parts[1]
        }
      }
      if (eventBlock.type === 'component_event') {
        return eventBlock.fields?.METHOD_NAME || 'Initialize'
      }
    }
    return 'Initialize'
  }

  parseEventParamsFromMetadata(componentType: string, eventName: string): string[] {
    try {
      const eventMetadata = componentMetadata.getEvent(componentType, eventName)
      if (eventMetadata?.params) {
        return eventMetadata.params.map(param => param.name)
      }
    } catch (error) {
      console.warn(`Could not get event params for ${componentType}.${eventName}:`, (error as Error).message)
    }
    return []
  }

  inferComponentType(componentName: string): string {
    const components = this.scmParser.getAllComponents()
    const component = components.find(comp => comp.name === componentName)
    return component ? component.type : 'unknown'
  }

  getMethodParameterTypes(componentType: string, methodName: string, argCount: number, actualArgs: Block[] = []): YailType[] {
    try {
      const methodMetadata = componentMetadata.getMethod(componentType, methodName)
      if (methodMetadata?.params) {
        return methodMetadata.params.map((param, index) => {
          if (param.type) {
            return componentMetadata.normalizePropertyType(param.type)
          }

          if (actualArgs[index]) {
            const inferredType = this.inferYailType(actualArgs[index])
            if (inferredType !== YAIL_TYPES.ANY) {
              return inferredType
            }
          }

          return YAIL_TYPES.ANY
        })
      }
    } catch (error) {
      console.warn(`Could not get method parameter types for ${componentType}.${methodName}:`, (error as Error).message)
    }

    if (actualArgs.length > 0) {
      return actualArgs.map(arg => {
        const inferredType = this.inferYailType(arg)
        return inferredType !== YAIL_TYPES.ANY ? inferredType : YAIL_TYPES.ANY
      })
    }

    return new Array(argCount).fill(YAIL_TYPES.ANY)
  }

  private inferTypeFromValue(value: any): YailType {
    if (typeof value === 'number') return YAIL_TYPES.NUMBER
    if (typeof value === 'boolean') return YAIL_TYPES.BOOLEAN
    if (typeof value === 'string') {
      if (value.startsWith('&H')) return YAIL_TYPES.NUMBER
      return YAIL_TYPES.TEXT
    }
    return YAIL_TYPES.ANY
  }
}

export default YailGenerator
