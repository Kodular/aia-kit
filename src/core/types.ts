import type { ComponentDescriptor } from '#/core/descriptors.js'

export interface ProjectProperties {
  /** Fully-qualified main screen class, e.g. "appinventor.ai_user.MyApp.Screen1" */
  main: string
  name: string
  versionCode: number
  versionName: string
  appName?: string
  sizing?: 'Fixed' | 'Responsive'
  theme?: string
  colorPrimary?: string
  colorPrimaryDark?: string
  colorAccent?: string
  showListsAsJsonArray?: boolean
  actionBar?: boolean
  /** All other key-value pairs not explicitly modelled above */
  unknown: Record<string, string>
}

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

import type { Diagnostic } from '#/core/diagnostics.js'

export interface MutationResult {
  project: AiaProject
  diagnostics: Diagnostic[]
}
