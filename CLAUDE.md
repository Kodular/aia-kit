# CLAUDE.md

## Project Overview

`aia-kit` — TypeScript library to read, inspect, edit, check and write App Inventor / Kodular projects (`.aia`) and extensions (`.aix`). Browser + Node, Blob-based.

v2 is a ground-up redesign and is not published yet (latest published: 1.1.2). There is no backwards compatibility with v1.

## Commands

Tool versions come from `mise.toml` (`mise install`).

```
pnpm check       # typecheck + lint + fmt:check + test
pnpm test        # Vitest
pnpm typecheck   # tsc --noEmit (TypeScript 7)
pnpm lint        # oxlint
pnpm fmt         # oxfmt
pnpm build       # tsdown → dist/
```

Tests are colocated with source (`src/**/*.test.ts`). Shared fixtures and builders: `src/test-helpers.ts`. Real archives: `test-fixtures/`.

## Design rules

1. **Model the domain, not the files.** The API speaks in projects, screens, components, blocks, assets, extensions. SCM/BKY/properties are codecs under `src/formats/`.
2. **Plain immutable data + pure functions.** No classes except errors. Every type in `src/types.ts` is `readonly`. Edits return a new `Project` and share untouched parts; an edit that changes nothing returns the same object.
3. **One model.** There is no separate "enriched" project. Anything that needs descriptors is a function of `(project, platform)`.
4. **Edits keep cross-format invariants** (component names ↔ blocks, screen name ↔ form name ↔ `main`). Add new edits under `src/edit/`; do not make callers patch blocks themselves.
5. **Lossless.** Parsers keep what they do not understand (`extra`, `meta`, `otherFiles`). Parsed values are frozen and their source text is remembered in a `WeakMap`, so unchanged parts serialize to their original bytes. The fixture test in `src/archive/archive.test.ts` enforces byte-exact round-trips.
6. **Three failure channels, no others.** Unusable input → throw `ArchiveError` / `ParseError`. Impossible edit → throw `NotFoundError` / `ConflictError` / `InvalidOperationError`. Findings about data → return `Problem[]` (discriminated on `code`).
7. **Async only at the ZIP boundary.**

## Layout

```
src/
  index.ts            aia-kit            — archives, types, queries, edits, check, errors
  platforms/          aia-kit/platforms  — loadPlatform, definePlatform, lookupComponent; data/*.json
  analysis/           aia-kit/analysis   — diff, unused assets/extensions, block reports
  formats/            aia-kit/formats    — scm, bky, properties, descriptors codecs
  archive/            readAia, readAix, writeAia, writeAix (zip.js)
  edit/               screens, components, blocks, assets, extensions, properties, merge
  query.ts            find*/walk*/componentReference
  check.ts            check(project, platform?) → Problem[]
  types.ts  errors.ts  problems.ts
  internal/           helpers not exported from any entry point
```

Not implemented: YAIL generation (v1 had a generator; see `git show main:src/generators/yail`). `writeAia` only preserves the original `.yail` of unchanged screens.

## Documentation

| Doc | Purpose |
|-----|---------|
| [docs/usage.md](docs/usage.md) | Guide with examples for every API area |
| [docs/api.md](docs/api.md) | API reference |
| [docs/file-formats.md](docs/file-formats.md) | Hub for the format pages |
| [docs/ubiquitous-language.md](docs/ubiquitous-language.md) | Glossary |

Format pages: [AIA](docs/aia.md) · [AIX](docs/aix.md) · [AIS](docs/ais.md) · [SCM](docs/scm.md) · [BKY](docs/bky.md) · [YAIL](docs/yail.md) · [project.properties](docs/project-properties.md) · [simple_components.json](docs/simple-components-json.md)

## Stack

ES modules · Node 26 + pnpm 12 via mise · TypeScript 7 (`isolatedDeclarations`, `erasableSyntaxOnly`, `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`) · tsdown · Vitest · oxlint · oxfmt · `@zip.js/zip.js` · `@xmldom/xmldom`
