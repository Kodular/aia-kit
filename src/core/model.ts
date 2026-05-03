import type { AiaProject, AiaScreen } from '#/core/types.js'
import type { ComponentDescriptor, ComponentPropertyDescriptor } from '#/core/descriptors.js'
import type { Diagnostic } from '#/core/diagnostics.js'
import type { Environment } from '#/core/environment.js'
import type { BuiltinBlockRegistry, ComponentRegistry } from '#/core/registries.js'

export interface ModelProject {
  readonly _tag: 'ModelProject'
  readonly source: AiaProject
  readonly environment: Environment
  readonly componentRegistry: ComponentRegistry
  readonly builtinBlockRegistry: BuiltinBlockRegistry
  readonly screens: readonly ModelScreen[]
  readonly diagnostics: readonly Diagnostic[]
}

export interface ModelScreen {
  source: AiaScreen
  name: string
  form: ModelComponent
}

export interface ModelComponent {
  name: string
  type: string
  uid: string
  descriptor: ComponentDescriptor
  properties: ComponentProperty[]
  children: ModelComponent[]
}

export interface ComponentProperty {
  name: string
  value: string
  descriptor: ComponentPropertyDescriptor | null
}
