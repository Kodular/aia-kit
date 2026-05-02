# aia-kit

TypeScript library for reading, parsing, editing, and writing AIA/AIX/AIS files — the project formats used by [App Inventor](https://appinventor.mit.edu)-based platforms such as [Kodular](https://kodular.io).

## Installation

```sh
npm install aia-kit
# or
pnpm add aia-kit
```

## Quick start

```typescript
import { Environment, parseAndResolve, updateBlocks, writeAia } from 'aia-kit'

// 1. Load a platform environment (Kodular or MIT App Inventor)
const env = await Environment.kodularCreator()

// 2. Parse and resolve an AIA file
const blob = /* Blob from file input, fetch, or fs.readFile */
const { project, diagnostics } = await parseAndResolve(blob, env)

// 3. Inspect
console.log(project.source.name)             // project name
console.log(project.screens.map(s => s.name)) // screen names

// 4. Mutate (returns a new AiaProject — nothing is mutated in place)
const { project: updated } = updateBlocks(project.source, 'Screen1', ast => ({
  ...ast,
  blocks: ast.blocks.filter(b => !b.disabled),
}))

// 5. Write back to AIA
const output = await writeAia(updated)
```

## Core concepts

**Two-stage pipeline** — `parseAia` reads the ZIP and produces a raw `AiaProject`; `resolve` enriches it into a `ModelProject` using a platform `Environment`. You can stop at the raw layer if you only need properties, screen names, or assets.

**Immutable data** — every mutation function returns a new object. The original is never modified.

**Diagnostics over throws** — data-level problems (unknown components, invalid properties) surface as `Diagnostic[]`. Throws are reserved for hard I/O failures (bad ZIP, missing required entries).

## Supported platforms

| Platform | Factory |
|----------|---------|
| Kodular Creator | `Environment.kodularCreator()` |
| MIT App Inventor | `Environment.mitAppInventor()` |

Extensions (`.aix`) can be loaded with `parseAix` and added to an environment via `env.withExtension(aix)`.

## What you can do

| Area | Functions |
|------|-----------|
| **Parse** | `parseAia`, `parseAix`, `parseAndResolve`, `parseProjectProperties` |
| **Resolve** | `resolve` |
| **Write** | `writeAia`, `serializeProperties` |
| **Blocks** | `queryBlocks`, `updateBlocks`, `updateAllScreenBlocks`, `parseBlocks`, `serializeBlocks` |
| **Component tree** | `findComponentByUid`, `getComponentsByType`, `getParentComponent`, `getComponentPathByUid` |
| **Screens** | `addScreen`, `removeScreen`, `cloneScreen` |
| **Components** | `addComponent`, `removeComponent`, `updatePropertyWhere` |
| **Assets** | `addAsset`, `removeAsset` |
| **Extensions** | `addExtension`, `removeExtension` |
| **Projects** | `mergeProjects` |
| **Analysis** | `diagnose`, `diffProjects`, `findUnusedAssets`, `findUnusedExtensions`, `analyzeVariables`, `analyzeComplexity`, `findDeadBlocks`, `buildNavGraph` |
| **YAIL** | `createYailGenerator` |

## Documentation

- [Usage guide](docs/usage.md) — walkthrough with examples for every API area
- [API reference](docs/api.md) — full type signatures and function descriptions
- [File format reference](docs/file-formats.md) — AIA, AIX, SCM, BKY, YAIL internals

---

Copyright (c) 2023–2026 Junnovate, LLC
