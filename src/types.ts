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

export interface ExtensionBuildInfoJson {
  type: string;
  metadata: unknown[];
}

export interface ComponentPropertyEditor {
  name: string;
  value: string;
  editorType?: string;
}
