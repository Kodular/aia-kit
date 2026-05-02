# aia-kit usage guide

A practical walkthrough of the v2 API. For format internals see [file-formats.md](file-formats.md); for the full exported surface see [api.md](api.md).

---

## Installation

```sh
npm install aia-kit
# or
pnpm add aia-kit
```

---

## The core pipeline

aia-kit has a two-stage pipeline: **parse** (ZIP → raw data) then **resolve** (raw → enriched model). Keeping them separate means you can inspect raw data without needing a platform environment, and you only pay for resolution when you need descriptors and diagnostics.

```
AIA blob  ──parse──▶  AiaProject  ──resolve──▶  ModelProject
                       (raw)                      (enriched)
```

### Parse and resolve in one step

```typescript
import { Environment, parseAndResolve } from 'aia-kit'

const env = await Environment.kodularCreator()
const blob = /* Blob from file input, fetch, or fs.readFile */

const { project, diagnostics } = await parseAndResolve(blob, env)
// project: ModelProject
// diagnostics: Diagnostic[]
```

### Or as separate steps

```typescript
import { Environment, parseAia, resolve } from 'aia-kit'

const env = await Environment.kodularCreator()
const raw = await parseAia(blob)       // AiaProject — no env needed
const { project, diagnostics } = resolve(raw, env)  // ModelProject
```

Use `parseAia` alone when you only need to inspect raw properties, screen names, or asset lists without resolving component descriptors.

---

## Environments

An `Environment` bundles a component registry (from `simple_components.json`) and a block registry (built-in Blockly block types).

```typescript
// Bundled platforms
const env = await Environment.kodularCreator()
const env = await Environment.mitAppInventor()

// Extend with AIX extensions loaded from the project
import { parseAix } from 'aia-kit'

const aix = await parseAix(aixBlob)
const extendedEnv = env.withExtension(aix)

// Or extend with all extensions already bundled in the project
const extendedEnv = env.withExtensions(raw.extensions)
```

The `componentRegistry` and `blockRegistry` properties on `Environment` are typed and exported — you can accept them in your own functions:

```typescript
import type { ComponentRegistry } from 'aia-kit'

function findByCategory(registry: ComponentRegistry, category: string) {
  return registry.descriptors.filter(d => d.categoryString === category)
}
```

---

## Diagnostics

All data-level problems surface as `Diagnostic[]` rather than throws. Throws are reserved for hard I/O failures (bad ZIP, unreadable file).

```typescript
import { mergeReports } from 'aia-kit'

for (const d of diagnostics) {
  console.log(`[${d.severity}] ${d.code} at ${d.path.join('.')}: ${d.message}`)
}

// Combine diagnostic arrays from multiple operations
const allDiagnostics = mergeReports(diagnostics, mutationResult.diagnostics)
```

Severity levels: `'error'` | `'warning'` | `'info'`

---

## Working with blocks

Blocks are stored as BKY (Blockly XML) per screen. The block lens parses/serialises transparently so you work with `BlockAst` objects.

### Query blocks (read-only)

```typescript
import { queryBlocks } from 'aia-kit'

const blockCount = queryBlocks(project.screens[0], ast => ast.blocks.length)

const eventHandlers = queryBlocks(project.screens[0], ast =>
  ast.blocks.filter(b => b.type === 'component_event')
)
```

`queryBlocks` accepts both a raw `AiaScreen` and a `ModelScreen`.

### Update blocks on one screen

```typescript
import { updateBlocks, parseBlocks } from 'aia-kit'

const { project: updated, diagnostics } = updateBlocks(
  raw,
  'Screen1',
  ast => ({
    ...ast,
    blocks: ast.blocks.filter(b => !b.disabled),
  })
)
```

### Update blocks on all screens

```typescript
import { updateAllScreenBlocks } from 'aia-kit'

const { project: updated } = updateAllScreenBlocks(raw, (ast, screenName) => {
  console.log(`Processing ${screenName}: ${ast.blocks.length} top-level blocks`)
  return ast
})
```

### Parse and serialise BKY manually

```typescript
import { parseBlocks, serializeBlocks } from 'aia-kit'

const ast = parseBlocks(screen.bky)          // BKY XML string → BlockAst
const xml = serializeBlocks(ast)             // BlockAst → BKY XML string
```

---

## Working with components

The component tree utilities operate on `AiaComponent` (raw) or `ModelComponent` (resolved).

```typescript
import { findComponent, getComponentsByType, getParent, getComponentPath } from 'aia-kit'

const form = project.screens[0].form   // ModelComponent (root)

// Find by UID
const btn = findComponent(form, 'some-uid-string')

// Find all components of a type
const labels = getComponentsByType(form, 'com.google.appinventor.components.runtime.Label')

// Get the parent of a component (pass the ModelComponent reference)
const parent = getParent(form, btn!)

// Get path from root to a UID — returns ModelComponent[]
const path = getComponentPath(form, 'some-uid-string')
// e.g. [Screen1Component, HorizontalArrangement1Component, SubmitButtonComponent]
const names = path.map(c => c.name)
// e.g. ['Screen1', 'HorizontalArrangement1', 'SubmitButton']
```

---

## Structural mutations

All mutation functions return `MutationResult` — a new `AiaProject` plus any diagnostics. The input project is never mutated.

### Screens

```typescript
import { addScreen, removeScreen, cloneScreen } from 'aia-kit'

const { project: withNew } = addScreen(raw, 'Settings')
const { project: without } = removeScreen(raw, 'OldScreen')
const { project: withClone } = cloneScreen(raw, 'Screen1', 'Screen1Copy')
```

### Components

```typescript
import { addComponent, removeComponent, updatePropertyWhere } from 'aia-kit'

const newComponent = {
  name: 'MyButton',
  type: 'com.google.appinventor.components.runtime.Button',
  uid: crypto.randomUUID(),
  properties: { Text: 'Click me' },
  children: [],
}

const { project: withBtn } = addComponent(raw, 'Screen1', 'HorizontalArrangement1', newComponent)
const { project: withoutBtn } = removeComponent(raw, 'Screen1', 'MyButton')

// Bulk property update across all matching components
const { project: updated } = updatePropertyWhere(
  raw,
  comp => comp.type.endsWith('.Button'),
  'FontSize',
  '16'
)
```

### Assets and extensions

```typescript
import { addAsset, removeAsset, addExtension, removeExtension } from 'aia-kit'

const { project: withAsset } = await addAsset(raw, assetBlob, 'logo.png')
const { project: withoutAsset } = removeAsset(raw, 'old-logo.png')

const aix = await parseAix(aixBlob)
const { project: withExt } = addExtension(raw, aix)
const { project: withoutExt } = removeExtension(raw, 'com.example.MyExtension')
```

### Merging two projects

```typescript
import { mergeProjects } from 'aia-kit'
import type { MergeOptions } from 'aia-kit'

const options: MergeOptions = {
  screenConflict: 'rename',   // 'skip' | 'overwrite' | 'rename'
  assetConflict: 'skip',      // 'skip' | 'overwrite'
  includeExtensions: true,
}

const { project: merged, diagnostics } = mergeProjects(target, source, options)
```

---

## Analysis

### Run the built-in diagnostic pass

```typescript
import { diagnose } from 'aia-kit'

const diagnostics = diagnose(raw, env)
```

### Diff two projects

```typescript
import { diffProjects } from 'aia-kit'

const diff = diffProjects(projectA, projectB)
// diff.screensOnlyInA, diff.screensOnlyInB, diff.screensDiffering, ...
```

### Find unused assets and extensions

```typescript
import { findUnusedAssets, findUnusedExtensions, findAssetReferences } from 'aia-kit'

const unusedAssets = findUnusedAssets(raw)
const unusedExts = findUnusedExtensions(raw)

const refs = findAssetReferences(raw)
// refs: AssetReference[] — where each asset is referenced (property or block_xml)
```

### Block analysis

```typescript
import { analyzeVariables, exportBlockSummary } from 'aia-kit'
import { analyzeComplexity, findDeadBlocks, buildNavGraph } from 'aia-kit'

const vars = analyzeVariables(raw)
// vars.declared, vars.referenced

const summary = exportBlockSummary(raw)
// summary.topLevelCount, summary.totalBlocks, summary.blocksByType

const complexity = analyzeComplexity(raw)
// complexity.screens[n].maxDepth, ...

const dead = findDeadBlocks(raw)
// dead: DeadBlock[] — top-level blocks that are unreachable

const nav = buildNavGraph(raw)
// nav.nodes (screen names), nav.edges (open_another_screen calls)
```

---

## Generating YAIL

YAIL is the Scheme-like intermediate language App Inventor uses at runtime. Most consumers won't need this, but it's available:

```typescript
import { parseAndResolve, createYailGenerator, writeAia } from 'aia-kit'

const { project } = await parseAndResolve(blob, env)
const generateYail = createYailGenerator(project)

// Attach YAIL to each screen before writing
const screensWithYail = project.source.screens.map(screen => ({
  ...screen,
  yail: generateYail(project.screens.find(s => s.name === screen.name)!),
}))
```

`writeAia` calls `createYailGenerator` internally when `yail` is null, so manual generation is only needed if you want to inspect or override the output.

---

## Writing back to AIA

```typescript
import { writeAia } from 'aia-kit'

// Pass the raw AiaProject (mutations return AiaProject, not ModelProject)
const outputBlob = await writeAia(updatedRaw)
```

If you've been working with a `ModelProject`, reach back through `.source`:

```typescript
const outputBlob = await writeAia(modelProject.source)
```

### Serialising `project.properties` standalone

```typescript
import { serializeProperties, parseProjectProperties } from 'aia-kit'

const text = serializeProperties(raw.properties)   // → key=value string
const props = parseProjectProperties(text)          // → ProjectProperties
```

---

## Error handling

Hard failures throw typed errors you can `instanceof`-check:

```typescript
import { AiaKitError, AiaParseError, AiaZipError, AiaStructureError, AiaWriteError } from 'aia-kit'

try {
  const raw = await parseAia(blob)
} catch (e) {
  if (e instanceof AiaZipError) {
    // not a valid ZIP
  } else if (e instanceof AiaStructureError) {
    // valid ZIP but missing expected AIA contents
  } else if (e instanceof AiaParseError) {
    // malformed SCM or BKY inside the archive
  }
}
```

All are subclasses of `AiaKitError`, so a single `instanceof AiaKitError` check covers any library error.
