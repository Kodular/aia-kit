# aia-kit v2 — Composable API Design Spec

**Date:** 2026-05-03  
**Status:** Adopted — this document is the normative v2 composable public API contract for `aia-kit`.

---

## Context

`aia-kit` is a TypeScript toolkit for reading, inspecting, editing, analysing, and writing App Inventor-family project formats: AIA, AIS, AIX, SCM, BKY, YAIL, project properties, and component descriptor registries.

The previous v2 draft established the right domain split between raw data and semantic model space, but its public surface was still shaped around a broad root API and a generic `resolve()` step. This spec refines the design toward smaller domain modules, explicit bounded contexts, and composable APIs that let users work with one slice of the App Inventor ecosystem or the whole archive pipeline.

The core design goal is:

> `aia-kit` should be a toolkit, not a framework. Every high-level convenience operation must be reproducible by composing lower-level domain modules.

---

## Design Principles

1. **Domain boundaries first.** Public modules should follow format and domain boundaries: AIA, AIX, SCM, BKY, YAIL, project properties, environment, model, and analysis. Cross-cutting diagnostic types (`Diagnostic`, codes, `mergeReports`) live in core and are exported from the small root `aia-kit` entry rather than a dedicated subpath.
2. **AIA data is archive truth.** `AiaProject` represents the persisted project contents. It is the data space.
3. **Model space is derived.** `ModelProject` is an environment-enriched semantic projection of `AiaProject`. It is built, not mutated independently.
4. **No god object.** Avoid a large behavior-heavy `AiaProject` class. Core APIs should stay lean and composable.
5. **No hidden environment.** Platform context is always passed explicitly to model-building and platform-aware operations.
6. **Extensions belong to projects.** Extensions are installed project capabilities, not changes to the base platform environment.
7. **Convenience layers are optional.** Higher-level project operations and analysis helpers accelerate common workflows but must not be required for custom workflows.
8. **Plain data at boundaries.** Public functions should accept and return stable data structures unless a narrow local document abstraction provides clear value.
9. **Explicit derived output.** YAIL and model data are derived from SCM/BKY/project/environment state. APIs must make invalidation and regeneration deliberate.
10. **Tree-shakeable subpaths.** Users should be able to import `aia-kit/scm` without pulling ZIP, YAIL, environment loading, or analysis code.

---

## Package Surface

The import path should make the API boundary visible. The canonical API is organized by domain subpaths, not by a broad root barrel.

```ts
import { readAia, writeAia } from 'aia-kit/aia'
import { ScmDocument } from 'aia-kit/scm'
import { parseBky, serializeBky } from 'aia-kit/bky'
import { buildModel } from 'aia-kit/model'
import { getEnvironmentFor, Platform } from 'aia-kit/environment'
```

Recommended subpaths:

```txt
aia-kit/aia
aia-kit/aix
aia-kit/ais
aia-kit/scm
aia-kit/bky
aia-kit/yail
aia-kit/model
aia-kit/environment
aia-kit/project-properties
aia-kit/component-descriptor
aia-kit/analysis
```

The root `aia-kit` export should either be absent or intentionally small. It must not become the primary import path for every stable API. Barrel exports are acceptable inside subpaths such as `aia-kit/aia` or `aia-kit/scm` because those barrels preserve the domain boundary.

`blocks` is not a top-level module in this design. BKY is the file-format boundary that owns Blockly XML parsing, serialisation, AST types, and block-level helpers.

---

## Core Pipeline

```ts
import { readAia, writeAia } from 'aia-kit/aia'
import { getEnvironmentFor, Platform } from 'aia-kit/environment'
import { buildModel } from 'aia-kit/model'

const project = await readAia(blob)
const environment = await getEnvironmentFor(Platform.KodularCreator)
const model = buildModel(project, environment)

const out = await writeAia(project)
```

The conceptual pipeline is:

```txt
bytes/blob
  -> AiaProject
  -> buildModel(AiaProject, Environment)
  -> ModelProject
```

`buildModel` replaces the previous `resolve` name. It better communicates that the function constructs a semantic model from project data and platform context.

---

## Data Space

The data space contains file-format-faithful structures.

```ts
export interface AiaProject {
  readonly _tag: 'AiaProject'
  name: string
  properties: ProjectProperties
  screens: AiaScreen[]
  assets: AiaAsset[]
  extensions: AiaExtension[]
}

export interface AiaScreen {
  name: string
  scm: string
  bky: string
  yail: string | null
}

export interface AiaComponent {
  name: string
  type: string
  uid: string
  properties: Record<string, string>
  children: AiaComponent[]
}

export interface AiaAsset {
  name: string
  type: string
  sizeBytes: number
  data(): Promise<Uint8Array>
}

export interface AiaExtension {
  packageName: string
  version: number
  minSdk: number
  components: ComponentDescriptor[]
  manifest: AixManifest
  loadClassesJar(): Promise<Uint8Array>
  loadAssets(): Promise<AixAsset[]>
}
```

`AiaProject` is the archive truth. SCM and BKY strings are preserved unless the caller explicitly edits them through SCM/BKY/mutation APIs. YAIL is treated as optional derived output.

Several deeper domain types are intentionally left implementation-defined in this spec. Their names establish API boundaries, but their exact shape should be designed close to implementation:

```ts
ProjectProperties
ComponentDescriptor
BuiltinBlockDescriptor
BuiltinBlockRegistry
ComponentProperty
BlockAst
AixManifest
AixAsset
Diagnostic
NavGraph
ProjectDiff
AssetReference
ComplexityReport
```

---

## Model Space

The model space is the semantic projection of project data through a base platform environment and the project's installed extensions.

```ts
export interface ModelProject {
  readonly _tag: 'ModelProject'
  readonly source: AiaProject
  readonly environment: Environment

  /**
   * Effective component registry for this project:
   * environment built-ins + project-installed extension descriptors.
   */
  readonly componentRegistry: ComponentRegistry

  readonly builtinBlockRegistry: BuiltinBlockRegistry
  readonly screens: ModelScreen[]
  readonly diagnostics: Diagnostic[]
}

export interface ModelScreen {
  readonly source: AiaScreen
  readonly name: string
  readonly form: ModelComponent
}

export interface ModelComponent {
  readonly name: string
  readonly type: string
  readonly uid: string
  readonly descriptor: ComponentDescriptor
  readonly properties: ComponentProperty[]
  readonly children: ModelComponent[]
}
```

Model objects are snapshots. If the underlying `AiaProject` is changed, callers build a new model.

```ts
const model = buildModel(project, env)
const nextProject = addComponent(project, 'Screen1', component, parentUid).project
const nextModel = buildModel(nextProject, env)
```

No live updating model views. No hidden mutation through `ModelComponent`.

---

## Environment

`Environment` represents the base platform: MIT App Inventor, Kodular Creator, or a custom compatible platform.

```ts
export interface Environment {
  readonly componentRegistry: ComponentRegistry
  readonly builtinBlockRegistry: BuiltinBlockRegistry
  readonly meta: EnvironmentMeta
}

export interface EnvironmentMeta {
  readonly id: Platform | string
  readonly name: string
  readonly version?: string
  readonly website?: string
  readonly source?: string
}
```

There is no `Environment.config` until a concrete use case exists.

Built-in platforms:

```ts
export const Platform = {
  MitAppInventor: 'mit-app-inventor',
  KodularCreator: 'kodular-creator',
} as const

export type Platform = typeof Platform[keyof typeof Platform]
```

Environment loading:

```ts
export function getEnvironmentFor(platform: Platform): Promise<Environment>
```

`getEnvironmentFor` is lazy-loaded and memoized.

Custom construction:

```ts
export function createEnvironment(input: {
  meta: EnvironmentMeta
  components: ComponentDescriptor[]
  builtinBlocks?: BuiltinBlockDescriptor[]
}): Environment
```

`createEnvironment` validates the input and throws for invalid construction. Data-level project problems still surface as diagnostics during `buildModel` or analysis.

---

## Extensions

Extensions do not extend `Environment`.

The correct boundary is:

```txt
Environment = base platform capabilities
AiaProject = archive data, including installed extensions
ModelProject = AiaProject interpreted through Environment + installed extensions
```

`buildModel(project, environment)` constructs the effective component registry:

```ts
const registry = environment.componentRegistry.toMutable()

for (const extension of project.extensions) {
  registry.add(extension.components)
}

const effectiveComponentRegistry = registry.snapshot()
```

That effective registry is exposed on `ModelProject`, not written back to `Environment`.

This removes the misleading mental model of `env.withExtension(...)`. Extensions are project-installed capabilities, even when their runtime compatibility is based on MIT App Inventor conventions.

---

## Domain Modules

### `aia-kit/aia`

Archive-level operations.

```ts
readAia(input: Uint8Array | ArrayBuffer | Blob): Promise<AiaProject>
writeAia(project: AiaProject, options?: { withYail?: false }): Promise<Blob>
writeAia(model: ModelProject, options?: WriteAiaOptions): Promise<Blob>

interface WriteAiaOptions {
  /**
   * When true, generate and embed standard App Inventor-compatible YAIL files.
   * Requires a ModelProject input so generation can use the effective component
   * registry built from the base platform plus project-installed extensions.
   */
  withYail?: boolean
}

interface MutationResult {
  readonly project: AiaProject
  readonly diagnostics: Diagnostic[]
}

getScreen(project: AiaProject, name: string): AiaScreen | null
replaceScreen(project: AiaProject, screen: AiaScreen): MutationResult
replaceScreenScm(project: AiaProject, screenName: string, scm: string): MutationResult
replaceScreenBky(project: AiaProject, screenName: string, bky: string): MutationResult

addScreen(project: AiaProject, screen: AiaScreen): MutationResult
removeScreen(project: AiaProject, screenName: string): MutationResult
addAsset(project: AiaProject, asset: AiaAsset): MutationResult
removeAsset(project: AiaProject, assetName: string): MutationResult
addExtension(project: AiaProject, extension: AiaExtension): MutationResult
removeExtension(project: AiaProject, packageName: string): MutationResult
```

`writeAia` writes archive truth. YAIL generation is controlled by domain intent, not a caller-provided callback. When `withYail` is true, the writer requires a `ModelProject` and uses the standard `YailEmitter` to embed compatible `.yail` files. When false or omitted, the writer preserves existing non-null YAIL and does not generate missing YAIL.

The first overload intentionally constrains raw `AiaProject` writes to `{ withYail?: false }`, so TypeScript rejects `writeAia(project, { withYail: true })`. Generating YAIL requires model-space semantics and the effective component registry.

```ts
const model = buildModel(project, environment)
const out = await writeAia(model, { withYail: true })
```

Project-level operations in `aia-kit/aia` return new project data and diagnostics. `replaceScreenScm` and `replaceScreenBky` invalidate stale derived YAIL by setting the affected screen's `yail` to `null`.

### `aia-kit/aix`

Extension package operations.

```ts
readAix(input: Uint8Array | ArrayBuffer | Blob): Promise<AiaExtension>
```

Standalone AIX and bundled AIA extensions share the `AiaExtension` shape.

### `aia-kit/ais`

Single-screen import/export helpers. AIS remains AIA-shaped, so this module is optional and can be added when concrete workflows require it.

```ts
readAis(input: Uint8Array | ArrayBuffer | Blob): Promise<AiaProject>
exportScreenAsAis(project: AiaProject, screenName: string): Promise<Blob>
```

### `aia-kit/project-properties`

Project metadata parsing and serialisation.

```ts
parseProjectProperties(raw: Record<string, string>): ProjectProperties
serializeProjectProperties(props: ProjectProperties): string
```

### `aia-kit/scm`

SCM document parsing, serialisation, component tree queries, and component-tree-only edits. `ScmDocument` is the public SCM editing API.

```ts
class ScmDocument {
  static parse(scm: string): ScmDocument

  get root(): AiaComponent
  readonly diagnostics: Diagnostic[]

  findComponentByUid(uid: string): AiaComponent | null
  getComponentsByType(type: string): AiaComponent[]
  addComponent(parentUid: string, component: AiaComponent): Diagnostic[]
  removeComponent(uid: string): Diagnostic[]
  serialize(): string
}
```

`ScmDocument` is accepted because SCM has a simple cohesive model: one wrapper plus one component tree. It owns the original SCM wrapper metadata, the parsed root, accumulated diagnostics, and serialisation back to SCM text. Its edit methods mutate only the local document instance; on error diagnostics, the document should remain unchanged for that operation.

Low-level `parseScm` / `serializeScm` helpers may exist internally, but they are not the recommended public API. Public SCM work should go through `ScmDocument` to avoid exposing users to wrapper-preservation and fold-back details.

Project-level component operations compose `aia` + `scm`.

### `aia-kit/bky`

BKY parsing, serialisation, Blockly AST types, and block-level helpers. BKY remains function-first because block programs have many possible transformations and should stay open to independent user-defined AST functions.

```ts
parseBky(bky: string): BlockAst
serializeBky(ast: BlockAst): string

removeDisabledBlocks(ast: BlockAst): BlockAst
renameComponentReferences(ast: BlockAst, fromName: string, toName: string): BlockAst
```

Project-level block mutations compose `aia` + `bky`.

### `aia-kit/yail`

YAIL emission from model space and block ASTs.

```ts
class YailEmitter {
  static for(model: ModelProject): YailEmitter

  emit(screen: ModelScreen): string
  emitScreen(screenName: string): string
}
```

YAIL emission never mutates `AiaProject` implicitly. `emit` is used because YAIL is compiler-style target text emitted from an already-built semantic model plus block ASTs. Callers use this module when they need to inspect or materialize YAIL directly. For ordinary archive writing, `writeAia(model, { withYail: true })` expresses the domain intent to emit and embed standard YAIL files.

### `aia-kit/component-descriptor`

Descriptor types, normalisation, and registry helpers.

```ts
class ComponentRegistry {
  static of(descriptors: readonly ComponentDescriptor[]): ComponentRegistry

  readonly descriptors: readonly ComponentDescriptor[]

  lookup(typeOrName: string): ComponentDescriptor | null
  has(typeOrName: string): boolean
  toMutable(): MutableComponentRegistry
}

class MutableComponentRegistry extends ComponentRegistry {
  add(descriptors: ComponentDescriptor | readonly ComponentDescriptor[]): void
  remove(typeOrNames: string | readonly string[]): void
  snapshot(): ComponentRegistry
}

normalizeComponentDescriptor(raw: unknown): ComponentDescriptor
```

`ComponentRegistry` is immutable/read-only and is appropriate for `Environment.componentRegistry` and `ModelProject.componentRegistry`. `MutableComponentRegistry` is for project-scoped registry assembly and edit workflows where installed extensions may come and go. Removing an extension from a project also removes its component descriptors from the mutable project registry before a new immutable model snapshot is built.

### `aia-kit/environment`

Platform environment loading and construction.

```ts
getEnvironmentFor(platform: Platform): Promise<Environment>
createEnvironment(input: CreateEnvironmentInput): Environment
```

### `aia-kit/model`

Data-space to model-space projection.

```ts
buildModel(project: AiaProject, environment: Environment): ModelProject
```

### `aia-kit/analysis`

Convenience analysis functions. These are not core infrastructure.

```ts
diffProjects(a: AiaProject, b: AiaProject): ProjectDiff
findUnusedAssets(model: ModelProject): AiaAsset[]
findUnusedExtensions(model: ModelProject): AiaExtension[]
findAssetReferences(model: ModelProject): AssetReference[]
analyzeComplexity(model: ModelProject): ComplexityReport
buildNavGraph(model: ModelProject): NavGraph
```

Where analysis needs semantics, it takes `ModelProject`. Where it only needs archive structure, it takes `AiaProject`.

Semantic projection diagnostics are read directly from `buildModel(project, environment).diagnostics`. The initial API should not add trivial wrapper functions for that expression. Additional analysis should be exposed as separate named functions only when it derives information beyond model construction.

---

## Error and Diagnostic Policy

Hard IO and construction failures throw typed errors:

```ts
AiaZipError
AiaStructureError
AiaParseError
AiaWriteError
EnvironmentConstructionError
```

Data-level project issues return diagnostics:

```ts
Diagnostic[]
```

Examples:

- unknown component type
- malformed screen SCM inside an otherwise readable AIA
- malformed BKY for one screen
- orphaned blocks
- missing asset references
- unsupported YAIL emission block

---

## Naming Notes

Preferred names:

| Old | New |
|---|---|
| `resolve(project, env)` | `buildModel(project, environment)` |
| `Environment.kodularCreator()` | `getEnvironmentFor(Platform.KodularCreator)` |
| `Environment.mitAppInventor()` | `getEnvironmentFor(Platform.MitAppInventor)` |
| `env.withExtension(ext)` | removed |
| `withExtensions(project.extensions)` | handled by `buildModel` |

Use `read*` / `write*` for archive or file-format boundaries:

```ts
readAia
writeAia
readAix
readAis
```

`readAia` replaces `parseAia`. v2 is a rewrite, so no compatibility alias is required.

Use `parse*` / `serialize*` for string-level formats:

```ts
parseBky
serializeBky
parseProjectProperties
serializeProjectProperties
```

SCM is the exception: use `ScmDocument.parse(...).serialize()` publicly because SCM edits need to preserve wrapper metadata alongside the component tree.

Use `build*` for derived semantic projections and `create*` for validated construction:

```ts
buildModel
createEnvironment
```

Use class namespacing when the class is the domain object:

```ts
ComponentRegistry.of(descriptors)
registry.toMutable()
YailEmitter.for(model)
```

Avoid callback-style lens helpers in core modules when explicit parse-transform-serialize composition is clearer:

```ts
const ast = parseBky(screen.bky)
const nextAst = removeDisabledBlocks(ast)
const nextBky = serializeBky(nextAst)
```

### SCM Document Class

```ts
const scm = ScmDocument.parse(screen.scm)
const diagnostics = scm.addComponent(parentUid, component)
const nextScm = scm.serialize()
```

`ScmDocument` is part of the SCM module because it improves simple component-tree edit workflows without crossing the project boundary.

BKY stays function-first:

```ts
const ast = parseBky(screen.bky)
const nextAst = removeDisabledBlocks(ast)
const nextBky = serializeBky(nextAst)
```

Do not introduce `BkyDocument` in the initial API. BKY has a complex programming-AST data model with many possible transformations; independent functions compose and extend better than a method surface that can grow into a catch-all block editor API.

---

## Example Workflows

### Inspect only an AIA archive

```ts
import { readAia } from 'aia-kit/aia'

const project = await readAia(blob)
console.log(project.screens.map(screen => screen.name))
```

### Edit one SCM file directly

```ts
import { ScmDocument } from 'aia-kit/scm'

const scm = ScmDocument.parse(screen.scm)
const diagnostics = scm.addComponent(parentUid, component)
const nextScm = scm.serialize()
```

### Edit a project using composable modules

```ts
import { readAia, replaceScreenScm, writeAia } from 'aia-kit/aia'
import { getEnvironmentFor, Platform } from 'aia-kit/environment'
import { buildModel } from 'aia-kit/model'
import { ScmDocument } from 'aia-kit/scm'

const project = await readAia(blob)
const env = await getEnvironmentFor(Platform.KodularCreator)
const screen = project.screens.find(s => s.name === 'Screen1')!

const scm = ScmDocument.parse(screen.scm)
const diagnostics = scm.addComponent(parentUid, component)
const nextScm = scm.serialize()

const { project: updated } = replaceScreenScm(project, 'Screen1', nextScm)
const updatedModel = buildModel(updated, env)
const out = await writeAia(updatedModel, { withYail: true })
```

### Build semantic model

```ts
import { readAia } from 'aia-kit/aia'
import { getEnvironmentFor, Platform } from 'aia-kit/environment'
import { buildModel } from 'aia-kit/model'

const project = await readAia(blob)
const env = await getEnvironmentFor(Platform.KodularCreator)
const model = buildModel(project, env)
```

### Generate YAIL explicitly

```ts
import { YailEmitter } from 'aia-kit/yail'

const emitter = YailEmitter.for(model)
const yail = emitter.emitScreen('Screen1')
```

### Run convenience analysis

```ts
import { buildNavGraph } from 'aia-kit/analysis'

const diagnostics = model.diagnostics
const graph = buildNavGraph(model)
```

---

## Non-Goals

- No framework-style editing session object.
- No large mutable `AiaProject` class with all operations as methods.
- No extension-augmented `Environment`.
- No hidden model rebuilding after project mutation.
- No automatic YAIL regeneration unless explicitly requested through `writeAia(model, { withYail: true })` or the YAIL module.
- No central `aia-kit/mutations` module as a canonical domain boundary.
- No callback-style BKY lens API in the core surface.
- No `BkyDocument` class in the initial API.
- No greenfield project factory in the initial API. The v2 surface targets read, inspect, edit, analyse, and write workflows first; project templates can be specified later when concrete creation semantics are known.
- No trivial public wrappers for `buildModel(project, environment).diagnostics`.
- No requirement to use analysis or project-level helpers for low-level workflows.

---

## Migration From Previous v2 Draft

The previous draft remains useful for type and milestone detail, but these conceptual changes supersede it:

1. `resolve` is renamed to `buildModel`.
2. `Environment` becomes a plain value interface.
3. Built-in platform loading moves to `getEnvironmentFor(platform)`.
4. `Environment.withExtension` and `withExtensions` are removed.
5. `ComponentRegistry` is a class-based immutable registry, with `MutableComponentRegistry` for project-scoped extension add/remove workflows.
6. `ModelProject` exposes the effective component registry snapshot built from base platform components plus project-installed extension descriptors.
7. Public package structure is reorganized around domain subpaths.
8. Advanced analysis and mutation APIs are explicitly convenience layers over lower-level modules.
