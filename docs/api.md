# aia-kit API reference

All exports are from the `aia-kit` package. For a guided walkthrough see [usage.md](usage.md).

---

## Raw data types

These types faithfully represent the AIA/AIX file format. They are what `parseAia` / `parseAix` return and what `writeAia` consumes.

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
  loadClasses(): Promise<Uint8Array>
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

Produced by `resolve()`. The model layer enriches raw data with component descriptors from the `Environment`.

### `ModelProject`

```typescript
interface ModelProject {
  readonly _tag: 'ModelProject'
  source: AiaProject       // the underlying raw project
  environment: Environment
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
interface ComponentRegistry {
  readonly descriptors: ReadonlyArray<ComponentDescriptor>
  lookup(typeName: string): ComponentDescriptor | null
  extend(descriptors: ComponentDescriptor[]): ComponentRegistry
}
```

### `BlockRegistry`

Holds built-in Blockly block metadata. Accessible via `Environment.blockRegistry`.

```typescript
interface BlockRegistry {
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

## Error types

All extend `AiaKitError`.

| Class | Thrown when |
|-------|-------------|
| `AiaKitError` | Base class for all aia-kit errors |
| `AiaZipError` | Input is not a valid ZIP archive |
| `AiaStructureError` | Valid ZIP but missing required AIA entries |
| `AiaParseError` | Malformed SCM or BKY content inside the archive |
| `AiaWriteError` | Failure during ZIP assembly in `writeAia` |

---

## Environment

### `Environment`

```typescript
class Environment {
  readonly componentRegistry: ComponentRegistry
  readonly blockRegistry: BlockRegistry

  lookup(typeName: string): ComponentDescriptor | null

  withExtension(ext: AiaExtension): Environment
  withExtensions(exts: AiaExtension[]): Environment

  static kodularCreator(): Promise<Environment>
  static mitAppInventor(): Promise<Environment>
}
```

---

## Pipeline functions

### `parseAia(input)`

```typescript
function parseAia(input: Uint8Array | ArrayBuffer | Blob): Promise<AiaProject>
```

Reads and parses an AIA archive. No `Environment` required.  
Throws `AiaZipError` | `AiaStructureError` | `AiaParseError`.

### `parseAix(input)`

```typescript
function parseAix(input: Uint8Array | ArrayBuffer | Blob): Promise<AiaExtension>
```

Reads and parses an AIX extension archive.  
Throws `AiaZipError` | `AiaStructureError`.

### `resolve(project, env)`

```typescript
function resolve(project: AiaProject, env: Environment): ModelProject
```

Pure function. Transforms a raw `AiaProject` into a `ModelProject` using the environment's component descriptors. Emits diagnostics for unknown components and invalid properties.

### `parseAndResolve(input, env)`

```typescript
function parseAndResolve(
  input: Uint8Array | ArrayBuffer | Blob,
  env: Environment
): Promise<ModelProject>
```

Convenience: `parseAia` + `resolve` in one call.

### `writeAia(project)`

```typescript
function writeAia(project: AiaProject | ModelProject): Promise<Blob>
```

Serialises a project back to an AIA ZIP. Accepts either a raw or resolved project.  
When given a `ModelProject` with screens whose `yail` is null, YAIL is generated automatically via `createYailGenerator`.

### `parseProjectProperties(raw)`

```typescript
function parseProjectProperties(raw: Record<string, string>): ProjectProperties
```

Parses a flat key-value map (as returned by the `properties-file` library) into a typed `ProjectProperties`.

### `serializeProperties(props)`

```typescript
function serializeProperties(props: ProjectProperties): string
```

Serialises a `ProjectProperties` back to a `key=value` string suitable for `project.properties`.

---

## Block lens

### `parseBlocks(bky)`

```typescript
function parseBlocks(bky: string): BlockAst
```

Parses a BKY XML string to a `BlockAst`.

### `serializeBlocks(ast)`

```typescript
function serializeBlocks(ast: BlockAst): string
```

Serialises a `BlockAst` back to BKY XML.

### `queryBlocks(screen, query)`

```typescript
function queryBlocks<T>(
  screen: AiaScreen | ModelScreen,
  query: (ast: BlockAst) => T
): T
```

Parses the screen's BKY and runs `query` over the AST. Returns whatever `query` returns.

### `updateBlocks(project, screenName, astOrUpdater)`

```typescript
function updateBlocks(
  project: AiaProject,
  screenName: string,
  astOrUpdater: BlockAst | ((ast: BlockAst) => BlockAst)
): { project: AiaProject; diagnostics: Diagnostic[] }
```

Applies an AST updater (or a pre-built `BlockAst`) to a named screen. Emits `MISSING_SCREEN_FILE` if the screen is not found.

### `updateAllScreenBlocks(project, updater)`

```typescript
function updateAllScreenBlocks(
  project: AiaProject,
  updater: (ast: BlockAst, screenName: string) => BlockAst
): { project: AiaProject; diagnostics: Diagnostic[] }
```

Applies the updater to every screen in the project.

---

## Component tree utilities

All functions operate on `ModelComponent` (resolved). Use `project.screens[n].form` as the root.

### `findComponent(root, uid)`

```typescript
function findComponent(root: ModelComponent, uid: string): ModelComponent | null
```

Depth-first search for a component by UID.

### `getComponentsByType(root, type)`

```typescript
function getComponentsByType(root: ModelComponent, type: string): ModelComponent[]
```

Returns all components (including root) whose `type` matches.

### `getParent(root, target)`

```typescript
function getParent(root: ModelComponent, target: ModelComponent): ModelComponent | null
```

Returns the direct parent of `target`, or null if `target` is the root.

### `getComponentPath(root, uid)`

```typescript
function getComponentPath(root: ModelComponent, uid: string): ModelComponent[]
```

Returns the path from root to the component with the given UID, inclusive. Returns `[]` if not found.

---

## Structural mutations

All functions return `MutationResult` (`{ project: AiaProject, diagnostics: Diagnostic[] }`). The input is never mutated.

### Screens

| Function | Signature |
|----------|-----------|
| `addScreen` | `(project, name) → MutationResult` |
| `removeScreen` | `(project, name) → MutationResult` |
| `cloneScreen` | `(project, sourceName, newName) → MutationResult` |

### Components

| Function | Signature |
|----------|-----------|
| `addComponent` | `(project, screenName, parentName, component: AiaComponent) → MutationResult` |
| `removeComponent` | `(project, screenName, componentName) → MutationResult` |
| `updatePropertyWhere` | `(project, predicate, propertyName, value) → MutationResult` |

### Assets

| Function | Signature |
|----------|-----------|
| `addAsset` | `(project, data: Blob, name) → Promise<MutationResult>` |
| `removeAsset` | `(project, name) → MutationResult` |

### Extensions

| Function | Signature |
|----------|-----------|
| `addExtension` | `(project, ext: AiaExtension) → MutationResult` |
| `removeExtension` | `(project, packageName) → MutationResult` |

### `mergeProjects(target, source, options)`

```typescript
function mergeProjects(
  target: AiaProject,
  source: AiaProject,
  options: MergeOptions
): MutationResult
```

```typescript
interface MergeOptions {
  screenConflict: 'skip' | 'overwrite' | 'rename'
  assetConflict: 'skip' | 'overwrite'
  includeExtensions: boolean
}
```

Merges screens, assets, and (optionally) extensions from `source` into `target`. `'rename'` appends `_2`, `_3`, etc. to resolve screen name conflicts.

---

## Analysis functions

### `diagnose(project, env)`

```typescript
function diagnose(project: AiaProject, env: Environment): Diagnostic[]
```

Runs resolve and BKY parse validation; returns all diagnostics.

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

### `findUnusedAssets(project)`

```typescript
function findUnusedAssets(project: AiaProject): string[]
```

Returns asset names not referenced by any component property or block.

### `findUnusedExtensions(project)`

```typescript
function findUnusedExtensions(project: AiaProject): string[]
```

Returns extension package names not used by any component in any screen.

### `findAssetReferences(project)`

```typescript
function findAssetReferences(project: AiaProject): AssetReference[]
```

```typescript
interface AssetReference {
  assetName: string
  kind: AssetReferenceKind   // 'property' | 'block_xml'
  path: string[]
}
```

### `analyzeVariables(project)`

```typescript
function analyzeVariables(project: AiaProject): VariableReport
```

```typescript
interface VariableReport {
  declared: string[]     // from declaration blocks
  referenced: string[]   // from lexical get/set blocks
}
```

### `exportBlockSummary(project)`

```typescript
function exportBlockSummary(project: AiaProject): BlockSummary
```

```typescript
interface BlockSummary {
  topLevelCount: number
  totalBlocks: number
  blocksByType: Record<string, number>
}
```

### `analyzeComplexity(project)`

```typescript
function analyzeComplexity(project: AiaProject): ComplexityReport
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

### `findDeadBlocks(project)`

```typescript
function findDeadBlocks(project: AiaProject): DeadBlock[]
```

```typescript
interface DeadBlock {
  screenName: string
  blockId: string
  blockType: string
}
```

Returns top-level blocks that are disabled or otherwise unreachable.

### `buildNavGraph(project)`

```typescript
function buildNavGraph(project: AiaProject): NavGraph
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

### `createYailGenerator(model)`

```typescript
function createYailGenerator(model: ModelProject): (screen: ModelScreen) => string
```

Returns a per-screen YAIL emitter. The package prefix is derived from `model.source.properties.main`. Calling `writeAia` with a `ModelProject` invokes this automatically for any screen whose `yail` is null.

---

## Diagnostics utility

### `mergeReports(...reports)`

```typescript
function mergeReports(...reports: Diagnostic[][]): Diagnostic[]
```

Flattens multiple `Diagnostic[]` arrays into one.
