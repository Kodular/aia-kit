import type {
  AiaAsset,
  AiaComponent,
  AiaExtension,
  AiaProject,
  AiaScreen,
  ProjectProperties,
} from '#/core/types.js'
import type { ComponentDescriptor } from '#/core/descriptors.js'

export const EMPTY_BKY = '<xml xmlns="https://developers.google.com/blockly/xml"></xml>'

export function scmForScreen(name: string): string {
  return `#|\n$JSON\n{"Properties":{"$Name":"${name}","$Type":"Form","Uuid":"0","$Components":[]}}\n|#`
}

/** Returns a minimal valid {@link ProjectProperties} merged with any overrides. */
export function makeProjectProperties(overrides: Partial<ProjectProperties> = {}): ProjectProperties {
  return {
    main: 'appinventor.ai_user.Project.Screen1',
    name: 'Project',
    versionCode: 1,
    versionName: '1.0',
    unknown: {},
    ...overrides,
  }
}

export function makeScreen(overrides: Partial<AiaScreen> = {}): AiaScreen {
  const name = overrides.name ?? 'Screen1'
  return {
    name,
    scm: overrides.scm ?? scmForScreen(name),
    bky: overrides.bky ?? EMPTY_BKY,
    yail: overrides.yail ?? null,
  }
}

export function makeAsset(name = 'asset.txt', content = new Uint8Array([1, 2, 3])): AiaAsset {
  return {
    name,
    type: name.includes('.') ? name.split('.').pop() ?? '' : '',
    sizeBytes: content.byteLength,
    data: async () => content,
  }
}

export function makeDescriptor(overrides: Partial<ComponentDescriptor> = {}): ComponentDescriptor {
  return {
    type: 'com.google.appinventor.components.runtime.Button',
    name: 'Button',
    external: false,
    version: 1,
    categoryString: 'USERINTERFACE',
    helpString: '',
    showOnPalette: true,
    nonVisible: false,
    iconName: '',
    properties: [],
    blockProperties: [],
    events: [],
    methods: [],
    ...overrides,
  }
}

export function makeExtension(overrides: Partial<AiaExtension> = {}): AiaExtension {
  const packageName = overrides.packageName ?? 'com.example'
  const version = overrides.version ?? 1
  return {
    packageName,
    version,
    minSdk: overrides.minSdk ?? 7,
    components: overrides.components ?? [makeDescriptor({ type: `${packageName}.ExtensionComponent`, name: 'ExtensionComponent', external: true })],
    manifest: overrides.manifest ?? { packageName, version, minSdk: 7, buildVersion: '1', permissions: [] },
    loadClasses: overrides.loadClasses ?? (async () => new Uint8Array()),
    loadAssets: overrides.loadAssets ?? (async () => []),
  }
}

export function makeComponent(overrides: Partial<AiaComponent> = {}): AiaComponent {
  return {
    name: 'Component1',
    type: 'Button',
    uid: 'component-1',
    properties: {},
    children: [],
    ...overrides,
  }
}

export function makeMinimalProject(overrides: Partial<AiaProject> = {}): AiaProject {
  return {
    _tag: 'AiaProject',
    name: 'Project',
    properties: makeProjectProperties(),
    screens: [makeScreen()],
    assets: [],
    extensions: [],
    ...overrides,
  }
}
