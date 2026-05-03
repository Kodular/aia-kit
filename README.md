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
import { readAia, replaceScreenBky, writeAia } from 'aia-kit/aia'
import { removeDisabledBlocks, parseBky, serializeBky } from 'aia-kit/bky'
import { getEnvironmentFor, Platform } from 'aia-kit/environment'
import { buildModel } from 'aia-kit/model'

// 1. Load a platform environment (Kodular or MIT App Inventor)
const env = await getEnvironmentFor(Platform.KodularCreator)

// 2. Read and model an AIA file
const blob = /* Blob from file input, fetch, or fs.readFile */
const raw = await readAia(blob)
const project = buildModel(raw, env)
const { diagnostics } = project

// 3. Inspect
console.log(project.source.name)             // project name
console.log(project.screens.map(s => s.name)) // screen names

// 4. Mutate (returns a new AiaProject — nothing is mutated in place)
const screen = project.source.screens.find(s => s.name === 'Screen1')!
const nextBky = serializeBky(removeDisabledBlocks(parseBky(screen.bky)))
const { project: updated } = replaceScreenBky(project.source, 'Screen1', nextBky)

// 5. Write back to AIA
const output = await writeAia(updated)
```

## Core concepts

**Two-stage pipeline** — `readAia` reads the ZIP and produces a raw `AiaProject`; `buildModel` enriches it into a `ModelProject` using a platform `Environment`. You can stop at the raw layer if you only need properties, screen names, or assets.

**Immutable data** — every mutation function returns a new object. The original is never modified.

**Diagnostics over throws** — data-level problems (unknown components, invalid properties) surface as `Diagnostic[]`. Throws are reserved for hard I/O failures (bad ZIP, missing required entries).

## Supported platforms

| Platform | Factory |
|----------|---------|
| Kodular Creator | `getEnvironmentFor(Platform.KodularCreator)` |
| MIT App Inventor | `getEnvironmentFor(Platform.MitAppInventor)` |

Extensions (`.aix`) can be loaded with `readAix`; project-bundled extension descriptors are folded into the effective model registry by `buildModel`.

## What you can do

| Area | Functions |
|------|-----------|
| **AIA archives** | `readAia`, `writeAia`, `getScreen`, `replaceScreen`, `replaceScreenScm`, `replaceScreenBky` |
| **AIX archives** | `readAix` |
| **Model building** | `buildModel` |
| **Environments** | `getEnvironmentFor`, `createEnvironment`, `Platform` |
| **Project properties** | `parseProjectProperties`, `serializeProjectProperties` |
| **Blocks** | `parseBky`, `serializeBky`, `removeDisabledBlocks`, `renameComponentReferences` |
| **SCM components** | `ScmDocument` |
| **Screens** | `addScreen`, `removeScreen` |
| **Assets** | `addAsset`, `removeAsset` |
| **Extensions** | `addExtension`, `removeExtension` |
| **Analysis** | `diagnose`, `diffProjects`, `findUnusedAssets`, `findUnusedExtensions`, `analyzeVariables`, `analyzeComplexity`, `findDeadBlocks`, `buildNavGraph` |
| **YAIL** | `createYailGenerator`, `YailEmitter` |

## Documentation

- [Usage guide](docs/usage.md) — walkthrough with examples for every API area
- [API reference](docs/api.md) — full type signatures and function descriptions
- [File format reference](docs/file-formats.md) — AIA, AIX, SCM, BKY, YAIL internals

---

Copyright (c) 2023–2026 Junnovate, LLC
