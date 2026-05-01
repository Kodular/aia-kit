# aia-kit v2 — Design Spec

**Date:** 2026-05-01
**Status:** Draft

---

## Context

aia-kit is a TypeScript library for reading, parsing, editing, and writing AIA/AIX/AIS files — the project format used by App Inventor-based platforms (MIT App Inventor, Kodular Creator). v2 is a clean rewrite with a new API design, motivated by architectural problems in v1: behaviour buried in data classes, no separation between raw and enriched representations, no consistent mutation model, no first-class block manipulation API.

---

## Guiding Principles

- Plain immutable data types and pure functions. Classes only for genuinely stateful abstractions (`Environment`, `BkyParser`, `ScmParser`).
- Every function takes the minimum it needs. Structural operations take raw types. Platform-aware operations take model types or explicit `Environment`.
- Every mutation returns the same `MutationResult` envelope.
- Every diagnostic uses the same `Diagnostic` vocabulary.
- The pipeline is independently enterable at any stage.
- No throws for data-level problems — use `Diagnostic[]`. Throws only for hard IO failures.

---

## Naming Scheme

Two layers, two prefixes:

| Layer | Prefix | Meaning |
|---|---|---|
| Raw | `Aia*` / `Aix*` | Faithful file-format representation |
| Model | `Model*` | Environment-enriched object model |

---

## Core Data Types

### Raw Layer

```ts
interface AiaProject {
  readonly _tag: 'AiaProject'
  name: string
  properties: Record<string, string>
  screens: AiaScreen[]
  assets: AiaAsset[]
  extensions: AiaExtension[]
}

interface AiaScreen {
  name: string
  scm: string        // raw SCM JSON string, preserved exactly
  bky: string        // raw BKY XML string, preserved exactly
  yail: string | null
}

interface AiaAsset {
  name: string
  type: string
  sizeBytes: number
  data(): Promise<Uint8Array>   // lazy, no caching
}

interface AiaExtension {
  packageName: string
  version: number
  aix: AixProject    // parsed eagerly during parseAia() — small metadata, needed for resolve()
}

interface AixProject {
  packageName: string
  version: number
  minSdk: number
  components: ComponentDescriptor[]
  assets: AixAsset[]
  manifest: AixManifest
}

// Parsed SCM component — raw layer, no descriptors attached
interface AiaComponent {
  name: string
  type: string
  uid: string
  properties: Record<string, string>   // raw string values, unvalidated
  children: AiaComponent[]
}
```

### Model Layer

```ts
interface ModelProject {
  readonly _tag: 'ModelProject'
  source: AiaProject
  environment: Environment
  screens: ModelScreen[]
  diagnostics: Diagnostic[]
}

interface ModelScreen {
  source: AiaScreen
  name: string
  form: ModelComponent
}

interface ModelComponent {
  name: string
  type: string
  uid: string
  descriptor: ComponentDescriptor
  properties: ComponentProperty[]
  children: ModelComponent[]
  // No parent ref — circular refs break serialisation.
  // Use getParent(root, target) or getComponentPath(root, uid) instead.
}
```

---

## Diagnostics

```ts
type DiagnosticSeverity = 'error' | 'warning' | 'info'

interface Diagnostic {
  code: DiagnosticCode
  severity: DiagnosticSeverity
  path: string[]       // e.g. ['screens', 'Screen1', 'Button1', 'BackgroundColor']
  message: string
}

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

`mergeReports` is a first-class export:

```ts
const mergeReports = (...reports: Diagnostic[][]): Diagnostic[] => reports.flat()
```

---

## Error Types

Used only for hard IO failures — not for data-level problems (those go in `Diagnostic[]`).

```ts
class AiaKitError extends Error {}
class AiaParseError extends AiaKitError { cause: unknown }
class AiaZipError extends AiaParseError {}       // unreadable archive
class AiaStructureError extends AiaParseError {} // valid ZIP, missing required AIA entries
class AiaWriteError extends AiaKitError {}
```

---

## Mutation Result

```ts
interface MutationResult {
  project: AiaProject
  diagnostics: Diagnostic[]   // only codes relevant to that specific mutation
}
```

All mutations return `AiaProject` — caller re-resolves once at the end of a chain if a `ModelProject` is needed. Mutations are environment-independent unless they explicitly require an `Environment` parameter.

---

## Pipeline API

### Parse and write

```ts
// Throws AiaZipError | AiaStructureError on hard failure
parseAia(input: Uint8Array | Blob): Promise<AiaProject>
parseAix(input: Uint8Array | Blob): Promise<AixProject>

// Convenience — parse + resolve in one step
parseAndResolve(input: Uint8Array | Blob, env: Environment): Promise<ModelProject>

// Throws AiaWriteError on hard failure
// Accepts either layer — uses .source internally for ModelProject
writeAia(project: AiaProject | ModelProject): Promise<Blob>
```

`parseAia` does not own path/URL resolution. Callers handle that:

```ts
// Node.js
const bytes = await readFile('project.aia')
const raw = await parseAia(bytes)

// Browser File input
const raw = await parseAia(file)  // File extends Blob

// URL
const raw = await parseAia(await fetch(url).then(r => r.blob()))
```

### Resolve

```ts
// Sync, pure, never throws. Populates diagnostics for partial failures.
resolve(project: AiaProject, env: Environment): ModelProject
```

`resolve` never throws — it resolves what it can and records what it cannot in `diagnostics`. A partially corrupt project still produces a usable `ModelProject`.

---

## Environment

```ts
class Environment {
  static kodularCreator(): Promise<Environment>
  static mitAppInventor(): Promise<Environment>

  lookup(typeName: string): ComponentDescriptor | null
  withExtension(aix: AixProject): Environment
  withExtensions(axies: AixProject[]): Environment
}
```

Environment JSON files live at `environments/kodular-creator.json` and `environments/mit-app-inventor.json`. Loaded lazily via dynamic import. `withExtension` returns a new `Environment` — non-destructive.

---

## Block Lens

Blocks are accessed and mutated via a functional lens — the BKY XML string is parsed and serialised internally. `BkyParser` is an implementation detail, not part of the public API.

```ts
// Read-only query — works on raw or model screens
queryBlocks<T>(
  screen: AiaScreen | ModelScreen,
  query: (ast: BlockAST) => T
): T

// Single-screen mutation
updateBlocks(
  project: AiaProject,
  screenName: string,
  updater: (ast: BlockAST) => BlockAST
): MutationResult

// All-screens mutation — updater receives screen name for context
updateAllScreenBlocks(
  project: AiaProject,
  updater: (ast: BlockAST, screenName: string) => BlockAST
): MutationResult
```

The block lens requires no `Environment` — blocks are environment-agnostic at the access layer.

---

## Component Tree Utilities

No `parent` reference on `ModelComponent` — avoids circular references that break serialisation.

```ts
// Upward traversal
getParent(root: ModelComponent, target: ModelComponent): ModelComponent | null
getComponentPath(root: ModelComponent, uid: string): ModelComponent[]

// Common queries
getComponentsByType(root: ModelComponent, type: string): ModelComponent[]
findComponent(root: ModelComponent, uid: string): ModelComponent | null
```

---

## YAIL Generation

```ts
// Factory closes over all context (env, package name, component trees)
createYailGenerator(model: ModelProject): (screen: ModelScreen) => string
```

Internally composes both dimensions:
- Component dimension: `screen.form` (from `ModelProject`)
- Block dimension: `queryBlocks(screen.source, ast => ast)` (via block lens)

Callers see a single clean function.

---

## Structural Mutations

All take `AiaProject`, return `MutationResult`. No `Environment` needed.

```ts
addScreen(project: AiaProject, screen: AiaScreen): MutationResult
removeScreen(project: AiaProject, screenName: string): MutationResult
cloneScreen(project: AiaProject, screenName: string, newName: string): MutationResult

addComponent(project: AiaProject, screenName: string, component: AiaComponent, parentUid: string): MutationResult
removeComponent(project: AiaProject, screenName: string, uid: string): MutationResult

addAsset(project: AiaProject, asset: AiaAsset): MutationResult
removeAsset(project: AiaProject, assetName: string): MutationResult

addExtension(project: AiaProject, aix: AixProject): MutationResult
removeExtension(project: AiaProject, packageName: string): MutationResult

updatePropertyWhere(
  project: AiaProject,
  predicate: (component: AiaComponent) => boolean,
  property: string,
  value: string
): MutationResult

mergeProjects(
  target: AiaProject,
  source: AiaProject,
  options: MergeOptions
): MutationResult

applyScreenTemplate(project: AiaProject, template: ScreenTemplate, screenName: string): MutationResult

// Block-level mutations go through the block lens
updateBlocks(project, screenName, updater): MutationResult
updateAllScreenBlocks(project, updater): MutationResult
```

---

## Platform-Aware Mutations

These require `Environment` because they need descriptor knowledge.

```ts
migrateComponent(
  project: AiaProject,
  screenName: string,
  uid: string,
  targetType: string,
  env: Environment
): MutationResult

// Platform migration — check is implicit, diagnostics carry compatibility report
migrateToEnvironment(
  project: AiaProject,
  sourceEnv: Environment,
  targetEnv: Environment,
  options?: MigrationOptions
): MutationResult
```

No separate `checkPlatformCompatibility` function — the migration result's `diagnostics` carry the full compatibility report. Callers inspect diagnostics before using the new project.

---

## Extension Migration

```ts
// Plan — takes only the two descriptors, not full environments
// Returns a plain data type the caller can spread-and-override
planExtensionMigration(
  source: ComponentDescriptor,
  target: ComponentDescriptor
): ExtensionMigrationPlan

interface ExtensionMigrationPlan {
  source: ComponentDescriptor
  target: ComponentDescriptor
  componentMapping: Record<string, string>
  propertyMapping: Record<string, string>
  droppedProperties: string[]
  newRequiredProperties: ComponentPropertyDescriptor[]
}

// Apply — takes the plan (potentially customised by caller)
migrateExtension(
  project: AiaProject,
  plan: ExtensionMigrationPlan
): MutationResult

// Version upgrade within same package
diffAixVersions(old: AixProject, next: AixProject): AixVersionDiff
upgradeExtension(
  project: AiaProject,
  old: AixProject,
  next: AixProject,
  overrides?: Partial<ExtensionMigrationPlan>
): MutationResult
```

---

## Analysis Functions

### Raw layer (no environment needed)

```ts
// Structural diff — takes AiaProject, not ModelProject
diffProjects(a: AiaProject, b: AiaProject): ProjectDiff

// Read operations — return data, not MutationResult
extractScreenTemplate(project: AiaProject, screenName: string): ScreenTemplate
```

### Component dimension (requires `ModelProject`)

```ts
diagnose(project: AiaProject, env: Environment): Diagnostic[]
findUnusedExtensions(model: ModelProject): AiaExtension[]
findUnusedAssets(model: ModelProject): AiaAsset[]
findAssetReferences(model: ModelProject): AssetReference[]
inferPermissions(model: ModelProject): PermissionReport
checkSdkCompatibility(model: ModelProject, targetSdk: number): Diagnostic[]
auditAccessibility(model: ModelProject): Diagnostic[]
checkNamingConventions(model: ModelProject, rules: NamingRules): Diagnostic[]
```

### Block dimension (requires `BlockAST` via lens)

```ts
// Used inside queryBlocks()
analyzeVariables(ast: BlockAST): VariableReport
exportBlockSummary(ast: BlockAST): BlockSummary
```

### Cross-cutting (requires `ModelProject` — uses both dimensions internally)

```ts
analyzeComplexity(model: ModelProject): ComplexityReport
findDeadBlocks(model: ModelProject): DeadBlock[]
buildNavGraph(model: ModelProject): NavGraph
```

---

## Export and Interop

```ts
toMermaid(graph: NavGraph): string
componentTreeToMermaid(screen: ModelScreen): string
exportComponentInventory(model: ModelProject): ComponentInventory
projectToJson(project: AiaProject): string
projectFromJson(json: string): AiaProject
```

---

## Abstract Dependency Graph

```
Uint8Array | Blob
    │
    ├──► parseAia ──────────────────────► AiaProject
    │                                         │
    └──► parseAix ──► AixProject              ├── structural mutations → MutationResult
                          │                   ├── updateBlocks (block lens)
                          ▼                   ├── writeAia → Blob
                     Environment              │
                          │                   ▼
                          └──────────► resolve() ──────────► ModelProject
                                                                  │
                                              ┌───────────────────┼─────────────────┐
                                              ▼                   ▼                 ▼
                                       component-only       cross-cutting        writeAia
                                        analysis            (YAIL, nav,
                                       (permissions,        complexity,
                                        sdk compat,         dead blocks)
                                        accessibility)          │
                                                          uses block lens
                                                          on model.screens[i].source
```

No cycles. Every arrow is forward: bytes → raw → model → analysis/output.

---

## Package Structure

One npm package, subpath exports:

```
aia-kit/
├── environments/
│   ├── kodular-creator.json
│   └── mit-app-inventor.json
├── src/
│   ├── index.ts          — re-exports everything
│   ├── parse.ts
│   ├── resolve.ts
│   ├── write.ts
│   ├── yail.ts
│   ├── mutations/
│   ├── analysis/
│   ├── migration/
│   ├── blocks/           — block lens, BlockAST, BkyParser (internal)
│   ├── components/       — ScmParser (internal), component tree utilities
│   └── core/             — shared types, Environment, Diagnostic
└── package.json
```

```json
{
  "exports": {
    ".":           "./dist/index.js",
    "./parse":     "./dist/parse.js",
    "./resolve":   "./dist/resolve.js",
    "./write":     "./dist/write.js",
    "./yail":      "./dist/yail.js",
    "./mutations": "./dist/mutations/index.js",
    "./analysis":  "./dist/analysis/index.js",
    "./migration": "./dist/migration/index.js"
  }
}
```

Types live with the code they describe. No dedicated `types/` folder. Shared contracts live in `core/`.

---

## Implementation Milestones

### Milestone 1 — Core Pipeline

- `AiaProject`, `AixProject`, `ModelProject`, `ModelScreen`, `ModelComponent` types
- `parseAia`, `parseAix`, `parseAndResolve`, `resolve`, `writeAia`
- `Diagnostic[]` system + `DiagnosticCode` union
- Error hierarchy (`AiaParseError`, `AiaZipError`, `AiaStructureError`, `AiaWriteError`)
- `Environment` class with lazy-loaded JSON, `withExtension`
- `BkyParser`, `ScmParser` (internal)
- Block lens: `queryBlocks`, `updateBlocks`, `updateAllScreenBlocks`
- Component tree utilities: `getParent`, `getComponentPath`, `getComponentsByType`, `findComponent`
- Round-trip correctness tests

### Milestone 2 — Mutations and Analysis

- All structural mutations
- Core analysis: `diagnose`, `findUnusedExtensions`, `findUnusedAssets`, `diffProjects`
- Block analysis helpers: `analyzeVariables`, `exportBlockSummary`
- Cross-cutting analysis: `analyzeComplexity`, `findDeadBlocks`, `buildNavGraph`
- `createYailGenerator`
- `mergeReports`

### Milestone 3 — Migration and Export

- `migrateToEnvironment`
- `planExtensionMigration`, `migrateExtension`, `diffAixVersions`, `upgradeExtension`
- `migrateComponent`
- Advanced analysis: `inferPermissions`, `checkSdkCompatibility`, `auditAccessibility`, `checkNamingConventions`
- Export/interop: `toMermaid`, `componentTreeToMermaid`, `exportComponentInventory`, `projectToJson`, `projectFromJson`
- Screen templates: `applyScreenTemplate`, `extractScreenTemplate`
