# aia-kit Design Summary

## Context

`aia-kit` is a TypeScript library for reading, parsing, editing, and writing AIA/AIX/AIS files — the project format used by App Inventor-based platforms like Kodular Creator and MIT App Inventor. The redesign started from a working but architecturally tangled codebase and worked toward a clean, composable, well-typed library.

---

## What We Rejected

**Rust + WASM rewrite** — considered and rejected. The library's hot paths are ZIP decompression and JSON/XML parsing, neither of which is CPU-bound. WASM wins on sustained computation. For typical AIA files the entire parse completes in milliseconds in JS. The costs — 300–600KB binary, two-stage build, Rust toolchain requirement, JS bridge for Blob — outweigh any measurable benefit. A native Rust binary makes sense for server-side batch processing but that's a separate tool, not a rewrite of the npm package.

---

## Core Design Decisions

### 1. OOP vs Functions

**Rule: plain immutable data types, pure functions for behaviour, classes only for genuinely stateful abstractions.**

- `Environment` stays a class — lazy loading and descriptor lookup are worth encapsulating
- `BkyParser` and `ScmParser` stay as classes — they wrap a parsed document with query methods
- Everything else is plain types and functions
- No behaviour buried in data classes (`Project.addExtensions`, `Screen.generateYail`, etc.)

### 2. Separate Raw Data from Resolved Model

The most important design decision. Two distinct layers:

**Raw (`AiaProject`)** — faithful representation of the ZIP contents. No interpretation, no platform knowledge. Can always round-trip back to an identical AIA file.

**Resolved (`ResolvedProject`)** — raw data enriched with environment knowledge. Properties filled with defaults, types known, descriptors attached. Carries `source` reference back to raw.

```ts
interface AiaProject {
  name: string
  properties: Record<string, string>
  screens: AiaScreen[]
  assets: AiaAsset[]
  extensions: AiaExtension[]
}

interface AiaScreen {
  name: string
  scm: string         // raw file content, preserved
  bky: string         // raw file content, preserved
  yail: string | null
}

interface AiaAsset {
  name: string
  type: string
  data: Uint8Array    // not Blob — works in Node and browser
}

interface ResolvedProject {
  source: AiaProject         // always carry the origin
  environment: Environment
  screens: ResolvedScreen[]
  diagnostics: CorruptionReport
}

interface ResolvedScreen {
  source: AiaScreen
  name: string
  form: ResolvedComponent    // nested tree, source of truth
}

interface ResolvedComponent {
  name: string
  type: string
  uid: string
  descriptor: ComponentDescriptor
  properties: ComponentProperty[]
  children: ResolvedComponent[]
  parent: ResolvedComponent | null
}
```

### 3. Immutable Structures

Immutable by default. Mutations return new values via spread-and-replace. No hidden state swaps. Every mutation function returns `MutationResult`:

```ts
interface MutationResult {
  project: AiaProject
  diagnostics: CorruptionReport
}
```

Results compose — sequential mutations can merge their diagnostic slices.

### 4. Component Tree Structure

**Nested tree is the source of truth.** No separate flat normalisation. The tree reflects the AIA file structure, is natural for YAIL generation and write-back, and is what App Inventor actually uses.

Query functions operate on the tree directly. Common queries like `getComponentsByType` are O(n) single-pass iterations — fast enough for AIA file sizes. Parent references on each node make upward traversal O(depth) without needing a separate index.

### 5. Environment Naming

Keep **`Environment`** over "Platform". It's the established term in App Inventor's own codebase, existing users know it, and "Platform" is overloaded in JS/TS land. The problem with the current `Environment` class isn't the name — it's that it does too much. A focused `Environment` class is the right abstraction.

### 6. `simple_components.json` Location

Moved to package root under `environments/`, flat, lazy-loaded via dynamic import:

```
environments/
├── kodular-creator.json
└── mit-app-inventor.json
```

Easy to discover, easy to add new environments, only loaded when needed.

### 7. Types Live With Their Code

No dedicated `types/` folder. In a TypeScript-first library, types live with the code they describe. Types describing the output of a module live in that module. Shared contracts live in `core/`.

---

## Pipeline Architecture

Three stages, independently enterable:

```ts
// Stage 1 — parse, no environment needed
const raw: AiaProject = await parseAia(blob)

// Stage 2 — resolve, enriches with environment knowledge
const resolved: ResolvedProject = resolve(raw, environment)

// Stage 3 — write, accepts either raw or resolved
const output: Blob = await writeAia(resolved)
// writeAia internally: 'source' in project ? project.source : project
```

YAIL generation is a separate concern, not a method on Screen:

```ts
const yail: string = generateYail(screen, packageName)
```

---

## Package Structure

One npm package, subpath exports for each pipeline stage, internal workspace modules:

```
aia-kit/                          # repo root
│
├── environments/
│   ├── kodular-creator.json
│   └── mit-app-inventor.json
│
├── packages/
│   ├── core/                     # shared contracts, no pipeline logic
│   │   └── src/
│   │       ├── Environment.ts
│   │       ├── descriptors.ts
│   │       └── scm.ts
│   │
│   ├── parse/
│   │   └── src/
│   │       ├── index.ts
│   │       ├── parseAia.ts
│   │       ├── parseScreens.ts
│   │       ├── parseAssets.ts
│   │       ├── parseExtensions.ts
│   │       └── parseProperties.ts
│   │
│   ├── resolve/
│   │   └── src/
│   │       ├── index.ts
│   │       ├── resolve.ts
│   │       ├── resolveScreen.ts
│   │       └── resolveComponent.ts
│   │
│   ├── write/
│   │   └── src/
│   │       ├── index.ts
│   │       └── writeAia.ts
│   │
│   ├── yail/
│   │   └── src/
│   │       ├── index.ts
│   │       ├── YailGenerator.ts
│   │       ├── ast/
│   │       │   ├── SchemeAST.ts
│   │       │   └── YailConstructs.ts
│   │       └── blocks/
│   │
│   └── aia-kit/                  # published package
│       ├── package.json
│       └── src/
│           ├── index.ts          # re-exports everything
│           ├── parse.ts          # re-exports aia-kit/parse
│           ├── resolve.ts        # re-exports aia-kit/resolve
│           ├── write.ts          # re-exports aia-kit/write
│           └── yail.ts           # re-exports aia-kit/yail
│
└── pnpm-workspace.yaml
```

Dependency graph has no cycles:

```
core ← parse ← resolve ← write
                       ← yail
```

Published subpath exports:

```json
{
  "exports": {
    ".":         "./dist/src/index.js",
    "./parse":   "./dist/src/parse.js",
    "./resolve": "./dist/src/resolve.js",
    "./write":   "./dist/src/write.js",
    "./yail":    "./dist/src/yail.js"
  }
}
```

---

## Diagnostics Model

`CorruptionReport` is the single vocabulary for describing problems, used by both `diagnose` and all mutation functions:

```ts
interface CorruptionReport {
  missingScreenFiles: MissingScreenFile[]
  unresolvableComponents: UnresolvableComponent[]
  invalidProperties: InvalidProperty[]
  duplicateComponentNames: DuplicateComponent[]
  duplicateScreenNames: string[]
  malformedScm: MalformedFile[]
  malformedBky: MalformedFile[]
  missingAssetRefs: MissingAssetRef[]
  versionMismatches: VersionMismatch[]
  orphanedBlocks: OrphanedBlock[]
}
```

Key decisions:
- `resolve` never throws on corruption — resolves what it can, populates `diagnostics`
- Mutation functions return a slice of `CorruptionReport`, not a separate type
- Orphaned blocks are left in BKY after extension removal — caller decides whether to strip them
- `diagnose(project, environment)` is the canonical full validator

---

## Full Capability Surface

### Pipeline
- `parseAia(blob | string): Promise<AiaProject>`
- `resolve(project, environment): ResolvedProject`
- `writeAia(project | resolved): Promise<Blob>`
- `generateYail(screen, packageName): string`

### Mutation (all return `MutationResult`)
- `addScreen`, `removeScreen`, `cloneScreen`
- `addComponent`, `removeComponent`, `migrateComponent`
- `addAsset`, `removeAsset`
- `addExtension`, `removeExtension`
- `updatePropertyWhere`
- `mergeProjects`
- `applyScreenTemplate`, `extractScreenTemplate`

### Analysis
- `diagnose` — full corruption report
- `findUnusedExtensions`, `findUnusedAssets`
- `findAssetReferences`
- `buildNavGraph` — screen navigation as a graph with reachability
- `analyzeComplexity` — cyclomatic complexity, nesting depth, block counts
- `findDeadBlocks` — unreachable code detection
- `analyzeVariables` — set-but-never-read, read-before-set
- `inferPermissions` — Android permissions from component usage
- `diffProjects` — structured diff between two project versions
- `checkNamingConventions`
- `auditAccessibility`
- `checkSdkCompatibility`

### Export & Interop
- `exportBlockSummary`
- `exportComponentInventory`
- `toMermaid(navGraph)`, `componentTreeToMermaid(screen)`
- `projectToJson`, `projectFromJson`

---

## What Was Preserved From the Original

- `BkyParser` and `ScmParser` — already clean and well-structured
- `SchemeAST` and `YailConstructs` — the AST approach with typed `SchemeExpr` nodes is solid
- Zod validators for component descriptors and SCM schemas
- The block handler class structure inside `yail/`
- Support for both Kodular Creator and MIT App Inventor environments

---

## The Guiding Principle

Every function accepts the minimum it needs — raw project for structural operations, resolved project for platform-aware operations. Every mutation returns the same `MutationResult` envelope. Every diagnostic uses the same `CorruptionReport` vocabulary. The pipeline is enterable at any stage. Nothing is coupled that doesn't need to be.

---

# Use Cases Explored

## 1. Basic Project Lifecycle

The end-to-end pipeline from file to output:

```ts
// Read
const raw = await parseAia(blob)

// Enrich
const environment = await Environment.kodularCreator()
const resolved = resolve(raw, environment)

// Inspect
console.log(resolved.screens.map(s => s.name))
console.log(resolved.source.assets.map(a => a.name))

// Write back
const output = await writeAia(resolved)
```

---

## 2. Extension Management

### Removing an Extension Safely

The key insight was that removing an extension should **not cascade-delete** affected components and blocks. Instead it produces a diagnostic slice so the caller decides what to do:

```ts
const { project, diagnostics } = removeExtension(raw, 'com.example.MyExtension')

// inspect what broke
console.log(diagnostics.unresolvableComponents)  // components whose type is now unknown
console.log(diagnostics.orphanedBlocks)          // blocks referencing those components

// Option A — inspect and proceed, strip orphaned blocks
const cleaned = stripOrphanedBlocks(project, diagnostics)
await writeAia(cleaned)

// Option B — abort, too much breakage
if (diagnostics.unresolvableComponents.length > 0) {
  throw new Error('Cannot safely remove extension')
}

// Option C — keep orphans, write anyway, useful for debugging
await writeAia(project)
```

Orphaned blocks stay in the BKY intentionally — they carry diagnostic value. At resolve time they surface as first-class data:

```ts
interface ResolvedScreen {
  form: ResolvedComponent
  orphanedBlocks: OrphanedBlock[]
}
```

### Sequential Extension Removal

Results compose because `MutationResult` always returns the same `CorruptionReport` vocabulary:

```ts
const r1 = removeExtension(raw, 'com.example.ExtA')
const r2 = removeExtension(r1.project, 'com.example.ExtB')

const combined = mergeReports(r1.diagnostics, r2.diagnostics)
```

### Finding Unused Extensions

```ts
const unused = findUnusedExtensions(resolved)
// extensions present in the AIA but with no component instances anywhere
```

---

## 3. Asset Management

### Finding Unused Assets

Asset references live in two places — component properties with `editorType === 'asset'` and `helpers_assets` blocks:

```ts
const refs = findAssetReferences(resolved)
const unused = findUnusedAssets(resolved)

// unused assets with their sizes — useful for bundle optimization
unused.forEach(a => {
  console.log(`${a.name} (${a.sizeBytes} bytes) is never referenced`)
})
```

### Removing Unused Assets

Composes naturally with the mutation model:

```ts
const cleaned = findUnusedAssets(resolved)
  .reduce(
    (proj, asset) => removeAsset(proj, asset.name).project,
    raw
  )

await writeAia(cleaned)
```

---

## 4. Corruption Detection and Diagnosis

### Full Project Diagnosis

```ts
const report = diagnose(raw, environment)

// what can go wrong
report.missingScreenFiles        // scm without bky or vice versa
report.unresolvableComponents    // type not in environment or extensions
report.invalidProperties         // property value fails validation
report.duplicateComponentNames   // name collision within a screen
report.duplicateScreenNames
report.malformedScm              // JSON parse failure
report.malformedBky              // XML parse failure
report.missingAssetRefs          // property or block refs asset not in assets/
report.versionMismatches         // component version in scm vs descriptor
report.orphanedBlocks
```

### Resolve Never Throws

`resolve` resolves what it can and populates `diagnostics` on the result rather than throwing. A partially broken project is still useful:

```ts
const resolved = resolve(raw, environment)

if (resolved.diagnostics.unresolvableComponents.length > 0) {
  // still have access to everything that did resolve
  // can still analyze, export, or partially write
}
```

### Diagnosis as a Pre/Post Check

```ts
const before = diagnose(raw, environment)

const { project } = removeExtension(raw, 'com.example.Ext')

const after = diagnose(project, environment)

// compare — did we introduce new problems?
const newIssues = after.unresolvableComponents
  .filter(c => !before.unresolvableComponents
    .some(b => b.componentName === c.componentName)
  )
```

---

## 5. Screen Navigation Graph

Analyzing how screens connect to each other via block-level navigation calls:

```ts
const graph = buildNavGraph(resolved)

// dead screens — defined but never reachable from Screen1
const dead = graph.screens.filter(s => !s.isReachable)

// screens with only dynamic navigation — target screen comes from a variable
// static analysis can't follow these
const dynamic = graph.edges.filter(e => typeof e.to !== 'string')

// screens with no exit path
const noExit = graph.screens.filter(s =>
  !graph.edges.some(e => e.from === s.name)
)

// visualize
const diagram = toMermaid(graph)
```

Navigation edges carry full context:

```ts
interface NavEdge {
  from: string
  to: string | DynamicTarget     // DynamicTarget when screen name is a variable
  trigger: NavTrigger            // which component event triggered the navigation
  condition: 'always' | 'conditional'  // conditional if inside controls_if
}
```

---

## 6. Code Quality Analysis

### Complexity Scoring

```ts
const complexity = analyzeComplexity(resolved)

// find screens that need refactoring
const hotspots = complexity.screens
  .filter(s => s.score > 80)
  .sort((a, b) => b.score - a.score)

// cyclomatic complexity — branching paths through blocks
hotspots.forEach(s => {
  console.log(`${s.screenName}: score ${s.score}, ${s.cyclomaticComplexity} paths`)
})
```

### Dead Block Detection

```ts
const dead = findDeadBlocks(resolved)

// unreachable after close-screen
// always-false conditions
// event handlers on non-existent components
dead.forEach(b => {
  console.log(`${b.screenName} — block ${b.blockId} is dead: ${b.reason}`)
})
```

### Variable Usage Analysis

```ts
const variables = analyzeVariables(resolved)

variables
  .filter(v => v.issues.includes('never_read'))
  .forEach(v => console.log(`Global variable "${v.name}" is set but never read`))

variables
  .filter(v => v.issues.includes('read_before_set'))
  .forEach(v => console.log(`Global variable "${v.name}" may be read before being set`))
```

---

## 7. Project Comparison

```ts
const v1 = await parseAia(blobV1)
const v2 = await parseAia(blobV2)

const diff = diffProjects(v1, v2)

diff.addedScreens       // new screens in v2
diff.removedScreens     // screens removed from v1
diff.modifiedScreens    // screens present in both with changes
diff.addedAssets
diff.removedAssets
diff.addedExtensions
diff.removedExtensions
```

---

## 8. Validation and Linting

### Naming Conventions

```ts
const violations = checkNamingConventions(resolved, {
  components: /^[A-Z][a-zA-Z0-9]+$/,    // PascalCase
  variables: /^[a-z][a-zA-Z0-9]+$/,     // camelCase
  procedures: /^[a-z][a-zA-Z0-9]+$/
})
```

### Accessibility Audit

```ts
const issues = auditAccessibility(resolved)

issues
  .filter(i => i.severity === 'error')
  .forEach(i => {
    console.log(`${i.screenName}/${i.componentName}: ${i.issue}`)
  })
```

### SDK Compatibility

```ts
// targeting Android API 21 minimum
const issues = checkSdkCompatibility(resolved, 21)

issues.forEach(i => {
  console.log(
    `${i.componentName} requires SDK ${i.requiredSdk}, ` +
    `but target is ${i.targetSdk}`
  )
})
```

### Permission Inference

```ts
const permissions = inferPermissions(resolved)

// know exactly which components triggered each permission
permissions.certain.forEach(p => {
  const triggers = permissions.components[p]
  console.log(`${p} required by: ${triggers.join(', ')}`)
})
```

---

## 9. Bulk Editing

### Update Properties Across All Matching Components

```ts
// make all buttons use the same color
const { project } = updatePropertyWhere(
  raw,
  component => component.type === 'Button',
  'BackgroundColor',
  '&HFF2196F3'
)
```

### Migrate a Component Type

```ts
// plan the migration first
const plan = planComponentMigration(
  environment.lookup('OldButton'),
  environment.lookup('NewButton')
)

console.log('Unmapped properties:', plan.unmappedProperties)
console.log('New required properties:', plan.newRequiredProperties)

// execute if acceptable
const { project, diagnostics } = migrateComponent(
  raw,
  'Screen1',
  'MyButton',
  'NewButton',
  environment
)
```

### Merge Two Projects

```ts
const { project } = mergeProjects(target, source, {
  screenConflict: 'rename',
  assetConflict: 'skip',
  extensionConflict: 'overwrite'
})
```

---

## 10. Export and Interop

### Mermaid Diagrams

```ts
// screen navigation
const navDiagram = toMermaid(buildNavGraph(resolved))

// component tree for a single screen
const treeDiagram = componentTreeToMermaid(
  resolved.screens.find(s => s.name === 'Screen1')!
)
```

### JSON Roundtrip

Useful for version control, database storage, and diffing:

```ts
const json = projectToJson(raw)
// store in database, commit to git, send over network

const restored = projectFromJson(json)
await writeAia(restored)
```

### Component Inventory

Flat spreadsheet-friendly export of every component and its properties:

```ts
const inventory = exportComponentInventory(resolved)
// useful for documentation, auditing, feeding into other tools
```

### Block Summary

Human-readable JSON of all blocks, useful for LLM analysis or external tooling:

```ts
const summary = exportBlockSummary(resolved)
```

---

## 11. Screen Templates

Extract a reusable screen from one project and stamp it into another:

```ts
// extract
const template = extractScreenTemplate(raw, 'LoginScreen')

// apply to a different project
const { project } = applyScreenTemplate(
  otherProject,
  template,
  'LoginScreen'
)
```

---

## Common Thread Across All Use Cases

Every scenario composes from the same primitives without special cases:

- Start from `parseAia` or an existing `AiaProject`
- Optionally `resolve` when platform knowledge is needed
- Apply analysis functions or mutation functions
- Mutations always return `MutationResult` — same envelope, same diagnostic vocabulary
- End with `writeAia`, an export function, or just inspect the data

No use case required changing the core data model. The design held across all of them.
