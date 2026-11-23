/** Any JSON value. Used where the file formats allow more than aia-kit models. */
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | readonly JsonValue[]
  | { readonly [key: string]: JsonValue };

/** An App Inventor / Kodular project: the full content of an `.aia` archive. */
export interface Project {
  readonly properties: ProjectProperties;
  readonly screens: readonly Screen[];
  readonly assets: readonly Asset[];
  readonly extensions: readonly Extension[];
  /**
   * Archive entries aia-kit does not understand (or could not read). They are
   * written back unchanged, so reading then writing never drops data.
   */
  readonly otherFiles: readonly ArchiveFile[];
}

/** `youngandroidproject/project.properties`. */
export interface ProjectProperties {
  /** Fully qualified main screen, e.g. `appinventor.ai_user.MyApp.Screen1`. */
  readonly main: string;
  /** Project name. */
  readonly name: string;
  /** Display name shown on the device (`aname`). */
  readonly appName?: string;
  readonly versionCode?: number;
  readonly versionName?: string;
  /** Asset name of the app icon. */
  readonly icon?: string;
  readonly sizing?: string;
  readonly theme?: string;
  readonly primaryColor?: string;
  readonly primaryColorDark?: string;
  readonly accentColor?: string;
  readonly actionBar?: boolean;
  readonly usesLocation?: boolean;
  readonly showListsAsJson?: boolean;
  readonly defaultFileScope?: string;
  /** Every other key, verbatim (`assets`, `source`, `build`, platform-specific keys). */
  readonly extra: Readonly<Record<string, string>>;
}

/** One screen: its designer tree and its blocks workspace. */
export interface Screen {
  readonly name: string;
  /** Root `Form` component. `form.name` always equals `name`. */
  readonly form: Component;
  /** Top-level blocks of the workspace. */
  readonly blocks: readonly Block[];
  readonly meta: ScreenMeta;
}

/** File-level metadata that rides along with a screen. Rarely needed by callers. */
export interface ScreenMeta {
  /** `.scm` header fields other than the component tree: `authURL`, `YaVersion`, `Source`. */
  readonly form: Readonly<Record<string, JsonValue>>;
  readonly blocks: BlocksMeta;
}

export interface BlocksMeta {
  /** `xmlns` of the root `<xml>` element. */
  readonly xmlns?: string;
  /** Attributes of `<yacodeblocks>`: `ya-version`, `language-version`. */
  readonly versions?: Readonly<Record<string, string>>;
  /** Top-level elements other than `<block>` and `<yacodeblocks>`. */
  readonly extra?: readonly XmlElement[];
}

/** A designer component. Property values are stored exactly as App Inventor encodes them. */
export interface Component {
  readonly name: string;
  /** Simple name for built-ins (`Button`), fully qualified for extension components. */
  readonly type: string;
  /** Component version (`$Version`), when the file records one. */
  readonly version?: string;
  readonly uuid: string;
  readonly properties: Readonly<Record<string, string>>;
  readonly children: readonly Component[];
  /** Non-string or unrecognised keys, preserved for round-tripping. */
  readonly extra?: Readonly<Record<string, JsonValue>>;
}

/** A Blockly block. `values`, `statements` and `next` hold nested blocks. */
export interface Block {
  readonly type: string;
  readonly id: string;
  readonly fields: Readonly<Record<string, string>>;
  /** Attributes of the `<mutation>` element, e.g. `instance_name`, `event_name`. */
  readonly mutation: Readonly<Record<string, string>>;
  /** Child elements of `<mutation>`, e.g. procedure `<arg>`s. */
  readonly mutationChildren?: readonly XmlElement[];
  /** Value inputs: one expression block per input name. */
  readonly values: Readonly<Record<string, Block>>;
  /** Statement inputs: the first block of each nested stack. */
  readonly statements: Readonly<Record<string, Block>>;
  /** The block attached below this one. */
  readonly next?: Block;
  /** Workspace position; only top-level blocks have one. */
  readonly x?: number;
  readonly y?: number;
  readonly disabled?: boolean;
  readonly collapsed?: boolean;
  readonly inline?: boolean;
  readonly shadow?: boolean;
  readonly comment?: BlockComment;
  /** Unrecognised attributes and child elements, preserved for round-tripping. */
  readonly extraAttributes?: Readonly<Record<string, string>>;
  readonly extraChildren?: readonly XmlElement[];
}

export interface BlockComment {
  readonly text: string;
  /** `pinned`, `h`, `w`. */
  readonly attributes: Readonly<Record<string, string>>;
}

/** A generic XML element, used for the parts of a workspace aia-kit does not model. */
export interface XmlElement {
  readonly tag: string;
  readonly attributes: Readonly<Record<string, string>>;
  readonly children: readonly (XmlElement | string)[];
}

export interface Asset {
  /** Path relative to `assets/`, usually just a file name. */
  readonly name: string;
  readonly blob: Blob;
}

/** A file inside an archive. */
export interface ArchiveFile {
  readonly path: string;
  readonly blob: Blob;
}

/** An extension (`.aix`), standalone or bundled in a project. */
export interface Extension {
  /** Directory name of the extension, e.g. `com.example.myext`. */
  readonly packageName: string;
  /** Components the extension provides, parsed from its `components.json`. */
  readonly components: readonly ComponentDescriptor[];
  /** Every file of the extension, with paths relative to its directory. */
  readonly files: readonly ArchiveFile[];
}

/** Describes a component type: one entry of `simple_components.json` / `components.json`. */
export interface ComponentDescriptor {
  /** Fully qualified class name. */
  readonly type: string;
  /** Simple name, as used in blocks. */
  readonly name: string;
  readonly external: boolean;
  readonly version: number;
  readonly category: string;
  readonly helpString: string;
  readonly showOnPalette: boolean;
  readonly nonVisible: boolean;
  readonly iconName: string;
  readonly androidMinSdk?: number;
  /** Designer properties. */
  readonly properties: readonly PropertyDescriptor[];
  /** Properties available in blocks. */
  readonly blockProperties: readonly BlockPropertyDescriptor[];
  readonly events: readonly EventDescriptor[];
  readonly methods: readonly MethodDescriptor[];
}

export interface PropertyDescriptor {
  readonly name: string;
  readonly editorType: string;
  readonly defaultValue: string;
  readonly editorArgs: readonly JsonValue[];
}

export interface BlockPropertyDescriptor {
  readonly name: string;
  readonly description: string;
  readonly type: string;
  readonly access: "read-only" | "write-only" | "read-write" | "invisible";
  readonly deprecated: boolean;
}

export interface EventDescriptor {
  readonly name: string;
  readonly description: string;
  readonly deprecated: boolean;
  readonly params: readonly ParamDescriptor[];
}

export interface MethodDescriptor extends EventDescriptor {
  readonly returnType?: string;
}

export interface ParamDescriptor {
  readonly name: string;
  readonly type: string;
}
