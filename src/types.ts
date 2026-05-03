import type { ComponentDescriptor } from '#/component-descriptor/descriptors.js'
import type { Diagnostic } from '#/diagnostics.js'
import type { ProjectProperties } from '#/project-properties/index.js'

export interface AiaProject {
  readonly _tag: 'AiaProject'
  name: string
  properties: ProjectProperties
  screens: AiaScreen[]
  assets: AiaAsset[]
  extensions: AiaExtension[]
}

export interface AiaScreen {
  name: string
  scm: string
  bky: string
  yail: string | null
}

export interface AiaAsset {
  name: string
  type: string
  sizeBytes: number
  data(): Promise<Uint8Array>
}

export interface AixManifest {
  packageName: string
  version: number
  minSdk: number
  buildVersion: string
  permissions: string[]
}

export interface AixAsset {
  name: string
  data(): Promise<Uint8Array>
}

export interface AiaExtension {
  packageName: string
  version: number
  minSdk: number
  components: ComponentDescriptor[]
  manifest: AixManifest
  loadClasses(): Promise<Uint8Array>
  loadAssets(): Promise<AixAsset[]>
}

export interface AiaComponent {
  name: string
  type: string
  uid: string
  properties: Record<string, string>
  children: AiaComponent[]
}

export interface MutationResult {
  project: AiaProject
  diagnostics: Diagnostic[]
}
