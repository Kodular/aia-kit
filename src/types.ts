export interface ScmJson {
  authURL: string[];
  YaVersion: string;
  Source: string;
  Properties: ComponentJson;
}

export interface ComponentJson {
  $Name: string;
  $Type: string;
  $Version: string;
  Uuid: string;
  $Components?: ComponentJson[];
  [key: string]: string | ComponentJson[] | undefined;
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
  androidMinSdk: number;
  properties: ComponentDescriptorProperty[];
  blockProperties: ComponentDescriptorBlockProperty[];
  events: ComponentDescriptorEvent[];
  methods: ComponentDescriptorMethod[];
}

interface ComponentDescriptorProperty {
  name: string;
  editorType: string;
  defaultValue: string;
  propertyType: string;
  editorArgs: any[];
}

interface ComponentDescriptorBlockProperty {
  name: string;
  description: string;
  type: string;
  rw: string;
  deprecated: string;
}

interface ComponentDescriptorEvent {
  name: string;
  description: string;
  deprecated: string;
  params: ComponentDescriptorParam[];
}

interface ComponentDescriptorMethod {
  name: string;
  description: string;
  deprecated: string;
  params: ComponentDescriptorParam[];
  returnType?: string;
}

interface ComponentDescriptorParam {
  name: string;
  type: string;
}

export interface ExtensionDescriptorJson {
  type: string;
  name: string;
  external: "true" | "false";
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
  properties: ExtensionDescriptorProperty[];
  blockProperties: unknown[];
  events: unknown[];
  methods: unknown[];
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
