import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { YAIL_TYPES, type YailType, type Component, type EventMetadata, type ComponentMetadata as IComponentMetadata, type MethodMetadata, type PropertyMetadata } from '../../types.js'

interface RawComponent {
  type: string
  categoryString?: string
  nonVisible?: string
  version?: string
  blockProperties?: Array<{
    name: string
    type: string
    description?: string
    rw?: string
    deprecated?: string
  }>
  properties?: Array<{
    name: string
    defaultValue?: any
    editorType?: string
  }>
  methods?: Array<{
    name: string
    description?: string
    params?: any[]
    returnType?: string
    deprecated?: string
  }>
  events?: Array<{
    name: string
    description?: string
    params?: any[]
    deprecated?: string
  }>
}

interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  unsupportedComponents: Array<{
    name: string
    type: string
  }>
  validComponents: string[]
}

interface ComponentStatistics {
  totalComponents: number
  categories: { [category: string]: number }
  visibility: {
    visible: number
    nonVisible: number
  }
  supportedCount: number
}

class ComponentMetadata implements IComponentMetadata {
  private componentsData: RawComponent[] | null = null
  private supportedComponents: Set<string> | null = null
  private loaded = false

  async load(): Promise<void> {
    if (this.loaded) return

    const __filename = fileURLToPath(import.meta.url)
    const __dirname = path.dirname(__filename)

    const basePath = '../../../appinventor/build/components'
    const jsonPath = path.resolve(__dirname, basePath, 'simple_components.json')
    const txtPath = path.resolve(__dirname, basePath, 'simple_components.txt')

    try {
      const [jsonContent, txtContent] = await Promise.all([
        fs.readFile(jsonPath, 'utf8'),
        fs.readFile(txtPath, 'utf8')
      ])

      this.componentsData = JSON.parse(jsonContent)
      this.supportedComponents = new Set(
        txtContent.split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0)
      )

      this.loaded = true
    } catch (error) {
      throw new Error(`Failed to load component metadata: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  validateComponents(components: Component[]): ValidationResult {
    const results: ValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      unsupportedComponents: [],
      validComponents: []
    }

    for (const component of components) {
      if (!this.isSupported(component.type)) {
        results.unsupportedComponents.push({
          name: component.name,
          type: component.type
        })
        results.errors.push(`Unsupported component: ${component.type} (${component.name})`)
        results.valid = false
      } else {
        results.validComponents.push(component.name)
      }
    }

    return results
  }

  private getComponent(componentType: string): RawComponent | null {
    if (!this.loaded) {
      throw new Error('Component metadata not loaded. Call load() first.')
    }

    const fullType = componentType.includes('.')
      ? componentType
      : `com.google.appinventor.components.runtime.${componentType}`

    return this.componentsData?.find(comp => comp.type === fullType) || null
  }

  private isSupported(componentType: string): boolean {
    if (!this.loaded) {
      throw new Error('Component metadata not loaded. Call load() first.')
    }

    const fullType = componentType.includes('.')
      ? componentType
      : `com.google.appinventor.components.runtime.${componentType}`

    return this.supportedComponents?.has(fullType) || false
  }

  getProperty(componentType: string, propertyName: string): PropertyMetadata | null {
    const component = this.getComponent(componentType)
    if (!component) return null

    const blockProp = component.blockProperties?.find(prop => prop.name === propertyName)
    if (blockProp) {
      return {
        type: this.normalizePropertyType(blockProp.type),
        description: blockProp.description
      }
    }

    const editorProp = component.properties?.find(prop => prop.name === propertyName)
    if (editorProp) {
      return {
        type: this.inferTypeFromEditor(editorProp.editorType),
        description: undefined
      }
    }

    return null
  }

  getMethod(componentType: string, methodName: string): MethodMetadata | null {
    const component = this.getComponent(componentType)
    if (!component) return null

    const method = component.methods?.find(method => method.name === methodName)
    if (!method) return null

    return {
      returnType: this.normalizePropertyType(method.returnType || 'void'),
      params: method.params || [],
      description: method.description
    }
  }

  getEvent(componentType: string, eventName: string): EventMetadata | null {
    const component = this.getComponent(componentType)
    if (!component) return null

    const event = component.events?.find(event => event.name === eventName)
    if (!event) return null

    return {
      params: event.params || [],
      description: event.description
    }
  }

  normalizePropertyType(propertyType?: string): YailType {
    if (!propertyType) return YAIL_TYPES.TEXT

    const typeMap: { [key: string]: YailType } = {
      'text': YAIL_TYPES.TEXT,
      'number': YAIL_TYPES.NUMBER,
      'boolean': YAIL_TYPES.BOOLEAN,
      'list': YAIL_TYPES.LIST,
      'color': YAIL_TYPES.NUMBER,
      'asset': YAIL_TYPES.TEXT,
      'component': YAIL_TYPES.COMPONENT,
      'any': YAIL_TYPES.ANY,
      'void': YAIL_TYPES.TEXT
    }

    return typeMap[propertyType.toLowerCase()] || YAIL_TYPES.TEXT
  }

  private inferTypeFromEditor(editorType?: string): YailType {
    if (!editorType) return YAIL_TYPES.TEXT

    const editorTypeMap: { [key: string]: YailType } = {
      'string': YAIL_TYPES.TEXT,
      'text': YAIL_TYPES.TEXT,
      'boolean': YAIL_TYPES.BOOLEAN,
      'integer': YAIL_TYPES.NUMBER,
      'non_negative_integer': YAIL_TYPES.NUMBER,
      'float': YAIL_TYPES.NUMBER,
      'color': YAIL_TYPES.NUMBER,
      'asset': YAIL_TYPES.TEXT,
      'lego_sensor_port': YAIL_TYPES.TEXT,
      'visibility': YAIL_TYPES.BOOLEAN
    }

    return editorTypeMap[editorType] || YAIL_TYPES.TEXT
  }

  getSupportedComponentTypes(): string[] {
    if (!this.loaded) {
      throw new Error('Component metadata not loaded. Call load() first.')
    }

    return Array.from(this.supportedComponents!)
  }

  getCategory(componentType: string): string {
    const component = this.getComponent(componentType)
    return component?.categoryString || 'UNKNOWN'
  }

  isVisible(componentType: string): boolean {
    const component = this.getComponent(componentType)
    return component?.nonVisible !== 'true'
  }

  getVersion(componentType: string): string {
    const component = this.getComponent(componentType)
    return component?.version || '1'
  }

  getStatistics(): ComponentStatistics {
    if (!this.loaded) {
      throw new Error('Component metadata not loaded. Call load() first.')
    }

    const categories: { [category: string]: number } = {}
    const visible = { visible: 0, nonVisible: 0 }

    this.componentsData!.forEach(component => {
      const category = component.categoryString || 'UNKNOWN'
      categories[category] = (categories[category] || 0) + 1

      if (component.nonVisible === 'true') {
        visible.nonVisible++
      } else {
        visible.visible++
      }
    })

    return {
      totalComponents: this.componentsData!.length,
      categories: categories,
      visibility: visible,
      supportedCount: this.supportedComponents!.size
    }
  }
}

const componentMetadata = new ComponentMetadata()
export default componentMetadata
