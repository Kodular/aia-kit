# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is `aia-kit`, a TypeScript toolkit for reading, inspecting, editing, analysing, and writing App Inventor-family project formats: AIA, AIS, AIX, SCM, BKY, YAIL, project properties, and component descriptor registries.

**Status:** On the `v2-rewrite` branch. The adopted API contract is [Composable API Design Spec](docs/superpowers/specs/2026-05-03-aia-kit-v2-composable-api-design.md) (**Status: Adopted**). The older [v2 Design Spec](docs/superpowers/specs/2026-05-01-aia-kit-v2-design.md) is superseded and retained only for historical milestone context.

## Library documentation

| Doc | Purpose |
|-----|---------|
| [docs/usage.md](docs/usage.md) | Usage guide — core pipeline, examples for every API area |
| [docs/api.md](docs/api.md) | Full API reference — all exported types and functions |
| [docs/superpowers/specs/2026-05-03-aia-kit-v2-composable-api-design.md](docs/superpowers/specs/2026-05-03-aia-kit-v2-composable-api-design.md) | Adopted v2 composable API contract |

## File format documentation

Start at the hub [**docs/file-formats.md**](docs/file-formats.md) — it links to all format pages.

| Topic | Doc |
|--------|-----|
| **AIA** (multi-screen project ZIP) | [docs/aia.md](docs/aia.md) |
| **AIX** (extension package ZIP) | [docs/aix.md](docs/aix.md) |
| **AIS** (single-screen export; AIA-shaped) | [docs/ais.md](docs/ais.md) |
| **SCM** (designer component tree) | [docs/scm.md](docs/scm.md) |
| **BKY** (Blockly XML) | [docs/bky.md](docs/bky.md) |
| **YAIL** (intermediate Scheme-like layer) | [docs/yail.md](docs/yail.md) |
| `project.properties` (AIA metadata key-value file) | [docs/project-properties.md](docs/project-properties.md) |
| `simple_components.json` (platform component registry) | [docs/simple-components-json.md](docs/simple-components-json.md) |
| Glossary and naming | [docs/ubiquitous-language.md](docs/ubiquitous-language.md) |

## Common Commands

### Build and Development
- `pnpm build` - Compiles TypeScript to JavaScript in the `dist/` directory
- `pnpm test` - Runs the test suite using Vitest
- `pnpm typecheck` - Type-checks the TypeScript code without emitting files

### Testing
- Tests are located in `test/` directory, organized to mirror `src/` (e.g. `test/aia/`, `test/model/`); shared primitives (`diagnostics`, `errors`) tests live at `test/diagnostics.test.ts`, `test/errors.test.ts`
- Test files use the `.test.ts` extension
- Uses Vitest as the testing framework
- Test fixtures are in `test/fixtures/`

## Architecture

### Design Philosophy

v2 is built as a composable toolkit, not a framework:

1. **Domain subpaths over root barrels** — Public imports should expose the boundary: `aia-kit/aia`, `aia-kit/scm`, `aia-kit/bky`, `aia-kit/model`, `aia-kit/environment`, etc. Avoid broad root-barrel APIs.
2. **Two-layer type system** — `AiaProject` is the data space/archive truth. `ModelProject` is the semantic model space built from `AiaProject + Environment`.
3. **No hidden environment or extension state** — `Environment` represents the base platform only. Project-installed extensions are composed into the effective `ModelProject.componentRegistry` during `buildModel`.
4. **Small classes only where they clarify a domain object** — `ScmDocument`, `YailEmitter`, and `ComponentRegistry` are accepted. Do not introduce a god `AiaProject` class or `BkyDocument`.
5. **First-class diagnostics** — Data-level problems surface as `Diagnostic[]`; throws are reserved for hard IO/construction failures.

### Core Modules

**Raw Data Layer** (`src/types.ts`):
- `AiaProject`, `AiaScreen`, `AiaAsset` — faithful file-format representation (`AiaProject.properties` is typed as `ProjectProperties` from `aia-kit/project-properties`)
- `AiaComponent` — raw SCM component tree, properties unvalidated
- `AiaExtension` — extension metadata + lazy asset/binary loading

**Model Layer** (`src/model/types.ts`, `buildModel` in `src/model/index.ts`):
- `ModelProject`, `ModelScreen`, `ModelComponent` — environment-enriched semantic model built by `buildModel`
- `ModelProject.componentRegistry` — effective immutable registry: base platform descriptors + project-installed extension descriptors
- `ComponentDescriptor` — metadata from environment (properties, events, methods)
- `ComponentProperty` — typed property with validation state

**Core Infrastructure**:
- **Environment**: Plain base-platform value object loaded via `getEnvironmentFor(Platform.KodularCreator | Platform.MitAppInventor)` or `createEnvironment`
- **ComponentRegistry**: Class-based immutable registry with `ComponentRegistry.of(...)`; use `MutableComponentRegistry` only for project-scoped extension add/remove assembly
- **Diagnostics** (`src/diagnostics.ts`): `Diagnostic` type, severity levels, diagnostic codes, `mergeReports` utility — exported from the small root `aia-kit` entry only (no dedicated subpath)
- **Errors** (`src/errors.ts`): Error hierarchy — `AiaKitError`, `AiaParseError`, `AiaZipError`, `AiaStructureError`, `AiaWriteError`

**Domain Modules (target API):**
- **AIA** (`aia-kit/aia`): `readAia`, `writeAia`, screen/asset/extension project-level operations
- **AIX/AIS** (`aia-kit/aix`, `aia-kit/ais`): archive/package helpers
- **SCM** (`aia-kit/scm`): `ScmDocument` is the public SCM editing API; low-level parse/serialize helpers may remain internal
- **BKY** (`aia-kit/bky`): function-first `parseBky` / `serializeBky` and independent AST transforms; no `BkyDocument`
- **YAIL** (`aia-kit/yail`): `YailEmitter.for(model).emitScreen(...)`
- **Model** (`aia-kit/model`): `buildModel(project, environment)`
- **Environment** (`aia-kit/environment`): `getEnvironmentFor`, `createEnvironment`, `Platform`
- **Component Descriptor** (`aia-kit/component-descriptor`): descriptor normalization and registry classes
- **Project properties** (`aia-kit/project-properties`): `ProjectProperties` type, `parseProjectProperties`, `serializeProjectProperties`

Do not add callback-style BKY lens APIs (`queryBlocks`, `updateBlocks`) to the target core surface. Prefer explicit parse-transform-serialize composition.

### Key Files

**Entry point:**
- Domain subpath barrels are the target public API. Keep the root `aia-kit` export absent or intentionally small; do not make it a broad barrel.

**Core pipeline:**
- `aia-kit/aia` — `readAia()`, `writeAia()`
- `aia-kit/aix` — `readAix()`
- `aia-kit/model` — `buildModel()` (renames/supersedes `resolve()`)
- `src/aia/write-archive.ts` — `writeAia()`

**Component definitions:**
- `environments/kodular-creator/simple_components.json` — Kodular components
- `environments/mit-app-inventor/simple_components.json` — MIT AI2 components

### Pipeline Flow

1. **Read** (`readAia`): Extract ZIP, deserialise raw `AiaProject` — no environment needed
2. **Build model** (`buildModel`): Transform raw project + base `Environment` into `ModelProject`; project extensions are folded into the effective component registry
3. **Edit/analyse by domain**: Use `ScmDocument` for SCM, function-first BKY transforms for BKY, `analysis` helpers for convenience reports
4. **Write** (`writeAia`): Serialise `AiaProject`; use `writeAia(model, { withYail: true })` to emit and embed YAIL

### Example Usage

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

## Development Notes

- ES modules (`"type": "module"` in package.json)
- TypeScript compiled to `dist/`
- Biome for linting and formatting
- **Core dependencies:**
  - `@zip.js/zip.js` — ZIP archive I/O
  - `@xmldom/xmldom` — BKY XML parsing
  - `properties-file` — project.properties parsing
- Works with Blob objects; supports local files and URLs

## Testing

- Test fixtures in `test/fixtures/` (real AIA files)
- Unit tests in `test/` organized by module
