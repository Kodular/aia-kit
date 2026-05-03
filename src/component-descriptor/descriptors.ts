import { AiaParseError } from '#/errors.js'

export interface ComponentDescriptorParam {
  name: string
  type: string
}

export interface ComponentPropertyDescriptor {
  name: string
  editorType: string
  defaultValue: string
  propertyType?: string
  editorArgs?: unknown[]
}

export interface ComponentBlockPropertyDescriptor {
  name: string
  description: string
  type: string
  rw: string
  deprecated: boolean
}

export interface ComponentEventDescriptor {
  name: string
  description: string
  deprecated: boolean
  params: ComponentDescriptorParam[]
}

export interface ComponentMethodDescriptor {
  name: string
  description: string
  deprecated: boolean
  params: ComponentDescriptorParam[]
  returnType?: string
}

export interface ComponentDescriptor {
  type: string
  name: string
  external: boolean
  version: number
  categoryString: string
  helpString: string
  showOnPalette: boolean
  nonVisible: boolean
  iconName: string
  properties: ComponentPropertyDescriptor[]
  blockProperties: ComponentBlockPropertyDescriptor[]
  events: ComponentEventDescriptor[]
  methods: ComponentMethodDescriptor[]
}

export function normalizeComponentDescriptor(raw: unknown): ComponentDescriptor {
  if (typeof raw !== 'object' || raw === null) {
    throw new AiaParseError('Component descriptor must be an object', raw)
  }

  const value = raw as Partial<ComponentDescriptor>
  if (typeof value.type !== 'string' || value.type.length === 0) {
    throw new AiaParseError('Component descriptor requires a non-empty type', raw)
  }

  return {
    type: value.type,
    name: typeof value.name === 'string' && value.name.length > 0
      ? value.name
      : value.type.split('.').pop() ?? value.type,
    external: value.external ?? false,
    version: value.version ?? 1,
    categoryString: value.categoryString ?? 'UNKNOWN',
    helpString: value.helpString ?? '',
    showOnPalette: value.showOnPalette ?? true,
    nonVisible: value.nonVisible ?? false,
    iconName: value.iconName ?? '',
    properties: value.properties ?? [],
    blockProperties: value.blockProperties ?? [],
    events: value.events ?? [],
    methods: value.methods ?? [],
  }
}
