# aia-kit API reference

The root `aia-kit` export is intentionally small and type-focused. Prefer domain subpaths such as `aia-kit/aia`, `aia-kit/scm`, `aia-kit/bky`, `aia-kit/model`, and `aia-kit/environment` for operational APIs. For a guided walkthrough see [usage.md](usage.md).

---

## Raw data types

These types faithfully represent the AIA/AIX file format. They are what `readAia` / `readAix` return and what `writeAia` consumes.

### `AiaProject`

```typescript
interface AiaProject {
  readonly _tag: 'AiaProject'
  name: string
  properties: ProjectProperties
  screens: AiaScreen[]
  assets: AiaAsset[]
  extensions: AiaExtension[]
}
```

### `AiaScreen`

```typescript
interface AiaScreen {
  name: string
  scm: string       // raw SCM text (designer component tree)
  bky: string       // raw BKY text (Blockly XML)
  yail: string | null
}
```

### `AiaAsset`

```typescript
interface AiaAsset {
  name: string
  type: string
  sizeBytes: number
  data(): Promise<Uint8Array>
}
```

### `AiaExtension`

```typescript
interface AiaExtension {
  packageName: string
  version: number
  minSdk: number
  components: ComponentDescriptor[]
  manifest: AixManifest
  loadClassesJar(): Promise<Uint8Array>
  loadAssets(): Promise<AixAsset[]>
}
```

### `AixManifest`

```typescript
interface AixManifest {
  packageName: string
  version: number
  minSdk: number
  buildVersion: string
  permissions: string[]
}
```

### `AixAsset`

```typescript
interface AixAsset {
  name: string
  data(): Promise<Uint8Array>
}
```

### `AiaComponent`

Raw component node from the SCM tree.

```typescript
interface AiaComponent {
  name: string
  type: string
  uid: string
  properties: Record<string, string>
  children: AiaComponent[]
}
```

### `ProjectProperties`

Typed representation of `project.properties`.

```typescript
interface ProjectProperties {
  main: string           // e.g. "appinventor.ai_user.MyApp.Screen1"
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
  unknown: Record<string, string>  // unrecognised keys
}
```

The interface is defined in `aia-kit/project-properties` (along with `parseProjectProperties` / `serializeProjectProperties`). The root `aia-kit` and `aia-kit/aia` barrels re-export the type for convenience.

### `MutationResult`

Returned by all mutation functions.

```typescript
interface MutationResult {
  project: AiaProject
  diagnostics: Diagnostic[]
}
```

---

## Model layer types

Produced by `buildModel()`. The model layer enriches raw data with component descriptors from the `Environment`.

### `ModelProject`

```typescript
interface ModelProject {
  readonly _tag: 'ModelProject'
  source: AiaProject       // the underlying raw project
  environment: Environment
  componentRegistry: ComponentRegistry
  builtinBlockRegistry: BuiltinBlockRegistry
  screens: ModelScreen[]
  diagnostics: Diagnostic[]
}
```

### `ModelScreen`

```typescript
interface ModelScreen {
  source: AiaScreen
  name: string
  form: ModelComponent    // root component of the screen
}
```

### `ModelComponent`

```typescript
interface ModelComponent {
  name: string
  type: string
  uid: string
  descriptor: ComponentDescriptor
  properties: ComponentProperty[]
  children: ModelComponent[]
}
```

### `ComponentProperty`

```typescript
interface ComponentProperty {
  name: string
  value: string
  descriptor: ComponentPropertyDescriptor | null  // null if unrecognised
}
```

---

## Descriptor types

Metadata loaded from `simple_components.json` for a given platform.

### `ComponentDescriptor`

```typescript
interface ComponentDescriptor {
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
```

### `ComponentPropertyDescriptor`

```typescript
interface ComponentPropertyDescriptor {
  name: string
  editorType: string
  defaultValue: string
  propertyType?: string
  editorArgs?: unknown[]
}
```

### `ComponentBlockPropertyDescriptor`

```typescript
interface ComponentBlockPropertyDescriptor {
  name: string
  description: string
  type: string
  rw: string
  deprecated: boolean
}
```

### `ComponentEventDescriptor`

```typescript
interface ComponentEventDescriptor {
  name: string
  description: string
  deprecated: boolean
  params: ComponentDescriptorParam[]
}
```

### `ComponentMethodDescriptor`

```typescript
interface ComponentMethodDescriptor {
  name: string
  description: string
  deprecated: boolean
  params: ComponentDescriptorParam[]
  returnType?: string
}
```

### `ComponentDescriptorParam`

```typescript
interface ComponentDescriptorParam {
  name: string
  type: string
}
```

---

## Registry types

### `ComponentRegistry`

Holds component descriptors for a platform. Accessible via `Environment.componentRegistry`.

```typescript
class ComponentRegistry {
  readonly descriptors: ReadonlyArray<ComponentDescriptor>
  lookup(typeName: string): ComponentDescriptor | null
  has(typeName: string): boolean
  toMutable(): MutableComponentRegistry
}
```

### `BuiltinBlockRegistry`

Holds built-in Blockly block metadata. Accessible via `Environment.builtinBlockRegistry`.

```typescript
interface BuiltinBlockRegistry {
  readonly builtins: ReadonlyMap<string, BuiltinBlockDescriptor>
  lookup(type: string): BuiltinBlockDescriptor | null
}
```

### `BuiltinBlockDescriptor`

```typescript
interface BuiltinBlockDescriptor {
  type: string
  category: BuiltinBlockCategory
}
```

### `BuiltinBlockCategory`

```typescript
type BuiltinBlockCategory =
  | 'logic' | 'math' | 'text' | 'lists' | 'colors'
  | 'variables' | 'procedures' | 'controls' | 'dicts'
```

---

## Block AST types

### `BlockAst`

```typescript
interface BlockAst {
  blocks: BlockNode[]   // top-level blocks only; linked via BlockNode.next
}
```

### `BlockNode`

```typescript
interface BlockNode {
  type: string
  id: string
  x?: number
  y?: number
  disabled?: boolean
  collapsed?: boolean
  fields: Record<string, string>
  values: Record<string, BlockNode>       // input sockets
  statements: Record<string, BlockNode>   // statement sockets
  mutation: Record<string, string>
  next: BlockNode | null                  // next block in sequence
}
```

---

## Diagnostic types

### `Diagnostic`

```typescript
interface Diagnostic {
  code: DiagnosticCode
  severity: DiagnosticSeverity
  path: string[]
  message: string
}
```

### `DiagnosticSeverity`

```typescript
type DiagnosticSeverity = 'error' | 'warning' | 'info'
```

### `DiagnosticCode`

```typescript
type DiagnosticCode =
  | 'MISSING_SCREEN_FILE'
  | 'UNRESOLVABLE_COMPONENT'
  | 'INVALID_PROPERTY'
  | 'DUPLICATE_COMPONENT_NAME'
  | 'ORPHANED_BLOCK'
  | 'VERSION_MISMATCH'
  | 'MISSING_ASSET_REF'
  | 'MALFORMED_SCM'
  | 'MALFORMED_BKY'
  | 'PLATFORM_INCOMPATIBLE_COMPONENT'
  | 'PLATFORM_INCOMPATIBLE_PROPERTY'
  | 'EXTENSION_BREAKING_CHANGE'
```

---

## Environment

Import from `aia-kit/environment`.

### `Environment`

```typescript
interface Environment {
  readonly componentRegistry: ComponentRegistry
  readonly builtinBlockRegistry: BuiltinBlockRegistry
  readonly meta: EnvironmentMeta
}
```

### `Platform`

```typescript
const Platform: {
  readonly MitAppInventor: 'mit-app-inventor'
  readonly KodularCreator: 'kodular-creator'
}
```

### `getEnvironmentFor(platform)`

```typescript
function getEnvironmentFor(platform: Platform): Promise<Environment>
```

Loads and memoizes a built-in platform environment.

### `createEnvironment(input)`

```typescript
function createEnvironment(input: CreateEnvironmentInput): Environment
```

Creates a custom environment from platform metadata, component descriptors, and optional built-in block descriptors.

---

## Pipeline functions

### `readAia(input)`

Import from `aia-kit/aia`.

```typescript
function readAia(input: Uint8Array | ArrayBuffer | Blob): Promise<AiaProject>
```

Reads and parses an AIA archive. No `Environment` required. Throws on invalid ZIP input, missing required archive entries, or malformed archive contents.

### `readAix(input)`

Import from `aia-kit/aix`.

```typescript
function readAix(input: Uint8Array | ArrayBuffer | Blob): Promise<AiaExtension>
```

Reads and parses an AIX extension archive. Throws on invalid ZIP input or missing required archive entries.

### `buildModel(project, environment)`

Import from `aia-kit/model`.

```typescript
function buildModel(project: AiaProject, environment: Environment): ModelProject
```

Pure function. Transforms a raw `AiaProject` into a `ModelProject` using the environment's component descriptors and the project's bundled extension descriptors. Emits diagnostics for unknown components and invalid properties.

### `writeAia(project)`

Import from `aia-kit/aia`.

```typescript
function writeAia(project: AiaProject, options?: { withYail?: false }): Promise<Blob>
function writeAia(model: ModelProject, options?: WriteAiaOptions): Promise<Blob>
```

Serialises a project back to an AIA ZIP. Accepts either a raw project or a model project.
When given a `ModelProject` and `{ withYail: true }`, missing YAIL is generated via `YailEmitter`.

### `parseProjectProperties(raw)`

Import from `aia-kit/project-properties`.

```typescript
function parseProjectProperties(raw: Record<string, string>): ProjectProperties
```

Parses a flat key-value map into a typed `ProjectProperties`.

### `serializeProjectProperties(props)`

```typescript
function serializeProjectProperties(props: ProjectProperties): string
```

Serialises a `ProjectProperties` back to a `key=value` string suitable for `project.properties`.

---

## BKY functions

Import from `aia-kit/bky`.

### `parseBky(bky)`

```typescript
function parseBky(bky: string): BlockAst
```

Parses a BKY XML string to a `BlockAst`.

### `serializeBky(ast)`

```typescript
function serializeBky(ast: BlockAst): string
```

Serialises a `BlockAst` back to BKY XML.

### `removeDisabledBlocks(ast)`

```typescript
function removeDisabledBlocks(ast: BlockAst): BlockAst
```

Returns a copy of the AST without disabled blocks.

### `renameComponentReferences(ast, fromName, toName)`

```typescript
function renameComponentReferences(ast: BlockAst, fromName: string, toName: string): BlockAst
```

Returns a copy of the AST with component name references renamed in block fields and mutations.

---

## SCM documents

Import from `aia-kit/scm`.

### `ScmDocument`

```typescript
class ScmDocument {
  readonly diagnostics: Diagnostic[]
  static parse(scm: string): ScmDocument
  readonly root: AiaComponent
  findComponentByUid(uid: string): AiaComponent | null
  getComponentsByType(type: string): AiaComponent[]
  addComponent(parentUid: string, component: AiaComponent): Diagnostic[]
  removeComponent(uid: string): Diagnostic[]
  serialize(): string
}
```

Parses SCM text, preserves wrapper metadata, exposes raw component-tree queries and edits, and serialises the result back to SCM text.

---

## Structural mutations

Import project-level mutations from `aia-kit/aia`.

All functions return `MutationResult` (`{ project: AiaProject, diagnostics: Diagnostic[] }`). The input is never mutated.

### Screens

| Function | Signature |
|----------|-----------|
| `addScreen` | `(project, screen: AiaScreen) → MutationResult` |
| `removeScreen` | `(project, name) → MutationResult` |
| `cloneScreen` | `(project, screenName, newName) → MutationResult` |
| `getScreen` | `(project, name) → AiaScreen \| null` |
| `replaceScreen` | `(project, screen) → MutationResult` |
| `replaceScreenScm` | `(project, screenName, scm) → MutationResult` |
| `replaceScreenBky` | `(project, screenName, bky) → MutationResult` |

### Assets

| Function | Signature |
|----------|-----------|
| `addAsset` | `(project, asset: AiaAsset) → MutationResult` |
| `removeAsset` | `(project, name) → MutationResult` |

### Extensions

| Function | Signature |
|----------|-----------|
| `addExtension` | `(project, ext: AiaExtension) → MutationResult` |
| `removeExtension` | `(project, packageName) → MutationResult` |

### Projects

| Function | Signature |
|----------|-----------|
| `mergeProjects` | `(target, source, options: MergeOptions) → MutationResult` |

---

## Analysis functions

Import from `aia-kit/analysis`.

### `diagnose(project, env)`

```typescript
function diagnose(project: AiaProject, env: Environment): Diagnostic[]
```

Builds a semantic model and validates BKY; returns all diagnostics.

### `diffProjects(a, b)`

```typescript
function diffProjects(a: AiaProject, b: AiaProject): ProjectDiff
```

```typescript
interface ProjectDiff {
  screensOnlyInA: string[]
  screensOnlyInB: string[]
  screensDiffering: Array<{ name: string; scm: boolean; bky: boolean }>
  assetsOnlyInA: string[]
  assetsOnlyInB: string[]
  assetsDiffering: string[]
  extensionsOnlyInA: string[]
  extensionsOnlyInB: string[]
}
```

### `findUnusedAssets(model)`

```typescript
function findUnusedAssets(model: ModelProject): AiaAsset[]
```

Returns assets not referenced by any component property or block.

### `findUnusedExtensions(model)`

```typescript
function findUnusedExtensions(model: ModelProject): AiaExtension[]
```

Returns extension records not used by any component in any screen.

### `findAssetReferences(model)`

```typescript
function findAssetReferences(model: ModelProject): AssetReference[]
```

```typescript
interface AssetReference {
  assetName: string
  kind: AssetReferenceKind   // 'property' | 'block_xml'
  path: string[]
}
```

### `analyzeVariables(ast)`

```typescript
function analyzeVariables(ast: BlockAst): VariableReport
```

```typescript
interface VariableReport {
  declared: string[]     // from declaration blocks
  referenced: string[]   // from lexical get/set blocks
}
```

### `exportBlockSummary(ast)`

```typescript
function exportBlockSummary(ast: BlockAst): BlockSummary
```

```typescript
interface BlockSummary {
  topLevelCount: number
  totalBlocks: number
  blocksByType: Record<string, number>
}
```

### `analyzeComplexity(model)`

```typescript
function analyzeComplexity(model: ModelProject): ComplexityReport
```

```typescript
interface ComplexityReport {
  screens: ScreenComplexity[]
}

interface ScreenComplexity {
  screenName: string
  topLevelBlocks: number
  totalBlocks: number
  maxDepth: number
}
```

### `findDeadBlocks(model)`

```typescript
function findDeadBlocks(model: ModelProject): DeadBlock[]
```

```typescript
interface DeadBlock {
  screenName: string
  blockId: string
  blockType: string
}
```

Returns top-level blocks that are disabled or otherwise unreachable.

### `buildNavGraph(model)`

```typescript
function buildNavGraph(model: ModelProject): NavGraph
```

```typescript
interface NavGraph {
  nodes: string[]    // screen names
  edges: NavEdge[]
}

interface NavEdge {
  from: string
  to: string
}
```

Builds a navigation graph from `open_another_screen` blocks.

---

## YAIL generation

Import from `aia-kit/yail`.

### `YailEmitter`

```typescript
class YailEmitter {
  static for(model: ModelProject): YailEmitter
  emit(screen: ModelScreen): string
  emitScreen(screenName: string): string
}
```

Emits per-screen YAIL for a model project. The package prefix is derived from `model.source.properties.main`. Calling `writeAia(model, { withYail: true })` uses `YailEmitter` for any screen whose `yail` is null.
