import { Scheme, type SchemeExpr } from '../ast/SchemeAST.js'
import { yailGetComponent, yailGetProperty, yailMethodCall, yailSetProperty } from '../ast/YailConstructs.js'
import type { Block } from '../../../types.js'
import type YailGenerator from '../YailGenerator.js'

export default class ComponentBlocks {
  constructor(private generator: YailGenerator) {}

  registerBlocks(): void {
    this.generator.register('component_method', (block) => this.generateComponentMethodCall(block))
    this.generator.register('component_get_property', (block) => this.generateComponentPropertyGet(block))
    this.generator.register('component_set_property', (block) => this.generateComponentPropertySet(block))
    this.generator.register('component_component_block', (block) => this.generateComponentBlock(block))
    this.generator.register('component_set_get', (block) => this.generateComponentSetGet(block))
  }

  generateComponentMethodCall(block: Block): SchemeExpr {
    const componentName = (block.mutation?.instance_name) ||
      block.fields?.COMPONENT_SELECTOR || 'Screen1'
    const methodName = (block.mutation?.method_name) ||
      block.fields?.METHOD_NAME || 'unknown'
    const componentType = (block.mutation?.component_type) ||
      this.generator.inferComponentType(componentName)

    const args = this.parseMethodArgs(block)
    const actualArgs = args.map(arg => block.values?.[arg]).filter(arg => arg != null)
    const schemeArgs = args.map(arg => {
      return this.generator.valueToCode(block.values?.[arg])
    })

    const paramTypes = this.generator.getMethodParameterTypes(componentType, methodName, args.length, actualArgs)

    return yailMethodCall(
      componentName,
      methodName,
      schemeArgs,
      paramTypes
    )
  }

  generateComponentPropertyGet(block: Block): SchemeExpr {
    const componentName = block.fields?.COMPONENT_SELECTOR || 'Screen1'
    const propertyName = block.fields?.PROPERTY_NAME || 'unknown'

    return yailGetProperty(componentName, propertyName)
  }

  generateComponentPropertySet(block: Block): SchemeExpr {
    const componentName = block.fields?.COMPONENT_SELECTOR || 'Screen1'
    const propertyName = block.fields?.PROPERTY_NAME || 'unknown'
    const schemeValue = this.generator.valueToCode(block.values?.VALUE)
    const valueType = this.generator.inferYailType(block.values?.VALUE)

    return yailSetProperty(
      componentName,
      propertyName,
      schemeValue,
      valueType
    )
  }

  generateComponentBlock(block: Block): SchemeExpr {
    const componentName = block.fields?.COMPONENT_SELECTOR || 'Screen1'
    return yailGetComponent(componentName)
  }

  generateComponentSetGet(block: Block): SchemeExpr {
    const componentName = (block.mutation?.instance_name) ||
      block.fields?.COMPONENT_SELECTOR || 'Screen1'
    const propertyName = (block.mutation?.property_name) ||
      block.fields?.PROPERTY_NAME || 'unknown'

    if (block.values?.VALUE) {
      const value = this.generator.valueToCode(block.values.VALUE)
      const valueType = this.generator.inferYailType(block.values.VALUE)
      return yailSetProperty(componentName, propertyName, value, valueType)
    } else {
      return yailGetProperty(componentName, propertyName)
    }
  }

  private parseMethodArgs(block: Block): string[] {
    const args: string[] = []
    let i = 0
    while (block.values?.[`ARG${i}`]) {
      args.push(`ARG${i}`)
      i++
    }
    return args
  }

}
