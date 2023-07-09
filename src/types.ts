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

export interface ExtensionDescriptorJson {
    categoryString: string;
    dateBuilt: string;
    nonVisible: "true" | "false";
    iconName: string;
    helpUrl: string;
    type: string;
    versionName: string;
    androidMinSdk: number;
    versionCode: string;
    external: "true" | "false";
    showOnPalette: "true" | "false";
    name: string;
    helpString: string;
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
