import { parseScm } from '#/scm/parse.js'
import type { ComponentDescriptor, ComponentPropertyDescriptor } from '#/component-descriptor/descriptors.js'
import type { Diagnostic } from '#/diagnostics.js'
import type { Environment } from '#/environment/index.js'
import type { ModelProject, ModelScreen, ModelComponent, ComponentProperty } from './types.js'
import type { ComponentRegistry } from '#/component-descriptor/registries.js'
import type { AiaProject, AiaComponent } from '#/types.js'

export type { ModelProject, ModelScreen, ModelComponent, ComponentProperty } from './types.js'

export function buildModel(project: AiaProject, environment: Environment): ModelProject {
  const diagnostics: Diagnostic[] = []
  const screens: ModelScreen[] = []
  const mutableComponentRegistry = environment.componentRegistry.toMutable()

  for (const extension of project.extensions) {
    mutableComponentRegistry.add(extension.components)
  }

  const componentRegistry = mutableComponentRegistry.snapshot()

  for (const screen of project.screens) {
    let root: AiaComponent
    try {
      root = parseScm(screen.scm)
    } catch (e) {
      diagnostics.push({
        code: 'MALFORMED_SCM',
        severity: 'error',
        path: ['screens', screen.name],
        message: `Failed to parse SCM for "${screen.name}": ${e}`,
      })
      continue
    }
    const form = resolveComponent(root, componentRegistry, ['screens', screen.name], diagnostics)
    screens.push({ source: screen, name: screen.name, form })
  }

  return {
    _tag: 'ModelProject',
    source: project,
    environment,
    componentRegistry,
    builtinBlockRegistry: environment.builtinBlockRegistry,
    screens,
    diagnostics,
  }
}

function resolveComponent(
  raw: AiaComponent,
  componentRegistry: ComponentRegistry,
  path: string[],
  diagnostics: Diagnostic[],
): ModelComponent {
  const compPath = [...path, raw.name]
  const fullType = raw.type.includes('.')
    ? raw.type
    : `com.google.appinventor.components.runtime.${raw.type}`

  let descriptor = componentRegistry.lookup(fullType)
  if (!descriptor) {
    diagnostics.push({
      code: 'UNRESOLVABLE_COMPONENT',
      severity: 'warning',
      path: compPath,
      message: `No descriptor found for component type "${raw.type}"`,
    })
    descriptor = makeFallbackDescriptor(raw.type, fullType)
  }

  const properties: ComponentProperty[] = Object.entries(raw.properties).map(([name, value]) => {
    const propDesc = descriptor!.properties.find((p: ComponentPropertyDescriptor) => p.name === name) ?? null
    return { name, value, descriptor: propDesc }
  })

  const children = raw.children.map(child =>
    resolveComponent(child, componentRegistry, compPath, diagnostics)
  )

  return { name: raw.name, type: raw.type, uid: raw.uid, descriptor, properties, children }
}

function makeFallbackDescriptor(simpleName: string, fullType: string): ComponentDescriptor {
  return {
    type: fullType,
    name: simpleName,
    external: false,
    version: 1,
    categoryString: 'UNKNOWN',
    helpString: '',
    showOnPalette: false,
    nonVisible: false,
    iconName: '',
    properties: [],
    blockProperties: [],
    events: [],
    methods: [],
  }
}
