# aia-kit usage guide

A practical walkthrough of the v2 API. For format internals see [file-formats.md](file-formats.md); for the full exported surface see [api.md](api.md).

---

## The core pipeline

aia-kit has a two-stage pipeline: **read** (ZIP → raw data) then **build model** (raw → enriched model). Keeping them separate means you can inspect raw data without needing a platform environment, and you only pay for model construction when you need descriptors and diagnostics.

```
AIA blob  ──readAia──▶  AiaProject  ──buildModel──▶  ModelProject
                         (raw)                       (enriched)
```

### Read and build a model

```typescript
import { readAia } from 'aia-kit/aia'
import { getEnvironmentFor, Platform } from 'aia-kit/environment'
import { buildModel } from 'aia-kit/model'

const env = await getEnvironmentFor(Platform.KodularCreator)
const blob = /* Blob from file input, fetch, or fs.readFile */

const raw = await readAia(blob)       // AiaProject — no env needed
const model = buildModel(raw, env)    // ModelProject
const { diagnostics } = model
```

Use `readAia` alone when you only need to inspect raw properties, screen names, or asset lists without building a semantic model.

---

## Environments

An `Environment` bundles a component registry (from `simple_components.json`) and a built-in block registry (Blockly block types).

```typescript
// Bundled platforms
import { getEnvironmentFor, Platform } from 'aia-kit/environment'

const kodular = await getEnvironmentFor(Platform.KodularCreator)
const mit = await getEnvironmentFor(Platform.MitAppInventor)

// Read standalone AIX extensions
import { readAix } from 'aia-kit/aix'

const aix = await readAix(aixBlob)
```

The `componentRegistry` and `builtinBlockRegistry` properties on `Environment` are typed and exported — you can accept them in your own functions:

```typescript
import type { Environment } from 'aia-kit/environment'

function findByCategory(env: Environment, category: string) {
  return env.componentRegistry.descriptors.filter(d => d.categoryString === category)
}
```

---

## Diagnostics

All data-level problems surface as `Diagnostic[]` rather than throws. Throws are reserved for hard I/O failures (bad ZIP, unreadable file).

```typescript
for (const d of diagnostics) {
  console.log(`[${d.severity}] ${d.code} at ${d.path.join('.')}: ${d.message}`)
}
```

Severity levels: `'error'` | `'warning'` | `'info'`

---

## Working with blocks

Blocks are stored as BKY (Blockly XML) per screen. The BKY helpers let you parse, transform, and serialise `BlockAst` objects.

### Query blocks (read-only)

```typescript
import { parseBky } from 'aia-kit/bky'

const ast = parseBky(project.screens[0].bky)
const blockCount = ast.blocks.length

const eventHandlers = ast.blocks.filter(b => b.type === 'component_event')
```

### Update blocks on one screen

```typescript
import { replaceScreenBky } from 'aia-kit/aia'
import { parseBky, removeDisabledBlocks, serializeBky } from 'aia-kit/bky'

const screen = raw.screens.find(s => s.name === 'Screen1')!
const nextBky = serializeBky(removeDisabledBlocks(parseBky(screen.bky)))
const { project: updated, diagnostics } = replaceScreenBky(raw, 'Screen1', nextBky)
```

### Parse and serialise BKY manually

```typescript
import { parseBky, serializeBky } from 'aia-kit/bky'

const ast = parseBky(screen.bky)          // BKY XML string → BlockAst
const xml = serializeBky(ast)             // BlockAst → BKY XML string
```

---

## Working with components

Use `ScmDocument` for public SCM component-tree editing. Build a `ModelProject` when you need platform-enriched component descriptors.

```typescript
import { ScmDocument } from 'aia-kit/scm'

const document = ScmDocument.parse(screen.scm)

// Find by UID
const btn = document.findComponentByUid('some-uid-string')

// Find all components of a type
const labels = document.getComponentsByType('com.google.appinventor.components.runtime.Label')
```

---

## Structural mutations

All mutation functions return `MutationResult` — a new `AiaProject` plus any diagnostics. The input project is never mutated.

### Screens

```typescript
import { addScreen, removeScreen } from 'aia-kit/aia'

const settingsScreen = {
  name: 'Settings',
  scm: '{"Properties":{"$Name":"Settings","$Type":"Form","Uuid":"0","$Components":[]}}',
  bky: '<xml xmlns="https://developers.google.com/blockly/xml"></xml>',
  yail: null,
}

const { project: withNew } = addScreen(raw, settingsScreen)
const { project: without } = removeScreen(raw, 'OldScreen')
```

### Components

```typescript
import { replaceScreenScm } from 'aia-kit/aia'
import { ScmDocument } from 'aia-kit/scm'

const newComponent = {
  name: 'MyButton',
  type: 'com.google.appinventor.components.runtime.Button',
  uid: crypto.randomUUID(),
  properties: { Text: 'Click me' },
  children: [],
}

const screen = raw.screens.find(s => s.name === 'Screen1')!
const document = ScmDocument.parse(screen.scm)
const diagnostics = document.addComponent('parent-uid', newComponent)
const { project: withBtn } = replaceScreenScm(raw, 'Screen1', document.serialize())
```

### Assets and extensions

```typescript
import { addAsset, addExtension, removeAsset, removeExtension } from 'aia-kit/aia'
import { readAix } from 'aia-kit/aix'

const asset = {
  name: 'logo.png',
  type: 'image/png',
  sizeBytes: logoBytes.byteLength,
  data: async () => logoBytes,
}

const { project: withAsset } = addAsset(raw, asset)
const { project: withoutAsset } = removeAsset(raw, 'old-logo.png')

const aix = await readAix(aixBlob)
const { project: withExt } = addExtension(raw, aix)
const { project: withoutExt } = removeExtension(raw, 'com.example.MyExtension')
```

---

## Analysis

### Run the built-in diagnostic pass

```typescript
import { diagnose } from 'aia-kit/analysis'

const diagnostics = diagnose(raw, env)
```

### Diff two projects

```typescript
import { diffProjects } from 'aia-kit/analysis'

const diff = diffProjects(projectA, projectB)
// diff.screensOnlyInA, diff.screensOnlyInB, diff.screensDiffering, ...
```

### Find unused assets and extensions

```typescript
import { findAssetReferences, findUnusedAssets, findUnusedExtensions } from 'aia-kit/analysis'

const unusedAssets = findUnusedAssets(model)
const unusedExts = findUnusedExtensions(model)

const refs = findAssetReferences(model)
// refs: AssetReference[] — where each asset is referenced (property or block_xml)
```

### Block analysis

```typescript
import {
  analyzeComplexity,
  analyzeVariables,
  buildNavGraph,
  exportBlockSummary,
  findDeadBlocks,
} from 'aia-kit/analysis'
import { parseBky } from 'aia-kit/bky'

const ast = parseBky(model.screens[0].source.bky)

const vars = analyzeVariables(ast)
// vars.declared, vars.referenced

const summary = exportBlockSummary(ast)
// summary.topLevelCount, summary.totalBlocks, summary.blocksByType

const complexity = analyzeComplexity(model)
// complexity.screens[n].maxDepth, ...

const dead = findDeadBlocks(model)
// dead: DeadBlock[] — top-level blocks that are unreachable

const nav = buildNavGraph(model)
// nav.nodes (screen names), nav.edges (open_another_screen calls)
```

---

## Generating YAIL

YAIL is the Scheme-like intermediate language App Inventor uses at runtime. Most consumers won't need this, but it's available:

```typescript
import { readAia, writeAia } from 'aia-kit/aia'
import { YailEmitter } from 'aia-kit/yail'
import { getEnvironmentFor, Platform } from 'aia-kit/environment'
import { buildModel } from 'aia-kit/model'

const env = await getEnvironmentFor(Platform.KodularCreator)
const raw = await readAia(blob)
const model = buildModel(raw, env)
const yail = YailEmitter.for(model)

// Attach YAIL to each screen before writing
const screensWithYail = model.source.screens.map(screen => ({
  ...screen,
  yail: yail.emitScreen(screen.name),
}))
```

`writeAia(model, { withYail: true })` uses `YailEmitter` internally, so manual generation is only needed if you want to inspect or override the output.

---

## Writing back to AIA

```typescript
import { writeAia } from 'aia-kit/aia'

// Pass the raw AiaProject (mutations return AiaProject, not ModelProject)
const outputBlob = await writeAia(updatedRaw)
```

If you want `writeAia` to emit missing YAIL from model-space semantics, pass a `ModelProject`:

```typescript
const outputBlob = await writeAia(modelProject, { withYail: true })
```

### Serialising `project.properties` standalone

```typescript
import { parseProjectProperties, serializeProjectProperties } from 'aia-kit/project-properties'

const text = serializeProjectProperties(raw.properties)   // → key=value string
const props = parseProjectProperties({
  main: 'appinventor.ai_user.MyApp.Screen1',
  name: 'MyApp',
  versioncode: '1',
  versionname: '1.0',
})
```

---

## Error handling

Hard failures throw; data-level project problems are reported as diagnostics after model building.

```typescript
try {
  const raw = await readAia(blob)
} catch (e) {
  // Bad ZIPs, missing required archive entries, and malformed archive contents throw.
  // Data-level project problems are reported as diagnostics after buildModel().
}
```

Data-level project problems are reported as diagnostics, so ordinary invalid components or properties do not need exception handling.
