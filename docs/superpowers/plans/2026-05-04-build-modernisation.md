# Build Modernisation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the raw `tsc` build with `tsdown` (rolldown-based), colocate unit tests next to source files, move fixtures to `test-fixtures/`, and make the library browser-compatible.

**Architecture:** `tsdown` becomes the single build tool — it bundles each subpath entry point to `dist/`, inlines the environment JSON files, and emits `.d.ts` declarations. `tsc` is kept only for `typecheck` (`--noEmit`). All `*.test.ts` files move from `test/<module>/` into the matching `src/<module>/`, `test/helpers.ts` becomes `src/test-helpers.ts`, and `test/fixtures/` becomes the root-level `test-fixtures/` directory.

**Tech Stack:** tsdown 0.21, rolldown, Vitest, TypeScript

---

## File Map

### Created
- `tsdown.config.ts` — tsdown build configuration (entry points, externals, DTS)

### Modified
- `package.json` — build script, exports map (`dist/src/` → `dist/`), `files`, `types`, `module`, add `tsdown` devDep
- `tsconfig.json` — `module`/`moduleResolution` → `"preserve"`/`"bundler"`, add `noEmit: true`, update `include` to `src/**/*` only
- `vitest.config.ts` — `include` pattern → `src/**/*.test.ts`

### Renamed / moved (directory)
- `test/fixtures/` → `test-fixtures/` (root level)

### Moved (test files) — `test/` → `src/`
| Old path | New path |
|---|---|
| `test/helpers.ts` | `src/test-helpers.ts` |
| `test/diagnostics.test.ts` | `src/diagnostics.test.ts` |
| `test/errors.test.ts` | `src/errors.test.ts` |
| `test/index.test.ts` | `src/index.test.ts` |
| `test/aia/aia.test.ts` | `src/aia/aia.test.ts` |
| `test/aia/mutations.test.ts` | `src/aia/mutations.test.ts` |
| `test/aia/round-trip.test.ts` | `src/aia/round-trip.test.ts` |
| `test/ais/ais.test.ts` | `src/ais/ais.test.ts` |
| `test/aix/aix.test.ts` | `src/aix/aix.test.ts` |
| `test/analysis/block-reports.test.ts` | `src/analysis/block-reports.test.ts` |
| `test/analysis/cross-cutting.test.ts` | `src/analysis/cross-cutting.test.ts` |
| `test/analysis/diagnose.test.ts` | `src/analysis/diagnose.test.ts` |
| `test/analysis/project-diff.test.ts` | `src/analysis/project-diff.test.ts` |
| `test/analysis/unused.test.ts` | `src/analysis/unused.test.ts` |
| `test/bky/index.test.ts` | `src/bky/index.test.ts` |
| `test/bky/parse.test.ts` | `src/bky/parse.test.ts` |
| `test/component-descriptor/index.test.ts` | `src/component-descriptor/index.test.ts` |
| `test/component-descriptor/registries.test.ts` | `src/component-descriptor/registries.test.ts` |
| `test/environment/index.test.ts` | `src/environment/index.test.ts` |
| `test/model/index.test.ts` | `src/model/index.test.ts` |
| `test/model/tree.test.ts` | `src/model/tree.test.ts` |
| `test/project-properties/index.test.ts` | `src/project-properties/index.test.ts` |
| `test/scm/index.test.ts` | `src/scm/index.test.ts` |
| `test/scm/parse.test.ts` | `src/scm/parse.test.ts` |
| `test/scm/serialize.test.ts` | `src/scm/serialize.test.ts` |
| `test/utils/block-types.test.ts` | `src/utils/block-types.test.ts` |
| `test/utils/component-tree.test.ts` | `src/utils/component-tree.test.ts` |
| `test/utils/memo-async.test.ts` | `src/utils/memo-async.test.ts` |
| `test/utils/naming.test.ts` | `src/utils/naming.test.ts` |
| `test/utils/package-names.test.ts` | `src/utils/package-names.test.ts` |
| `test/yail/block-emit.test.ts` | `src/yail/block-emit.test.ts` |
| `test/yail/component-emit.test.ts` | `src/yail/component-emit.test.ts` |
| `test/yail/emit.test.ts` | `src/yail/emit.test.ts` |
| `test/yail/index.test.ts` | `src/yail/index.test.ts` |

### Deleted
- `test/` directory (empty after moves)

### Updated — CLAUDE.md
- `test/` layout description updated to reflect `src/` colocation and `test-fixtures/`

---

## Task 1: Install tsdown and create `tsdown.config.ts`

**Files:**
- Create: `tsdown.config.ts`
- Modify: `package.json`

- [ ] **Step 1: Install tsdown**

```bash
pnpm add -D tsdown
```

Expected: tsdown 0.21.x added to `devDependencies`.

- [ ] **Step 2: Create `tsdown.config.ts`**

```ts
import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: {
    'index':                     'src/index.ts',
    'aia/index':                 'src/aia/index.ts',
    'ais/index':                 'src/ais/index.ts',
    'aix/index':                 'src/aix/index.ts',
    'analysis/index':            'src/analysis/index.ts',
    'bky/index':                 'src/bky/index.ts',
    'component-descriptor/index':'src/component-descriptor/index.ts',
    'environment/index':         'src/environment/index.ts',
    'model/index':               'src/model/index.ts',
    'project-properties/index':  'src/project-properties/index.ts',
    'scm/index':                 'src/scm/index.ts',
    'yail/index':                'src/yail/index.ts',
  },
  outDir: 'dist',
  format: 'esm',
  dts: true,
  splitting: true,
  external: [
    '@zip.js/zip.js',
    '@xmldom/xmldom',
    'properties-file',
    'zod',
  ],
  alias: {
    '#/': new URL('./src/', import.meta.url).pathname,
  },
})
```

- [ ] **Step 3: Update `package.json` — build script and devDependency**

Change `"build"` script from:
```json
"build": "tsc && cp -r environments dist/"
```
to:
```json
"build": "tsdown"
```

- [ ] **Step 4: Run the build to verify it succeeds**

```bash
pnpm build
```

Expected: `dist/` contains `index.js`, `aia/index.js`, `environment/index.js`, etc. — all with `.d.ts` counterparts. No `dist/environments/` directory (JSON is bundled inline).

- [ ] **Step 5: Commit**

```bash
git add tsdown.config.ts package.json pnpm-lock.yaml
git commit -m "build: introduce tsdown as library bundler"
```

---

## Task 2: Update `package.json` exports, `files`, `types`, and `imports`

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Update `package.json`**

Replace the `module`, `exports`, `imports`, `types`, and `files` fields:

```json
{
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".":                        "./dist/index.js",
    "./aia":                    "./dist/aia/index.js",
    "./ais":                    "./dist/ais/index.js",
    "./aix":                    "./dist/aix/index.js",
    "./analysis":               "./dist/analysis/index.js",
    "./bky":                    "./dist/bky/index.js",
    "./component-descriptor":   "./dist/component-descriptor/index.js",
    "./environment":            "./dist/environment/index.js",
    "./model":                  "./dist/model/index.js",
    "./project-properties":     "./dist/project-properties/index.js",
    "./scm":                    "./dist/scm/index.js",
    "./yail":                   "./dist/yail/index.js"
  },
  "imports": {
    "#/*": {
      "types": "./src/*",
      "default": "./src/*"
    }
  },
  "files": [
    "dist"
  ]
}
```

Note: the `imports` `default` now points to `./src/*` unconditionally — bundled dist code has all `#/` references inlined, so runtime resolution is never needed. Vitest (which runs source directly) also uses `./src/*` already.

- [ ] **Step 2: Verify build output paths match exports**

```bash
ls dist/
ls dist/aia/
ls dist/environment/
```

Expected: each exports entry has a corresponding `.js` and `.d.ts` file in `dist/`.

- [ ] **Step 3: Commit**

```bash
git add package.json
git commit -m "build: update exports and files to point at dist/ (tsdown output)"
```

---

## Task 3: Update `tsconfig.json` for bundler mode

**Files:**
- Modify: `tsconfig.json`

- [ ] **Step 1: Replace `tsconfig.json`**

```json
{
  "compilerOptions": {
    "lib": ["ESNext", "DOM"],
    "types": ["node"],
    "target": "ESNext",
    "module": "Preserve",
    "moduleDetection": "force",
    "jsx": "react-jsx",
    "allowJs": true,
    "esModuleInterop": true,
    "isolatedModules": true,
    "resolveJsonModule": true,

    "moduleResolution": "Bundler",
    "verbatimModuleSyntax": true,

    "paths": {
      "#/*": ["./src/*"]
    },

    "strict": true,
    "skipLibCheck": true,
    "noFallthroughCasesInSwitch": true,

    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noPropertyAccessFromIndexSignature": false,

    "noEmit": true,
    "sourceMap": true,
    "declaration": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

Key changes from before:
- `"module": "NodeNext"` → `"module": "Preserve"` (bundler handles module format)
- `"moduleResolution": "nodenext"` → `"moduleResolution": "Bundler"`
- Added `"noEmit": true` (tsdown handles output, tsc is type-check only)
- Removed `"outDir": "dist"` (irrelevant with noEmit)
- `"include"` now lists only `src/**/*` — tests are excluded from type-checking via tsc (vitest handles test type resolution itself)

- [ ] **Step 2: Run typecheck to verify no errors**

```bash
pnpm typecheck
```

Expected: exits 0. If errors appear related to `.js` extensions on imports, they are pre-existing and not introduced by this change.

- [ ] **Step 3: Commit**

```bash
git add tsconfig.json
git commit -m "build: switch tsconfig to bundler moduleResolution, noEmit"
```

---

## Task 4: Rename `test/fixtures/` → `test-fixtures/`

**Files:**
- Rename directory: `test/fixtures/` → `test-fixtures/`

- [ ] **Step 1: Rename the directory**

```bash
mv test/fixtures test-fixtures
```

- [ ] **Step 2: Verify fixtures are intact**

```bash
ls test-fixtures/
```

Expected: `HelloPurr.aia  MoodRing.aia  MyToDoList.aia  SimpleChatbot.aia  SnapchatRemix.aia  SoundLibrary.aia  Test.aia  TranslateApp.aia`

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "test: rename test/fixtures/ to test-fixtures/"
```

---

## Task 5: Move `test/helpers.ts` → `src/test-helpers.ts`

**Files:**
- Move: `test/helpers.ts` → `src/test-helpers.ts`

The file has no relative imports of its own (it only uses `#/` aliases), so the content is unchanged — only the location changes.

- [ ] **Step 1: Copy the file to its new location**

```bash
cp test/helpers.ts src/test-helpers.ts
```

- [ ] **Step 2: Delete the original**

```bash
rm test/helpers.ts
```

- [ ] **Step 3: Commit (before updating imports — lets git track the rename)**

```bash
git add src/test-helpers.ts test/helpers.ts
git commit -m "test: move helpers.ts → src/test-helpers.ts"
```

---

## Task 6: Colocate root-level tests

Move `test/diagnostics.test.ts`, `test/errors.test.ts`, and `test/index.test.ts` to `src/`. These files use only `#/` imports — no relative import changes needed.

**Files:**
- Move: `test/diagnostics.test.ts` → `src/diagnostics.test.ts`
- Move: `test/errors.test.ts` → `src/errors.test.ts`
- Move: `test/index.test.ts` → `src/index.test.ts`

- [ ] **Step 1: Move the files**

```bash
mv test/diagnostics.test.ts src/diagnostics.test.ts
mv test/errors.test.ts src/errors.test.ts
mv test/index.test.ts src/index.test.ts
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "test: colocate root-level tests (diagnostics, errors, index) into src/"
```

---

## Task 7: Colocate `test/aia/` tests

**Files:**
- Move: `test/aia/aia.test.ts` → `src/aia/aia.test.ts`
- Move: `test/aia/mutations.test.ts` → `src/aia/mutations.test.ts`
- Move: `test/aia/round-trip.test.ts` → `src/aia/round-trip.test.ts`

Import changes required:
- `from '../helpers.js'` → `from '../test-helpers.js'` (in `aia.test.ts` and `mutations.test.ts`)
- `join(import.meta.dirname, '../fixtures')` → `join(import.meta.dirname, '../../test-fixtures')` (in `aia.test.ts` and `round-trip.test.ts`)

- [ ] **Step 1: Move files**

```bash
mv test/aia/aia.test.ts src/aia/aia.test.ts
mv test/aia/mutations.test.ts src/aia/mutations.test.ts
mv test/aia/round-trip.test.ts src/aia/round-trip.test.ts
rmdir test/aia
```

- [ ] **Step 2: Fix imports in `src/aia/aia.test.ts`**

Change:
```ts
import { makeMinimalProject, makeProjectProperties } from '../helpers.js'
// ...
const FIXTURES = join(import.meta.dirname, '../fixtures')
```
To:
```ts
import { makeMinimalProject, makeProjectProperties } from '../test-helpers.js'
// ...
const FIXTURES = join(import.meta.dirname, '../../test-fixtures')
```

- [ ] **Step 3: Fix imports in `src/aia/mutations.test.ts`**

Change:
```ts
import { makeProjectProperties } from '../helpers.js'
```
To:
```ts
import { makeProjectProperties } from '../test-helpers.js'
```

- [ ] **Step 4: Fix imports in `src/aia/round-trip.test.ts`**

Change:
```ts
const FIXTURES = join(import.meta.dirname, '../fixtures')
```
To:
```ts
const FIXTURES = join(import.meta.dirname, '../../test-fixtures')
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "test: colocate src/aia/ tests"
```

---

## Task 8: Colocate `test/ais/`, `test/aix/` tests

**Files:**
- Move: `test/ais/ais.test.ts` → `src/ais/ais.test.ts`
- Move: `test/aix/aix.test.ts` → `src/aix/aix.test.ts`

Import changes:
- `src/ais/ais.test.ts`: `join(import.meta.dirname, '../fixtures')` → `join(import.meta.dirname, '../../test-fixtures')`
- `src/aix/aix.test.ts`: no relative imports to fix

- [ ] **Step 1: Move files**

```bash
mv test/ais/ais.test.ts src/ais/ais.test.ts
mv test/aix/aix.test.ts src/aix/aix.test.ts
rmdir test/ais test/aix
```

- [ ] **Step 2: Fix fixtures path in `src/ais/ais.test.ts`**

Change:
```ts
const FIXTURES = join(import.meta.dirname, '../fixtures')
```
To:
```ts
const FIXTURES = join(import.meta.dirname, '../../test-fixtures')
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "test: colocate src/ais/, src/aix/ tests"
```

---

## Task 9: Colocate `test/analysis/` tests

**Files:**
- Move: `test/analysis/block-reports.test.ts` → `src/analysis/block-reports.test.ts`
- Move: `test/analysis/cross-cutting.test.ts` → `src/analysis/cross-cutting.test.ts`
- Move: `test/analysis/diagnose.test.ts` → `src/analysis/diagnose.test.ts`
- Move: `test/analysis/project-diff.test.ts` → `src/analysis/project-diff.test.ts`
- Move: `test/analysis/unused.test.ts` → `src/analysis/unused.test.ts`

Import changes — all five files import `from '../helpers.js'` → `from '../test-helpers.js'`. `block-reports.test.ts` has no helpers import.

- [ ] **Step 1: Move files**

```bash
mv test/analysis/block-reports.test.ts src/analysis/block-reports.test.ts
mv test/analysis/cross-cutting.test.ts src/analysis/cross-cutting.test.ts
mv test/analysis/diagnose.test.ts src/analysis/diagnose.test.ts
mv test/analysis/project-diff.test.ts src/analysis/project-diff.test.ts
mv test/analysis/unused.test.ts src/analysis/unused.test.ts
rmdir test/analysis
```

- [ ] **Step 2: Fix `../helpers.js` imports in all four affected files**

In each of `cross-cutting.test.ts`, `diagnose.test.ts`, `project-diff.test.ts`, `unused.test.ts`:

Change:
```ts
import { makeProjectProperties } from '../helpers.js'
```
To:
```ts
import { makeProjectProperties } from '../test-helpers.js'
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "test: colocate src/analysis/ tests"
```

---

## Task 10: Colocate `test/bky/`, `test/component-descriptor/`, `test/environment/` tests

No helpers or fixtures imports in any of these — pure `#/` imports only.

**Files:**
- Move: `test/bky/index.test.ts` → `src/bky/index.test.ts`
- Move: `test/bky/parse.test.ts` → `src/bky/parse.test.ts`
- Move: `test/component-descriptor/index.test.ts` → `src/component-descriptor/index.test.ts`
- Move: `test/component-descriptor/registries.test.ts` → `src/component-descriptor/registries.test.ts`
- Move: `test/environment/index.test.ts` → `src/environment/index.test.ts`

- [ ] **Step 1: Move files**

```bash
mv test/bky/index.test.ts src/bky/index.test.ts
mv test/bky/parse.test.ts src/bky/parse.test.ts
mv test/component-descriptor/index.test.ts src/component-descriptor/index.test.ts
mv test/component-descriptor/registries.test.ts src/component-descriptor/registries.test.ts
mv test/environment/index.test.ts src/environment/index.test.ts
rmdir test/bky test/component-descriptor test/environment
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "test: colocate src/bky/, src/component-descriptor/, src/environment/ tests"
```

---

## Task 11: Colocate `test/model/` tests

**Files:**
- Move: `test/model/index.test.ts` → `src/model/index.test.ts`
- Move: `test/model/tree.test.ts` → `src/model/tree.test.ts`

Import changes in `src/model/index.test.ts`:
- `from '../helpers.js'` → `from '../test-helpers.js'`
- `join(import.meta.dirname, '../fixtures')` → `join(import.meta.dirname, '../../test-fixtures')`

- [ ] **Step 1: Move files**

```bash
mv test/model/index.test.ts src/model/index.test.ts
mv test/model/tree.test.ts src/model/tree.test.ts
rmdir test/model
```

- [ ] **Step 2: Fix imports in `src/model/index.test.ts`**

Change:
```ts
import { makeDescriptor, makeExtension, makeProjectProperties } from '../helpers.js'
// ...
const FIXTURES = join(import.meta.dirname, '../fixtures')
```
To:
```ts
import { makeDescriptor, makeExtension, makeProjectProperties } from '../test-helpers.js'
// ...
const FIXTURES = join(import.meta.dirname, '../../test-fixtures')
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "test: colocate src/model/ tests"
```

---

## Task 12: Colocate `test/project-properties/`, `test/scm/` tests

No helpers or fixtures imports — pure `#/` imports.

**Files:**
- Move: `test/project-properties/index.test.ts` → `src/project-properties/index.test.ts`
- Move: `test/scm/index.test.ts` → `src/scm/index.test.ts`
- Move: `test/scm/parse.test.ts` → `src/scm/parse.test.ts`
- Move: `test/scm/serialize.test.ts` → `src/scm/serialize.test.ts`

- [ ] **Step 1: Move files**

```bash
mv test/project-properties/index.test.ts src/project-properties/index.test.ts
mv test/scm/index.test.ts src/scm/index.test.ts
mv test/scm/parse.test.ts src/scm/parse.test.ts
mv test/scm/serialize.test.ts src/scm/serialize.test.ts
rmdir test/project-properties test/scm
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "test: colocate src/project-properties/, src/scm/ tests"
```

---

## Task 13: Colocate `test/utils/` tests

**Files:**
- Move: `test/utils/block-types.test.ts` → `src/utils/block-types.test.ts`
- Move: `test/utils/component-tree.test.ts` → `src/utils/component-tree.test.ts`
- Move: `test/utils/memo-async.test.ts` → `src/utils/memo-async.test.ts`
- Move: `test/utils/naming.test.ts` → `src/utils/naming.test.ts`
- Move: `test/utils/package-names.test.ts` → `src/utils/package-names.test.ts`

Import changes:
- `component-tree.test.ts`: `from '../helpers.js'` → `from '../test-helpers.js'`
- `package-names.test.ts`: `from '../helpers.js'` → `from '../test-helpers.js'`

- [ ] **Step 1: Move files**

```bash
mv test/utils/block-types.test.ts src/utils/block-types.test.ts
mv test/utils/component-tree.test.ts src/utils/component-tree.test.ts
mv test/utils/memo-async.test.ts src/utils/memo-async.test.ts
mv test/utils/naming.test.ts src/utils/naming.test.ts
mv test/utils/package-names.test.ts src/utils/package-names.test.ts
rmdir test/utils
```

- [ ] **Step 2: Fix helpers imports**

In `src/utils/component-tree.test.ts`, change:
```ts
import { makeComponent } from '../helpers.js'
```
To:
```ts
import { makeComponent } from '../test-helpers.js'
```

In `src/utils/package-names.test.ts`, change:
```ts
import { makeProjectProperties } from '../helpers.js'
```
To:
```ts
import { makeProjectProperties } from '../test-helpers.js'
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "test: colocate src/utils/ tests"
```

---

## Task 14: Colocate `test/yail/` tests

**Files:**
- Move: `test/yail/block-emit.test.ts` → `src/yail/block-emit.test.ts`
- Move: `test/yail/component-emit.test.ts` → `src/yail/component-emit.test.ts`
- Move: `test/yail/emit.test.ts` → `src/yail/emit.test.ts`
- Move: `test/yail/index.test.ts` → `src/yail/index.test.ts`

Import changes:
- `component-emit.test.ts`: `from "../helpers.js"` → `from "../test-helpers.js"`
- `index.test.ts`: `from "../helpers.js"` → `from "../test-helpers.js"`

- [ ] **Step 1: Move files**

```bash
mv test/yail/block-emit.test.ts src/yail/block-emit.test.ts
mv test/yail/component-emit.test.ts src/yail/component-emit.test.ts
mv test/yail/emit.test.ts src/yail/emit.test.ts
mv test/yail/index.test.ts src/yail/index.test.ts
rmdir test/yail
```

- [ ] **Step 2: Fix helpers imports**

In `src/yail/component-emit.test.ts`, change:
```ts
import { makeProjectProperties } from "../helpers.js"
```
To:
```ts
import { makeProjectProperties } from "../test-helpers.js"
```

In `src/yail/index.test.ts`, change:
```ts
import { makeMinimalModelProject, makeProjectProperties } from "../helpers.js"
```
To:
```ts
import { makeMinimalModelProject, makeProjectProperties } from "../test-helpers.js"
```

- [ ] **Step 3: Remove now-empty `test/` directory**

```bash
rmdir test
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "test: colocate src/yail/ tests, remove empty test/ directory"
```

---

## Task 15: Update `vitest.config.ts`

**Files:**
- Modify: `vitest.config.ts`

- [ ] **Step 1: Update test `include` pattern**

Replace the entire file:

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '#/': './src/',
    },
  },
  test: {
    include: ['src/**/*.test.ts'],
    exclude: ['dist/**', 'node_modules/**'],
  },
})
```

- [ ] **Step 2: Run the full test suite**

```bash
pnpm test
```

Expected: all tests pass. If any fail due to fixture path or helpers import errors, revisit the affected test file — the path was likely missed in Tasks 7–14.

- [ ] **Step 3: Commit**

```bash
git add vitest.config.ts
git commit -m "test: update vitest include to src/**/*.test.ts"
```

---

## Task 16: Update CLAUDE.md

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Update the Testing section in `CLAUDE.md`**

Find the paragraph:
```
- Tests are located in `test/` directory, organized to mirror `src/` (e.g. `test/aia/`, `test/model/`); shared primitives (`diagnostics`, `errors`) tests live at `test/diagnostics.test.ts`, `test/errors.test.ts`
- Test files use the `.test.ts` extension
- Uses Vitest as the testing framework
- Test fixtures are in `test/fixtures/`
```

Replace with:
```
- Tests are colocated with source files in `src/` (e.g. `src/aia/aia.test.ts` beside `src/aia/index.ts`)
- Shared test utilities live in `src/test-helpers.ts`
- Test files use the `.test.ts` extension
- Uses Vitest as the testing framework
- Test fixtures (real AIA files) are in `test-fixtures/`
```

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md for colocated tests and test-fixtures/"
```

---

## Task 17: Final verification

- [ ] **Step 1: Clean dist and rebuild**

```bash
rm -rf dist && pnpm build
```

Expected: clean build, `dist/` populated with all entry points.

- [ ] **Step 2: Run full test suite**

```bash
pnpm test
```

Expected: all tests pass.

- [ ] **Step 3: Run typecheck**

```bash
pnpm typecheck
```

Expected: exits 0.

- [ ] **Step 4: Verify `dist/` has no test files and no separate `environments/` copy**

```bash
find dist -name "*.test.*"   # should be empty
find dist -name "environments" -type d   # should be empty
ls dist/environment/   # should have index.js and index.d.ts
```

- [ ] **Step 5: Smoke-check the environment bundle contains the JSON data**

```bash
grep -c "categoryString" dist/environment/index.js
```

Expected: a number > 0, confirming `simple_components.json` content is bundled inline.
