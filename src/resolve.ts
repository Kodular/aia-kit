import { ScmParser } from './components/scm-parser.js'
import type { AiaProject, AiaComponent } from './core/types.js'
import type { ModelProject, ModelScreen, ModelComponent, ComponentProperty } from './core/model.js'
import type { ComponentDescriptor, ComponentPropertyDescriptor } from './core/descriptors.js'
import type { Diagnostic } from './core/diagnostics.js'
import type { Environment } from './core/environment.js'

export function resolve(project: AiaProject, env: Environment): ModelProject {
  const diagnostics: Diagnostic[] = []
  const screens: ModelScreen[] = []

  for (const screen of project.screens) {
    let root: AiaComponent
    try {
      root = ScmParser.parse(screen.scm)
    } catch (e) {
      diagnostics.push({
        code: 'MALFORMED_SCM',
        severity: 'error',
        path: ['screens', screen.name],
        message: `Failed to parse SCM for "${screen.name}": ${e}`,
      })
      continue
    }
    const form = resolveComponent(root, env, ['screens', screen.name], diagnostics)
    screens.push({ source: screen, name: screen.name, form })
  }

  return { _tag: 'ModelProject', source: project, environment: env, screens, diagnostics }
}

function resolveComponent(
  raw: AiaComponent,
  env: Environment,
  path: string[],
  diagnostics: Diagnostic[]
): ModelComponent {
  const compPath = [...path, raw.name]
  const fullType = raw.type.includes('.')
    ? raw.type
    : `com.google.appinventor.components.runtime.${raw.type}`

  let descriptor = env.lookup(fullType)
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
    resolveComponent(child, env, compPath, diagnostics)
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
