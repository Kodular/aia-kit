// ===== Core Block Types =====
export interface Block {
  type: string
  id?: string
  x?: number
  y?: number
  collapsed?: boolean
  disabled?: boolean
  fields?: { [key: string]: any }
  values?: { [key: string]: Block }
  statements?: { [key: string]: Block }
  mutation?: { [key: string]: any }
  extraState?: { [key: string]: any }
  next?: Block
}

// Alias for backward compatibility with BkyParser
export type ParsedBlock = Block

// ===== Component Types =====
export interface Component {
  name: string
  type: string
  properties: { [key: string]: any }
  parent: string | null
  version?: string
  uuid?: string
}

export interface ComponentHierarchy {
  name: string
  type: string
  properties: { [key: string]: any }
  children: ComponentHierarchy[]
}

// ===== SCM Types =====
export interface ScmData {
  yaVersion: number
  source: string
  formName: string
  formType: string
  properties: { [key: string]: any }
  components: Component[]
  hierarchy: ComponentHierarchy | null
}

export interface RawComponent {
  $Name: string
  $Type: string
  $Version?: string
  Uuid?: string
  $Components?: RawComponent[]
  [key: string]: any
}

export interface ScmJson {
  authURL: string[];
  YaVersion: string;
  Source: string;
  Properties: RawComponent;
}

// Legacy compatibility
export interface ComponentJson extends RawComponent {}

// ===== YAIL Types =====
export const YAIL_TYPES = {
  ANY: 'any',
  TEXT: 'text',
  NUMBER: 'number',
  BOOLEAN: 'boolean',
  LIST: 'list',
  COMPONENT: 'component',
  PROCEDURE: 'procedure',
  DICTIONARY: 'dictionary',
  KEY: 'key',
  PAIR: 'pair'
} as const

export type YailType = typeof YAIL_TYPES[keyof typeof YAIL_TYPES]

// ===== Statistics Types =====
export interface BkyStatistics {
  totalBlocks: number
  topLevelBlocks: number
  blockTypes: { [type: string]: number }
  globalVariables: number
  procedures: number
  eventHandlers: number
}

export interface ComponentDescriptorJson {
  type: string;
  name: string;
  external: "true" | "false";
  version: string;
  dateBuilt: string;
  categoryString: string;
  helpString: string;
  helpUrl: string;
  showOnPalette: "true" | "false";
  nonVisible: "true" | "false";
  iconName: string;
  androidMinSdk: string | number;
  properties: ComponentDescriptorProperty[];
  blockProperties: ComponentDescriptorBlockProperty[];
  events: ComponentDescriptorEvent[];
  methods: ComponentDescriptorMethod[];
}

// ===== Component Metadata Types =====
export interface ComponentMetadata {
  validateComponents(components: Component[]): { valid: boolean; errors: string[] }
  getProperty(componentType: string, propertyName: string): PropertyMetadata | null
  getMethod(componentType: string, methodName: string): MethodMetadata | null
  getEvent(componentType: string, eventName: string): EventMetadata | null
  normalizePropertyType(type: string): YailType
}

export interface PropertyMetadata {
  type: YailType
  description?: string
  editorType?: string
  defaultValue?: string
}

export interface MethodMetadata {
  returnType?: YailType
  params?: ParameterMetadata[]
  description?: string
  deprecated?: boolean
}

export interface EventMetadata {
  params?: ParameterMetadata[]
  description?: string
  deprecated?: boolean
}

export interface ParameterMetadata {
  name: string
  type?: YailType
  description?: string
}

// ===== Block Handler Types =====
export interface BlockHandler {
  new (generator: any): any
  registerBlocks(): void
}

export interface ComponentDescriptorProperty {
  name: string;
  editorType: string;
  defaultValue: string;
  propertyType: string;
  editorArgs: any[];
}

export interface ComponentDescriptorBlockProperty {
  name: string;
  description: string;
  type: string;
  rw: string;
  deprecated: string;
}

export interface ComponentDescriptorEvent {
  name: string;
  description: string;
  deprecated: string;
  params: ComponentDescriptorParam[];
}

export interface ComponentDescriptorMethod {
  name: string;
  description: string;
  deprecated: string;
  params: ComponentDescriptorParam[];
  returnType?: string;
}

export interface ComponentDescriptorParam {
  name: string;
  type: string;
}

export interface ExtensionDescriptorJson {
  type: string;
  name: string;
  external: "true" | "false";
  version: string;
  dateBuilt: string;
  categoryString: string;
  helpString: string;
  helpUrl: string;
  showOnPalette: "true" | "false";
  nonVisible: "true" | "false";
  iconName: string;
  androidMinSdk: number;
  versionName: string;
  versionCode: string;
  properties: ComponentDescriptorProperty[];
  blockProperties: ComponentDescriptorBlockProperty[];
  events: ComponentDescriptorEvent[];
  methods: ComponentDescriptorMethod[];
}

export interface ExtensionDescriptorProperty {
  name: string;
  editorType: string;
  defaultValue: string;
}

export interface ExtensionBuildInfoJson {
  type: string;
  metadata: unknown[];
}

export interface ComponentPropertyEditor {
  name: string;
  value: string;
  editorType?: string;
}
