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
