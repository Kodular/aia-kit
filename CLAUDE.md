# CLAUDE.md

## Project Overview

`aia-kit` — TypeScript toolkit for reading, inspecting, editing, analysing, and writing App Inventor-family formats: AIA, AIS, AIX, SCM, BKY, YAIL, project properties, and component descriptor registries.

**Branch:** `v2-rewrite` — API contract is the [Composable API Design Spec](docs/superpowers/specs/2026-05-03-aia-kit-v2-composable-api-design.md) (Adopted). The older [v2 Design Spec](docs/superpowers/specs/2026-05-01-aia-kit-v2-design.md) is superseded/historical.

## Commands

```
pnpm build       # bundle with tsdown → dist/
pnpm test        # Vitest
pnpm typecheck   # tsc --noEmit only
```

Tests are colocated with source in `src/` (e.g. `src/aia/aia.test.ts`). Shared test utilities: `src/test-helpers.ts` (exports `FIXTURES` path + factory helpers). Real AIA fixtures: `test-fixtures/`.

## Documentation

| Doc | Purpose |
|-----|---------|
| [docs/usage.md](docs/usage.md) | Core pipeline, examples for every API area |
| [docs/api.md](docs/api.md) | Full API reference |
| [docs/superpowers/specs/2026-05-03-aia-kit-v2-composable-api-design.md](docs/superpowers/specs/2026-05-03-aia-kit-v2-composable-api-design.md) | Adopted v2 API contract |
| [docs/file-formats.md](docs/file-formats.md) | Hub linking all format pages |

File format pages: [AIA](docs/aia.md) · [AIX](docs/aix.md) · [AIS](docs/ais.md) · [SCM](docs/scm.md) · [BKY](docs/bky.md) · [YAIL](docs/yail.md) · [project.properties](docs/project-properties.md) · [simple_components.json](docs/simple-components-json.md) · [Glossary](docs/ubiquitous-language.md)

## Architecture

### Design Principles

1. **Domain subpaths over root barrels** — public API is `aia-kit/aia`, `aia-kit/scm`, etc. No broad root barrel.
2. **Two-layer type system** — `AiaProject` = archive/data truth. `ModelProject` = semantic model (`AiaProject + Environment`).
3. **No hidden state** — `Environment` is the base platform only. Extensions fold into `ModelProject.componentRegistry` during `buildModel`.
4. **Small classes only** — `ScmDocument`, `YailEmitter`, `ComponentRegistry` are fine. No god `AiaProject` class, no `BkyDocument`.
5. **First-class diagnostics** — data problems → `Diagnostic[]`. Throws reserved for hard IO/construction failures.

### Modules

**Raw data** (`src/types.ts`): `AiaProject`, `AiaScreen`, `AiaAsset`, `AiaComponent`, `AiaExtension`

**Model** (`src/model/`): `buildModel(project, env)` → `ModelProject` with enriched `componentRegistry`, `ModelScreen`, `ModelComponent`

**Infrastructure:**
- `Environment` — base-platform value object; load with `getEnvironmentFor(Platform.KodularCreator | Platform.MitAppInventor)` or `createEnvironment`
- `ComponentRegistry` — immutable; `ComponentRegistry.of(...)`; `MutableComponentRegistry` for assembly only
- `Diagnostics` (`src/diagnostics.ts`) — exported from root `aia-kit` only (no dedicated subpath)
- `Errors` (`src/errors.ts`) — `AiaKitError`, `AiaParseError`, `AiaZipError`, `AiaStructureError`, `AiaWriteError`

**Subpath APIs:**
- `aia-kit/aia` — `readAia`, `writeAia`, screen/asset/extension mutations
- `aia-kit/aix` / `aia-kit/ais` — archive/package helpers
- `aia-kit/scm` — `ScmDocument` (public SCM editing API)
- `aia-kit/bky` — `parseBky`, `serializeBky`, AST transforms; no `BkyDocument`; no `queryBlocks`/`updateBlocks`
- `aia-kit/yail` — `YailEmitter.for(model).emitScreen(...)`
- `aia-kit/model` — `buildModel`
- `aia-kit/environment` — `getEnvironmentFor`, `createEnvironment`, `Platform`
- `aia-kit/component-descriptor` — descriptor normalisation, registry classes
- `aia-kit/project-properties` — `ProjectProperties`, `parseProjectProperties`, `serializeProjectProperties`

**Component JSON:** `environments/kodular-creator/simple_components.json` · `environments/mit-app-inventor/simple_components.json`

### Pipeline

```
readAia(blob)                    → AiaProject   (no env needed)
buildModel(project, env)         → ModelProject (extensions folded into registry)
ScmDocument / parseBky / ...     → edit by domain
writeAia(model, {withYail:true}) → Blob         (YAIL embedded)
```

### Example

```typescript
import { readAia, writeAia, replaceScreenScm } from 'aia-kit/aia'
import { getEnvironmentFor, Platform } from 'aia-kit/environment'
import { buildModel } from 'aia-kit/model'
import { ScmDocument } from 'aia-kit/scm'

const project = await readAia(aiaBlob)
const env = await getEnvironmentFor(Platform.KodularCreator)

const screen = project.screens.find(s => s.name === 'Screen1')!
const scm = ScmDocument.parse(screen.scm)
scm.addComponent(parentUid, component)

const { project: updated } = replaceScreenScm(project, 'Screen1', scm.serialize())
const model = buildModel(updated, env)
const aiaOut = await writeAia(model, { withYail: true })
```

## Stack

ES modules · TypeScript → bundled by tsdown (rolldown) · Biome · `@zip.js/zip.js` · `@xmldom/xmldom` · `properties-file` · `zod` · Blob-based (browser + Node)
