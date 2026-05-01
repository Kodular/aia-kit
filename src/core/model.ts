import type { AiaProject, AiaScreen } from './types.js'
import type { ComponentDescriptor, ComponentPropertyDescriptor } from './descriptors.js'
import type { Diagnostic } from './diagnostics.js'
import type { Environment } from './environment.js'

export interface ModelProject {
  readonly _tag: 'ModelProject'
  source: AiaProject
  environment: Environment
  screens: ModelScreen[]
  diagnostics: Diagnostic[]
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
