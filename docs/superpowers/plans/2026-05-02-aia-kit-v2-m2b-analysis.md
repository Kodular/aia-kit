# aia-kit v2 — Milestone 2b: Analysis Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the **core analysis APIs** from the v2 design spec — project diff, unified diagnosis, unused inventory, asset reference discovery, block reports, complexity / dead-block / navigation graph — as pure functions with stable report types.

**Architecture:** New `src/analysis/` module: small files by concern, shared types in `types.ts`. Raw-level analysis (`diffProjects`) uses only `AiaProject`. Model-level functions take `ModelProject` (callers run `resolve` first). Block helpers take `BlockAst` or use `queryBlocks` internally where the API is model-scoped. No new npm dependencies. Reuse `parseScm`, `parseBlocks` / `queryBlocks`, `resolve`, `mergeReports`. **Out of scope for M2b:** `createYailGenerator` (M2c), `extractScreenTemplate` / `applyScreenTemplate`, migration APIs, `inferPermissions`, `checkSdkCompatibility`, `auditAccessibility`, `checkNamingConventions`, and export/interop (`toMermaid`, `componentTreeToMermaid`, `exportComponentInventory`, `projectToJson` / `projectFromJson`) — those belong to **M3** or later unless the design spec is revised.

**Tech Stack:** TypeScript, Vitest, existing `#/*` path aliases. Dist layout matches current package: `dist/src/...`.

---

## Scope Note

| In M2b | Deferred |
|--------|----------|
| `diffProjects`, `diagnose`, `findUnusedExtensions`, `findUnusedAssets`, `findAssetReferences`, `analyzeVariables`, `exportBlockSummary`, `analyzeComplexity`, `findDeadBlocks`, `buildNavGraph` | YAIL factory (M2c), screen templates (M3), platform migration, permission/SDK/a11y/naming analysis, Mermaid / JSON export |

---

## File Map

### Create (new)

| File | Responsibility |
|------|----------------|
| `src/analysis/types.ts` | Report interfaces: `ProjectDiff`, `VariableReport`, `BlockSummary`, `ComplexityReport`, `DeadBlock`, `NavGraph`, `AssetReference`, etc. |
| `src/analysis/project-diff.ts` | `diffProjects(a, b)` |
| `src/analysis/diagnose.ts` | `diagnose(project, env)` |
| `src/analysis/unused.ts` | `findUnusedExtensions`, `findUnusedAssets`, `findAssetReferences` |
| `src/analysis/block-reports.ts` | `analyzeVariables`, `exportBlockSummary` |
| `src/analysis/cross-cutting.ts` | `analyzeComplexity`, `findDeadBlocks`, `buildNavGraph` |
| `src/analysis/index.ts` | Re-exports + type re-exports |
| `test/analysis/project-diff.test.ts` | |
| `test/analysis/diagnose.test.ts` | |
| `test/analysis/unused.test.ts` | |
| `test/analysis/block-reports.test.ts` | |
| `test/analysis/cross-cutting.test.ts` | |

### Modify (existing)

| File | Change |
|------|--------|
| `package.json` | Add `"./analysis": "./dist/src/analysis/index.js"` to `exports` |
| `src/index.ts` | Add `// Analysis` re-export block |

---

## Shared test helpers (copy verbatim into each test file that needs them)

Keeps tests self-contained per M2a plan style.

```typescript
import type { AiaProject, AiaScreen, AiaAsset, AiaExtension } from '#/core/types.js'
import type { ModelProject } from '#/core/model.js'
import { Environment } from '#/core/environment.js'
import { resolve } from '#/resolve.js'

const EMPTY_SCM = `#|
$JSON
{"authURL":["aia-kit"],"YaVersion":"1","Source":"Form","Properties":{"$Name":"Screen1","$Type":"Form","Uuid":"root","Title":"Screen1","$Components":[]}}
|#`

const EMPTY_BKY = `<xml xmlns="https://developers.google.com/blockly/xml"></xml>`

function makeScreen(name: string, scm = EMPTY_SCM, bky = EMPTY_BKY): AiaScreen {
  return { name, scm, bky, yail: null }
}

function makeProject(overrides: Partial<AiaProject> = {}): AiaProject {
  return {
    _tag: 'AiaProject',
    name: 'Test',
    properties: {},
    screens: [makeScreen('Screen1')],
    assets: [],
    extensions: [],
    ...overrides,
  }
}

async function mitEnv(): Promise<Environment> {
  return Environment.mitAppInventor()
}
```

Adjust `makeProject` defaults per file if a test needs zero screens or multiple screens.

---

## Semantics (normative for implementers)

### `diffProjects`

- Compare screen **names**: only-in-A, only-in-B.
- For names in **both**, compare `scm === scm` and `bky === bky`; record booleans in `screensDiffering` (only include an entry if at least one of `scm` / `bky` is true).
- Assets: only-in-A / only-in-B by `name`. If same name appears in both but `sizeBytes` or `type` differs, add name to `assetsDiffering`.
- Extensions: compare by `packageName`; same for only-in-A / only-in-B.

### `diagnose`

1. `const model = resolve(project, env)`.
2. Start from `[...model.diagnostics]`.
3. For each screen in `project.screens`, call `parseBky(screen.bky)` inside try/catch; on throw, append a diagnostic with code `MALFORMED_BKY`, severity `error`, path `['screens', screen.name]`, message including the error text.
4. Return merged list (order: resolve diagnostics first, then per-screen BKY errors in screen order).

### `findUnusedExtensions`

- Build `usedTypes: Set<string>`: walk every screen’s SCM with `parseScm`, recursively collect each node’s `type`.
- For each `ext` in `model.source.extensions`, mark **used** if `ext.components.some(c => usedTypes.has(c.type))`.
- Unused = extensions not used. Empty `components[]` on an extension ⇒ treat as unused unless you also match `packageName` substring in property strings (optional enhancement; **not required for M2b**).

### `findUnusedAssets`

- For each asset, search **used** if `asset.name` appears as a substring of any screen’s `scm` or `bky`, OR any `project.properties` value, **case-sensitive** as App Inventor names usually are.
- Unused = not used.

### `findAssetReferences`

- Scan every `ModelComponent` property `value` and raw screen `bky` text; whenever `value.includes(asset.name)` for an asset in `model.source.assets`, emit `AssetReference` with path from model (`['screens', screenName, ...]`) and `kind: 'property'`.
- When `bky.includes(asset.name)` for the same asset, emit `kind: 'block_xml'` with path `['screens', screenName]` (dedupe same asset+screen+kind to one entry).

### `analyzeVariables`

- Walk entire `BlockAst` (all blocks via `values`, `statements`, `next`).
- **Declared:** blocks whose `type` is `global_declaration` → read field `NAME` (if present); `local_declaration_statement` / `local_declaration_expression` → field `NAME`; `procedures_defnoreturn` / `procedures_defreturn` → field `NAME`.
- **Referenced:** blocks whose `type` is `lexical_variable_get` or `lexical_variable_set` → field `VAR`.
- Return `{ declared: string[], referenced: string[] }` with unique names, stable sort order (`localeCompare`) for testability.

### `exportBlockSummary`

- `totalBlocks`: count of all nodes in forest.
- `topLevelCount`: `ast.blocks.length`.
- `blocksByType`: map `type` → count for every node.

### `analyzeComplexity`

- Per screen: `topLevelBlocks = ast.blocks.length`, `totalBlocks` = full count, `maxDepth` = max depth where root top-level block depth = 1, children in values/statements `+1`, `next` chain same depth as parent child (treat as sibling depth +0 or +1 — use **+0** for `next` so vertical chains don’t inflate depth; only **value/statement** nesting increments depth).

Clarification for implementers:

```text
depth(block) = 1 + max(depth children in values), max(depth children in statements), 0
// do not walk `next` for depth — use separate metric or ignore next for maxDepth
maxDepth(ast) = max over top-level roots of subtreeDepth(root)
subtreeDepth(b): 1 + max( subtreeDepth(value child), subtreeDepth(statement child) )  // recursive on single child blocks
// For `next` chain: same depth as first block in chain (stack of commands under one parent)
```

Simplest rule: **`maxDepth`** = maximum nesting of `value`/`statement` edges only; ignore `next` links for depth.

### `findDeadBlocks`

- **Hat blocks:** `type === 'event_handler'` OR `type.startsWith('when_')` OR `/^component_/.test(type) && type.includes('Click')` — minimum: include `event_handler` and any type containing `'event_'` (case-sensitive).
- From each **top-level** `ast.blocks[i]`, if it is a hat, BFS/DFS all reachable blocks via `next`, `values`, `statements`.
- Collect **all** block ids in the AST with a separate full walk.
- **Dead:** ids in full walk minus reachable-from-hats. Emit `DeadBlock` with screen name, block id, block type.
- If **no** hats in a screen, every block is dead (all unreachable from hats).

### `buildNavGraph`

- **`nodes`:** union of all screen names from `model.screens` plus any target screen names discovered in edges.
- **`edges`:** for each screen, parse BKY; walk all blocks; if `type` includes `openAnotherScreen` (case-insensitive contains) or equals `controls_openAnotherScreen` / `navigation_openAnotherScreen` (MIT naming varies — use **substring** `openAnotherScreen`), try read target from:
  - field `SCREEN` or `SCREENNAME`, else first string-like field; if still unknown, skip edge.
- `from` = current screen name, `to` = extracted target string trimmed.

---

## Task 0: Analysis types

**Files:**
- Create: `src/analysis/types.ts`

- [ ] **Step 0.1: Add `src/analysis/types.ts`**

```typescript
/**
 * Structured diff between two raw projects (screen names and registry sets).
 */
export interface ProjectDiff {
  screensOnlyInA: string[]
  screensOnlyInB: string[]
  /** Screens whose name exists in both projects but content differs. */
  screensDiffering: Array<{ name: string; scm: boolean; bky: boolean }>
  assetsOnlyInA: string[]
  assetsOnlyInB: string[]
  /** Same asset name in both but `type` or `sizeBytes` differs. */
  assetsDiffering: string[]
  extensionsOnlyInA: string[]
  extensionsOnlyInB: string[]
}

export interface VariableReport {
  /** Names from declaration-style blocks (globals, locals, procedures). */
  declared: string[]
  /** Names from lexical variable get/set. */
  referenced: string[]
}

export interface BlockSummary {
  topLevelCount: number
  totalBlocks: number
  blocksByType: Record<string, number>
}

export interface ScreenComplexity {
  screenName: string
  topLevelBlocks: number
  totalBlocks: number
  maxDepth: number
}

export interface ComplexityReport {
  screens: ScreenComplexity[]
}

export interface DeadBlock {
  screenName: string
  blockId: string
  blockType: string
}

export interface NavEdge {
  from: string
  to: string
}

export interface NavGraph {
  nodes: string[]
  edges: NavEdge[]
}

export type AssetReferenceKind = 'property' | 'block_xml'

export interface AssetReference {
  assetName: string
  kind: AssetReferenceKind
  path: string[]
}
```

- [ ] **Step 0.2: Commit**

```bash
git add src/analysis/types.ts
git commit -m "feat(v2): add analysis report types (M2b)"
```

---

## Task 1: `diffProjects`

**Files:**
- Create: `src/analysis/project-diff.ts`
- Create: `test/analysis/project-diff.test.ts`

- [ ] **Step 1.1: Write failing test**

```typescript
import { describe, it, expect } from 'vitest'
import { diffProjects } from '#/analysis/project-diff.js'
import type { AiaProject, AiaScreen } from '#/core/types.js'

function screen(n: string, scm = '', bky = ''): AiaScreen {
  return { name: n, scm, bky, yail: null }
}

function proj(screens: AiaScreen[], assets: { name: string; type: string; sizeBytes: number }[] = [], extPkgs: string[] = []): AiaProject {
  return {
    _tag: 'AiaProject',
    name: 'P',
    properties: {},
    screens,
    assets: assets.map(a => ({
      ...a,
      data: async () => new Uint8Array(),
    })),
    extensions: extPkgs.map(pkg => ({
      packageName: pkg,
      version: 1,
      minSdk: 7,
      components: [],
      manifest: { packageName: pkg, version: 1, minSdk: 7, buildVersion: '1', permissions: [] },
      loadClasses: async () => new Uint8Array(),
      loadAssets: async () => [],
    })),
  }
}

describe('diffProjects', () => {
  it('detects screens only in A or B', () => {
    const a = proj([screen('S1')])
    const b = proj([screen('S2')])
    const d = diffProjects(a, b)
    expect(d.screensOnlyInA).toEqual(['S1'])
    expect(d.screensOnlyInB).toEqual(['S2'])
    expect(d.screensDiffering).toEqual([])
  })

  it('detects scm/bky differences for shared screen names', () => {
    const a = proj([screen('S1', 'a', 'x')])
    const b = proj([screen('S1', 'b', 'x')])
    expect(diffProjects(a, b).screensDiffering).toEqual([{ name: 'S1', scm: true, bky: false }])
    const a2 = proj([screen('S1', 'x', 'bky1')])
    const b2 = proj([screen('S1', 'x', 'bky2')])
    expect(diffProjects(a2, b2).screensDiffering).toEqual([{ name: 'S1', scm: false, bky: true }])
  })

  it('classifies asset and extension name sets', () => {
    const a = proj([screen('S1')], [{ name: 'f.png', type: 'png', sizeBytes: 1 }], ['pkg.a'])
    const b = proj([screen('S1')], [{ name: 'g.png', type: 'png', sizeBytes: 1 }], ['pkg.b'])
    const d = diffProjects(a, b)
    expect(d.assetsOnlyInA).toContain('f.png')
    expect(d.assetsOnlyInB).toContain('g.png')
    expect(d.extensionsOnlyInA).toEqual(['pkg.a'])
    expect(d.extensionsOnlyInB).toEqual(['pkg.b'])
  })

  it('flags assetsDiffering when name matches but size or type differs', () => {
    const a = proj([screen('S1')], [{ name: 'f.png', type: 'png', sizeBytes: 1 }])
    const b = proj([screen('S1')], [{ name: 'f.png', type: 'jpg', sizeBytes: 1 }])
    expect(diffProjects(a, b).assetsDiffering).toEqual(['f.png'])
  })
})
```

- [ ] **Step 1.2: Run test — expect FAIL** (module missing)

```bash
pnpm exec vitest run test/analysis/project-diff.test.ts
```

- [ ] **Step 1.3: Implement `diffProjects`**

```typescript
import type { AiaProject } from '#/core/types.js'
import type { ProjectDiff } from '#/analysis/types.js'

export function diffProjects(a: AiaProject, b: AiaProject): ProjectDiff {
  const namesA = new Set(a.screens.map(s => s.name))
  const namesB = new Set(b.screens.map(s => s.name))
  const screensOnlyInA = [...namesA].filter(n => !namesB.has(n)).sort()
  const screensOnlyInB = [...namesB].filter(n => !namesA.has(n)).sort()

  const screensDiffering: ProjectDiff['screensDiffering'] = []
  for (const n of [...namesA].filter(x => namesB.has(x)).sort()) {
    const sa = a.screens.find(s => s.name === n)!
    const sb = b.screens.find(s => s.name === n)!
    const scm = sa.scm !== sb.scm
    const bky = sa.bky !== sb.bky
    if (scm || bky) screensDiffering.push({ name: n, scm, bky })
  }

  const mapA = new Map(a.assets.map(x => [x.name, x]))
  const mapB = new Map(b.assets.map(x => [x.name, x]))
  const assetsOnlyInA = [...mapA.keys()].filter(k => !mapB.has(k)).sort()
  const assetsOnlyInB = [...mapB.keys()].filter(k => !mapA.has(k)).sort()
  const assetsDiffering: string[] = []
  for (const name of [...mapA.keys()].filter(k => mapB.has(k)).sort()) {
    const pa = mapA.get(name)!
    const pb = mapB.get(name)!
    if (pa.sizeBytes !== pb.sizeBytes || pa.type !== pb.type) assetsDiffering.push(name)
  }

  const extA = new Set(a.extensions.map(e => e.packageName))
  const extB = new Set(b.extensions.map(e => e.packageName))
  const extensionsOnlyInA = [...extA].filter(x => !extB.has(x)).sort()
  const extensionsOnlyInB = [...extB].filter(x => !extA.has(x)).sort()

  return {
    screensOnlyInA,
    screensOnlyInB,
    screensDiffering,
    assetsOnlyInA,
    assetsOnlyInB,
    assetsDiffering,
    extensionsOnlyInA,
    extensionsOnlyInB,
  }
}
```

- [ ] **Step 1.4: Run tests — expect PASS**

- [ ] **Step 1.5: Commit**

```bash
git add src/analysis/project-diff.ts test/analysis/project-diff.test.ts
git commit -m "feat(v2): add diffProjects (M2b)"
```

---

## Task 2: `diagnose`

**Files:**
- Create: `src/analysis/diagnose.ts`
- Create: `test/analysis/diagnose.test.ts`

- [ ] **Step 2.1: Write failing test**

Use real `Environment.mitAppInventor()` (or Kodular) and minimal SCM from shared helper so `resolve` succeeds.

```typescript
import { describe, it, expect } from 'vitest'
import { diagnose } from '#/analysis/diagnose.js'
import { Environment } from '#/core/environment.js'
import type { AiaScreen } from '#/core/types.js'
import { makeProject } from './helpers' // optional: inline makeScreen with valid SCM
```

Prefer **inline** helpers in this file copying `EMPTY_SCM` / `EMPTY_BKY` from the plan’s shared block so the test file stands alone (no `helpers.ts` unless you create one).

```typescript
it('includes resolve diagnostics and appends MALFORMED_BKY for invalid XML', async () => {
  const env = await Environment.mitAppInventor()
  const screen: AiaScreen = { name: 'Bad', scm: '', bky: '<<<', yail: null }
  const project = { _tag: 'AiaProject' as const, name: 'T', properties: {}, screens: [screen], assets: [], extensions: [] }
  const d = diagnose(project, env)
  const codes = d.map(x => x.code)
  expect(codes).toContain('MALFORMED_BKY')
})

it('does not add MALFORMED_BKY when BKY parses', async () => {
  const env = await Environment.mitAppInventor()
  const bky = '<xml xmlns="https://developers.google.com/blockly/xml"></xml>'
  const project = { _tag: 'AiaProject' as const, name: 'T', properties: {}, screens: [{ name: 'S1', scm: '', bky, yail: null }], assets: [], extensions: [] }
  const d = diagnose(project, env).filter(x => x.code === 'MALFORMED_BKY')
  expect(d).toEqual([])
})
```

- [ ] **Step 2.2: Run test — FAIL**

- [ ] **Step 2.3: Implement**

```typescript
import { parseBky } from '#/blocks/bky-parser.js'
import { resolve } from '#/resolve.js'
import type { AiaProject } from '#/core/types.js'
import type { Environment } from '#/core/environment.js'
import type { Diagnostic } from '#/core/diagnostics.js'

export function diagnose(project: AiaProject, env: Environment): Diagnostic[] {
  const model = resolve(project, env)
  const out: Diagnostic[] = [...model.diagnostics]
  for (const screen of project.screens) {
    try {
      parseBky(screen.bky)
    } catch (e) {
      out.push({
        code: 'MALFORMED_BKY',
        severity: 'error',
        path: ['screens', screen.name],
        message: `Invalid BKY for screen "${screen.name}": ${e}`,
      })
    }
  }
  return out
}
```

- [ ] **Step 2.4: PASS + commit**

```bash
git add src/analysis/diagnose.ts test/analysis/diagnose.test.ts
git commit -m "feat(v2): add diagnose() (M2b)"
```

---

## Task 3: Unused inventory + asset references

**Files:**
- Create: `src/analysis/unused.ts`
- Create: `test/analysis/unused.test.ts`

- [ ] **Step 3.1: Tests** (implementer fills imports; use `parseScm`-compatible SCM and `ComponentDescriptor` minimal extension)

- Tests must cover:
  - `findUnusedExtensions`: extension with component type **not** on screen → unused; same type on **Form** tree → used.
  - `findUnusedAssets`: asset name never substring of scm/bky/properties → unused.
  - `findAssetReferences`: property value contains `pic.png` → reference with `kind: 'property'`; `bky` contains filename → `block_xml`.

- [ ] **Step 3.2: Implement** — walk SCM with `parseScm`; implement per **Semantics** above.

Skeleton:

```typescript
import { parseScm } from '#/components/scm-parser.js'
import type { AiaComponent } from '#/core/types.js'
import type { ModelProject } from '#/core/model.js'
import type { ModelComponent } from '#/core/model.js'
import type { AssetReference } from '#/analysis/types.js'
import type { AiaExtension, AiaAsset } from '#/core/types.js'

function collectComponentTypes(root: AiaComponent, out: Set<string>): void {
  out.add(root.type)
  for (const c of root.children) collectComponentTypes(c, out)
}

export function findUnusedExtensions(model: ModelProject): AiaExtension[] {
  const used = new Set<string>()
  for (const sc of model.screens) {
    try {
      const root = parseScm(sc.source.scm)
      collectComponentTypes(root, used)
    } catch { /* already in model.diagnostics */ }
  }
  return model.source.extensions.filter(ext => !ext.components.some(c => used.has(c.type)))
}

export function findUnusedAssets(model: ModelProject): AiaAsset[] {
  const blobs: string[] = []
  for (const s of model.source.screens) {
    blobs.push(s.scm, s.bky)
  }
  for (const v of Object.values(model.source.properties)) blobs.push(v)
  const joined = blobs.join('\n')
  return model.source.assets.filter(a => !joined.includes(a.name))
}

export function findAssetReferences(model: ModelProject): AssetReference[] {
  const refs: AssetReference[] = []
  const seen = new Set<string>()
  for (const screen of model.screens) {
    walkProps(screen.form, ['screens', screen.name], (path, value) => {
      for (const a of model.source.assets) {
        if (value.includes(a.name)) {
          const key = `${a.name}|property|${path.join('/')}`
          if (!seen.has(key)) {
            seen.add(key)
            refs.push({ assetName: a.name, kind: 'property', path })
          }
        }
      }
    })
  }
  for (const s of model.source.screens) {
    for (const a of model.source.assets) {
      if (s.bky.includes(a.name)) {
        const key = `${a.name}|block_xml|${s.name}`
        if (!seen.has(key)) {
          seen.add(key)
          refs.push({ assetName: a.name, kind: 'block_xml', path: ['screens', s.name] })
        }
      }
    }
  }
  return refs.sort((a, b) => a.assetName.localeCompare(b.assetName) || a.kind.localeCompare(b.kind))
}

function walkProps(node: ModelComponent, base: string[], cb: (path: string[], v: string) => void): void {
  for (const p of node.properties) cb([...base, node.name, p.name], p.value)
  for (const c of node.children) walkProps(c, base, cb)
}
```

- [ ] **Step 3.3: PASS + commit** `feat(v2): add unused + asset reference analysis (M2b)`

---

## Task 4: Block reports

**Files:**
- Create: `src/analysis/block-reports.ts`
- Create: `test/analysis/block-reports.test.ts`

- [ ] **Step 4.1: Tests** using `SIMPLE_BKY` from `test/blocks/bky-parser.test.ts` and an extra snippet with `lexical_variable_get` if needed.

- [ ] **Step 4.2: Implement** `analyzeVariables`, `exportBlockSummary` with full tree walk helper.

```typescript
import type { BlockAst, BlockNode } from '#/blocks/ast.js'
import type { VariableReport, BlockSummary } from '#/analysis/types.js'

export function exportBlockSummary(ast: BlockAst): BlockSummary {
  let total = 0
  const blocksByType: Record<string, number> = {}
  const walk = (n: BlockNode) => {
    total++
    blocksByType[n.type] = (blocksByType[n.type] ?? 0) + 1
    for (const v of Object.values(n.values)) if (v) walk(v)
    for (const s of Object.values(n.statements)) if (s) walk(s)
    if (n.next) walk(n.next)
  }
  for (const b of ast.blocks) walk(b)
  return { topLevelCount: ast.blocks.length, totalBlocks: total, blocksByType }
}

export function analyzeVariables(ast: BlockAst): VariableReport {
  const declared = new Set<string>()
  const referenced = new Set<string>()
  const considerDecl = (t: string) =>
    t === 'global_declaration' ||
    t === 'local_declaration_statement' ||
    t === 'local_declaration_expression' ||
    t === 'procedures_defnoreturn' ||
    t === 'procedures_defreturn'
  const walk = (n: BlockNode) => {
    if (considerDecl(n.type)) {
      const nm = n.fields['NAME'] ?? n.fields['VAR']
      if (nm) declared.add(nm)
    }
    if (n.type === 'lexical_variable_get' || n.type === 'lexical_variable_set') {
      const v = n.fields['VAR']
      if (v) referenced.add(v)
    }
    for (const v of Object.values(n.values)) if (v) walk(v)
    for (const s of Object.values(n.statements)) if (s) walk(s)
    if (n.next) walk(n.next)
  }
  for (const b of ast.blocks) walk(b)
  return {
    declared: [...declared].sort((a, b) => a.localeCompare(b)),
    referenced: [...referenced].sort((a, b) => a.localeCompare(b)),
  }
}
```

- [ ] **Step 4.3: PASS + commit** `feat(v2): add analyzeVariables + exportBlockSummary (M2b)`

---

## Task 5: Cross-cutting analysis

**Files:**
- Create: `src/analysis/cross-cutting.ts`
- Create: `test/analysis/cross-cutting.test.ts`

- [ ] **Step 5.1: Tests**
  - `analyzeComplexity`: empty BKY vs `SIMPLE_BKY` depth/total.
  - `findDeadBlocks`: screen with hat + detached top-level block → dead listed; screen with only `text_print` chain and hat connecting… simplify: two top-level blocks, one `event_handler`, one `text_print` with no link to event → `text_print` dead.
  - `buildNavGraph`: optional mock block type containing `openAnotherScreen` with field.

- [ ] **Step 5.2: Implement** three functions in one file; import `queryBlocks` or `parseBlocks` from `#/blocks/lens.js`.

Implementers: factor `visitBlocks`, `isHat`, `collectAllBlocks` as internal helpers.

- [ ] **Step 5.3: PASS + commit** `feat(v2): add complexity, dead blocks, nav graph (M2b)`

---

## Task 6: Public exports

**Files:**
- Create: `src/analysis/index.ts`
- Modify: `package.json`, `src/index.ts`

- [ ] **Step 6.1: `src/analysis/index.ts`**

```typescript
export { diffProjects } from '#/analysis/project-diff.js'
export { diagnose } from '#/analysis/diagnose.js'
export { findUnusedExtensions, findUnusedAssets, findAssetReferences } from '#/analysis/unused.js'
export { analyzeVariables, exportBlockSummary } from '#/analysis/block-reports.js'
export { analyzeComplexity, findDeadBlocks, buildNavGraph } from '#/analysis/cross-cutting.js'

export type {
  ProjectDiff,
  VariableReport,
  BlockSummary,
  ScreenComplexity,
  ComplexityReport,
  DeadBlock,
  NavEdge,
  NavGraph,
  AssetReference,
  AssetReferenceKind,
} from '#/analysis/types.js'
```

- [ ] **Step 6.2: `package.json`** — add to `exports`:

```json
"./analysis": "./dist/src/analysis/index.js"
```

- [ ] **Step 6.3: `src/index.ts`** — append (same symbols as `src/analysis/index.ts`, but import from **concrete files** — avoids any barrel cycle):

```typescript
// Analysis
export { diffProjects } from '#/analysis/project-diff.js'
export { diagnose } from '#/analysis/diagnose.js'
export { findUnusedExtensions, findUnusedAssets, findAssetReferences } from '#/analysis/unused.js'
export { analyzeVariables, exportBlockSummary } from '#/analysis/block-reports.js'
export { analyzeComplexity, findDeadBlocks, buildNavGraph } from '#/analysis/cross-cutting.js'
export type {
  ProjectDiff,
  VariableReport,
  BlockSummary,
  ScreenComplexity,
  ComplexityReport,
  DeadBlock,
  NavEdge,
  NavGraph,
  AssetReference,
  AssetReferenceKind,
} from '#/analysis/types.js'
```

- [ ] **Step 6.4: `pnpm build` && `pnpm test`**

- [ ] **Step 6.5: Commit** `feat(v2): expose analysis API (M2b)`

---

## Self-Review Checklist (controller runs after plan is written)

### 1. Spec coverage (design spec § Analysis Functions + Milestone 2)

| Spec item | Task |
|-----------|------|
| `diffProjects` | Task 1 |
| `extractScreenTemplate` | M3 — excluded |
| `diagnose` | Task 2 |
| `findUnusedExtensions` | Task 3 |
| `findUnusedAssets` | Task 3 |
| `findAssetReferences` | Task 3 |
| `inferPermissions`, `checkSdkCompatibility`, `auditAccessibility`, `checkNamingConventions` | M3 — excluded |
| `analyzeVariables`, `exportBlockSummary` | Task 4 |
| `analyzeComplexity`, `findDeadBlocks`, `buildNavGraph` | Task 5 |
| `createYailGenerator` | M2c — excluded |

### 2. Placeholder scan

- Task 1 step 1.1 originally contained a typo (`other.png`); **corrected** in follow-up code block — implementers must paste the **corrected** tests.

### 3. Type consistency

- All model-scoped APIs use `ModelProject` and `model.source` for raw `AiaProject` fields.
- `Diagnostic` / `MALFORMED_BKY` align with `src/core/diagnostics.ts`.

---

**Plan complete and saved to `docs/superpowers/plans/2026-05-02-aia-kit-v2-m2b-analysis.md`.**

**Execution options:**

1. **Subagent-Driven (recommended)** — fresh subagent per task, spec + quality review between tasks (`superpowers:subagent-driven-development`).
2. **Inline execution** — run tasks sequentially in one session (`superpowers:executing-plans`).

**Which approach do you want?**
