import type { Component, ComponentHierarchy, ScmData } from '../types.js'
import type { RawComponent, ScmJson } from '../validators/scm.js'

class ScmParser {
  private formData: ScmJson
  private yaVersion: number
  private source: string
  private properties: RawComponent

  static parse(scmContent: string): ScmParser {
    try {
      // More flexible regex to handle various whitespace patterns
      const jsonMatch = scmContent.match(/#\|\s*\$JSON\s*(.*?)\s*\|#/s)

      if (!jsonMatch || !jsonMatch[1]) {
        throw new Error('Invalid SCM file format - no JSON block found')
      }

      const jsonStr = jsonMatch[1].trim()
      const formData = JSON.parse(jsonStr)

      return new ScmParser(formData)
    } catch (error) {
      throw new Error(`Failed to parse SCM file: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  constructor(formData: ScmJson) {
    this.formData = formData
    this.yaVersion = formData.YaVersion
    this.source = formData.Source
    this.properties = formData.Properties
  }

  getFormProperties(): { [key: string]: any } {
    return this.properties
  }

  getFormName(): string {
    return this.properties.$Name
  }

  getFormType(): string {
    return this.properties.$Type
  }

  getAllComponents(): Component[] {
    const components: Component[] = []

    const dfs = (component: RawComponent, parent: string | null = null): void => {
      const comp: Component = {
        name: component.$Name,
        type: component.$Type,
        parent: parent,
        properties: {}
      }

      Object.keys(component).forEach(key => {
        if (!key.startsWith('$') && key !== 'Uuid') {
          comp.properties[key] = component[key]
        }
      })

      components.push(comp)

      if (component.$Components) {
        component.$Components.forEach(child => {
          dfs(child, comp.name)
        })
      }
    }

    dfs(this.properties)
    return components
  }

  getComponent(name: string): Component | null {
    const components = this.getAllComponents()
    return components.find(comp => comp.name === name) || null
  }

  getComponentsByType(type: string): Component[] {
    const components = this.getAllComponents()
    return components.filter(comp => comp.type === type)
  }

  getComponentHierarchy(): ComponentHierarchy | null {
    const components = this.getAllComponents()
    const rootComponent = components.find(comp => comp.name === this.getFormName())

    const buildTree = (componentName: string): ComponentHierarchy | null => {
      const component = components.find(comp => comp.name === componentName)
      if (!component) return null

      const tree: ComponentHierarchy = {
        name: component.name,
        type: component.type,
        properties: component.properties,
        children: []
      }

      const childComponents = components.filter(comp => comp.parent === componentName)
      childComponents.forEach(child => {
        const childTree = buildTree(child.name)
        if (childTree) {
          tree.children.push(childTree)
        }
      })

      return tree
    }

    return buildTree(this.getFormName())
  }

  toJSON(): ScmData {
    return {
      yaVersion: this.yaVersion,
      source: this.source,
      formName: this.getFormName(),
      formType: this.getFormType(),
      properties: this.properties,
      components: this.getAllComponents(),
      hierarchy: this.getComponentHierarchy()
    }
  }
}

export default ScmParser
