# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is `aia-kit`, a TypeScript library for reading, parsing, editing, and writing AIA/AIX/AIS files (App Inventor project files). The library is designed to work with App Inventor-based platforms, particularly Kodular Creator.

**Status:** Currently on the `v2-rewrite` branch, undergoing a complete architectural redesign. See [v2 Design Spec](docs/superpowers/specs/2026-05-01-aia-kit-v2-design.md), [M1 Plan](docs/superpowers/plans/2026-05-02-aia-kit-v2-m1-core-pipeline.md), and [M2a Plan](docs/superpowers/plans/2026-05-02-aia-kit-v2-m2a-structural-mutations.md) for details.

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
| Glossary and naming | [docs/ubiquitous-language.md](docs/ubiquitous-language.md) |

## Common Commands

### Build and Development
- `pnpm build` - Compiles TypeScript to JavaScript in the `dist/` directory
- `pnpm test` - Runs the test suite using Vitest
- `pnpm typecheck` - Type-checks the TypeScript code without emitting files

### Testing
- Tests are located in `test/` directory
- Test files use the `.test.ts` extension
- Uses Vitest as the testing framework
- Test fixtures are in `test/fixtures/`

## Architecture

### Design Philosophy

v2 is built on three core principles:

1. **Plain immutable data types + pure functions** — No behaviour buried in classes. Structural operations use raw types; platform-aware operations take an explicit `Environment`.
2. **Two-layer type system** — Raw layer (`Aia*` / `Aix*`) faithful to file format, model layer (`Model*`) enriched with descriptors and diagnostics.
3. **First-class diagnostics** — All data-level problems surface as `Diagnostic[]`; throws reserved for hard IO failures. Every mutation returns `MutationResult`.

### Core Modules

**Raw Data Layer** (`src/core/types.ts`):
- `AiaProject`, `AiaScreen`, `AiaAsset` — faithful file-format representation
- `AiaComponent` — raw SCM component tree, properties unvalidated
- `AiaExtension` — extension metadata + lazy asset/binary loading

**Model Layer** (`src/core/model.ts`):
- `ModelProject`, `ModelScreen`, `ModelComponent` — environment-enriched object model
- `ComponentDescriptor` — metadata from environment (properties, events, methods)
- `ComponentProperty` — typed property with validation state

**Core Infrastructure**:
- **Environment** (`src/core/environment.ts`): Represents target platform (Kodular, MIT AI2), holds component descriptors
- **Diagnostics** (`src/core/diagnostics.ts`): `Diagnostic` type, severity levels, diagnostic codes, `mergeReports` utility
- **Errors** (`src/core/errors.ts`): Error hierarchy — `AiaKitError`, `AiaParseError`, `AiaZipError`, `AiaStructureError`, `AiaWriteError`

**Specialised Parsers** (internal, not exported):
- **BKY** (`src/blocks/bky-parser.ts`, `src/blocks/bky-serializer.ts`): `parseBky` / `serializeBky` — XML ↔ BlockAst
- **SCM** (`src/components/scm-parser.ts`, `src/components/scm-serializer.ts`): `parseScm` / `serializeScm` — SCM ↔ component tree

**Public Lens APIs**:
- **Block Lens** (`src/blocks/lens.ts`): `queryBlocks`, `updateBlocks`, `updateAllScreenBlocks`, `parseBlocks`, `serializeBlocks`
- **Component Tree** (`src/components/tree.ts`): `getParent`, `findComponent`, `getComponentsByType`, `getComponentPath`

### Key Files

**Entry point:**
- `src/index.ts` — Public v2 API exports

**Core pipeline:**
- `src/parse.ts` — `parseAia()`, `parseAix()`, `parseAndResolve()`
- `src/resolve.ts` — Pure `resolve()` function (raw → model)
- `src/write.ts` — `writeAia()`

**Component definitions:**
- `environments/kodular-creator/simple_components.json` — Kodular components
- `environments/mit-app-inventor/simple_components.json` — MIT AI2 components

### Pipeline Flow

1. **Parse** (`parseAia`): Extract ZIP, deserialise raw `AiaProject` — no environment needed
2. **Resolve** (`resolve`): Transform raw → model using `Environment`; emit diagnostics
3. **Query/Mutate**: Use block lens and component tree utilities on model layer
4. **Write** (`writeAia`): Serialise model back to AIA ZIP

Or use `parseAndResolve` for single-step parse + resolve.

### Example Usage

```typescript
const environment = await Environment.kodularCreator();
const aiaBlob = /* ... */;
const { project, diagnostics } = await parseAndResolve(aiaBlob, environment);

// Query blocks
const blocks = queryBlocks(project.screens[0].form);

// Update and write back
const updated = { ...project, screens: [...project.screens] };
const aiaOut = await writeAia(updated);
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