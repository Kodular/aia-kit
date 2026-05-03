import type { AiaProject, AiaScreen } from '#/types.js'
import type { ComponentDescriptor, ComponentPropertyDescriptor } from '#/component-descriptor/descriptors.js'
import type { Diagnostic } from '#/diagnostics.js'
import type { Environment } from '#/environment/index.js'
import type { ComponentRegistry } from '#/component-descriptor/registries.js'
import type { BuiltinBlockRegistry } from '#/environment/builtin-blocks.js'

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
