# aia-kit v2 — Milestone 2c: YAIL Generation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement `createYailGenerator` from the v2 design spec — a factory over `ModelProject` that returns a per-screen function `(screen: ModelScreen) => string`, composing the **component dimension** (`screen.form`) and the **block dimension** (`queryBlocks(screen.source, …)` / `BlockAst`).

**Architecture:** New `src/yail/` module (matches design spec package layout). Pure functions + internal emit helpers; **no** `MutationResult` (generation is read-only). Close over `ModelProject` once so `project.properties`, extension-aware descriptors, and package naming stay consistent for every screen. Reuse `ComponentDescriptor.type` as the Java/YAIL runtime class name (already full qualifier in environment JSON, e.g. `com.google.appinventor.components.runtime.Button`). Reuse `write.ts`’s package derivation from `properties.main` (mirror `getPackagePath` / qualified class = package prefix + `.` + screen name).

**Tech Stack:** TypeScript, Vitest, existing `#/*` aliases. No new npm dependencies unless a future task proves unavoidable (default: **none**).

---

## Scope Note

| In M2c | Explicitly out of scope |
|--------|-------------------------|
| `createYailGenerator` + emitted `.yail` text per screen | Full parity with MIT/Kodular Blockly compilers for **every** block type |
| Component tree → `add-component` / `set-and-coerce-property!` / `do-after-form-creation` | Screen templates (`extractScreenTemplate` / `applyScreenTemplate`) — **M3** |
| Incremental **block** lowering for a documented MVP whitelist + safe fallback for unknown blocks | Whole-language Blockly→YAIL port |
| Optional: integrate generation into `writeAia` when `screen.yail` is null | Migration APIs, Mermaid/JSON export — **M3** |
| Tests using golden snippets + empty/minimal BKY | Checking generated YAIL runs on device (manual / external) |

**Already done (not M2c):** `mergeReports` lives in `src/core/diagnostics.ts` and is exported from `src/index.ts` (M1).

---

## Semantics (normative for implementers)

### Qualified screen class

- Let `main = model.source.properties['main'] ?? ''`, split with `.`.
- If `parts.length > 1`, **package prefix** = `parts.slice(0, -1).join('.')` (all but last segment). Else use a fallback consistent with `getPackagePath` in `src/write.ts` (document the same default base).
- **Qualified repl class** for screen `S` = `${packagePrefix}.${S}` (e.g. `io.kodular.user.App.Screen1`).
- **`define-repl-form`** first argument = that qualified class; second argument = Scheme symbol for the screen (typically same as screen name — match conventions in `docs/file-formats.md` examples).

### File shape

Follow `docs/file-formats.md` § YAIL Files:

1. Header: `#|\n$Source $Yail\n|#\n`
2. `(define-repl-form …)`
3. `(require <com.google.youngandroid.runtime>)`
4. Section comments `;;; <ComponentName>` for readability (optional but helps tests)
5. Form: `(do-after-form-creation …)` with property sets for the root `Form`
6. Descendants: `(add-component <ParentSymbol> <JavaClass> <Name> (set-and-coerce-property! …) …)` — nesting must mirror SCM parent/child (use `ModelComponent` tree from `screen.form`)
7. Block-produced sections: event handlers, procedures, globals — **after** component installation
8. Footer: `(init-runtime)`

### Component properties → `set-and-coerce-property!`

- For each `ComponentProperty`, emit `(set-and-coerce-property! '<Name> '<PropertyName> <value-expr> '<coercion>)`.
- **Coercion kind:** derive from `ComponentProperty.descriptor` when present (map `blockProperties` / property `type` / `editorType` to the small set used in real YAIL: at minimum `'text`, `'number`, `'boolean`; document mapping table in code comments). If descriptor is missing, default coercion `'text` and emit string literals as MIT-style quoted strings.
- **String escaping:** Scheme string literals must escape `\` and `"` correctly; numbers and booleans should not be quoted.

### Block lowering (MVP contract)

- Parse blocks via `queryBlocks(screen.source, ast => ast)` inside the factory (or `parseBlocks(screen.source.bky)` — equivalent).
- **Order:** Iterate **top-level** `ast.blocks` in source order. Classify:
  - **Hat / event:** types matching existing analysis heuristics (`component_event`, `event_handler`, `when_*`, etc. — align with `findDeadBlocks` / `buildNavGraph` naming patterns in `src/analysis/cross-cutting.ts`).
  - **Procedure defs:** `procedures_defnoreturn`, `procedures_defreturn`
  - **Globals:** `global_declaration`
- **MVP emit rules (must implement):**
  - Empty block forest: omit block sections except footer; still emit full component section + `(init-runtime)`.
  - `global_declaration`: emit a best-effort `define-variable` or comment stub consistent with sample YAIL in docs (pick one strategy and test it).
  - `procedures_defnoreturn` / `procedures_defreturn`: emit procedure shell with body placeholder or recursive emission for **expression leaf blocks only** (`math_number`, `text`, `logic_boolean`).
  - `component_event` (and equivalent): emit `(define-event <Instance> <EventName> (<params>) …)` — parameter list from mutation/fields per BKY conventions in `docs/file-formats.md`; body uses same leaf-block subset as procedures.
- **Unknown / unsupported block types:** emit `;;; aia-kit: unsupported block <type> id=<id>` (never throw from generator). This keeps output deterministic and debuggable.

Expand the whitelist in later milestones; M2c only needs a clear, tested baseline.

### Integration with `writeAia` (recommended completion criterion)

- When `writeAia` receives a `ModelProject` and a screen has `yail: null`, optionally generate YAIL via `createYailGenerator(model)(modelScreen)` so archives round-trip with `.yail` entries. **Preserve** non-null `screen.yail` verbatim (user/import already supplied).
- If only `AiaProject` is passed, behavior stays unchanged (no env → cannot build generator).

---

## File Map

### Create (new)

| File | Responsibility |
|------|----------------|
| `src/yail/emit.ts` | Low-level Scheme string builders (indent, quote, coerce literals) |
| `src/yail/component-emit.ts` | Walk `ModelComponent` → `do-after-form-creation` + `add-component` forms |
| `src/yail/block-emit.ts` | Walk `BlockAst` → events / procedures / globals + unsupported comments |
| `src/yail/create-yail-generator.ts` | `createYailGenerator(model)` factory |
| `src/yail/index.ts` | Public export surface |
| `test/yail/create-yail-generator.test.ts` | Factory + snapshot-ish string assertions |
| `test/yail/component-emit.test.ts` | Component-only emission (optional split if file grows) |

### Modify (existing)

| File | Change |
|------|--------|
| `package.json` | Add `"./yail": "./dist/src/yail/index.js"` to `exports` |
| `src/index.ts` | Re-export `createYailGenerator` (and types if any public) |
| `src/write.ts` | When input is `ModelProject`, fill missing `.yail` using generator (see Semantics) |

---

## Shared test helpers

Copy minimal helpers from M2a/M2b plans (`EMPTY_SCM`, `EMPTY_BKY`, `makeProject`, `makeScreen`) into `test/yail/` files as needed. Resolve with `Environment.mitAppInventor()` or Kodular for any test that needs valid `ModelProject`.

Use small synthetic SCM fixtures so `resolve` yields a `Form` + one child (e.g. `Button`) where needed.

---

## Task 0: Emit utilities

**Files:** `src/yail/emit.ts`, `test/yail/emit.test.ts` (optional)

- [ ] **Step 0.1:** Implement `escapeSchemeString(s: string): string`, `emitLiteral(value: string, kind: 'text' | 'number' | 'boolean'): string`, `lines(parts: string[], indent: number): string`.
- [ ] **Step 0.2:** Unit-test quoting edge cases (`"`, `\`, newlines if allowed).
- [ ] **Step 0.3:** Commit `feat(v2): add YAIL emit helpers (M2c)`.

---

## Task 1: Component emission

**Files:** `src/yail/component-emit.ts`, `test/yail/component-emit.test.ts`

- [ ] **Step 1.1:** Implement `emitComponentSection(screenName: string, form: ModelComponent): string` — Form symbol = screen name or root component name (must match what `define-repl-form` uses); verify against one real MIT/Kodular naming convention from fixtures/docs.
- [ ] **Step 1.2:** Recursive `add-component`: parent symbol is the **parent component’s Scheme name** — use `ModelComponent.name` as the stable identifier (matches SCM `$Name`).
- [ ] **Step 1.3:** Property coercion table + tests for `text` / `number` / `boolean` / `color`-like literals (`&H…` → document handling).
- [ ] **Step 1.4:** Commit `feat(v2): emit YAIL component sections from ModelComponent (M2c)`.

---

## Task 2: Block emission (MVP)

**Files:** `src/yail/block-emit.ts`, `test/yail/block-emit.test.ts`

- [ ] **Step 2.1:** Implement traversal helpers shared with analysis style: walk `values`, `statements`, `next`.
- [ ] **Step 2.2:** Implement MVP lowering per **Semantics**; add one fixture BKY with `component_event` + `text_print` (or simplest hat + primitive body).
- [ ] **Step 2.3:** Assert unsupported blocks produce comment lines, not throws.
- [ ] **Step 2.4:** Commit `feat(v2): emit MVP block sections to YAIL (M2c)`.

---

## Task 3: `createYailGenerator`

**Files:** `src/yail/create-yail-generator.ts`, `src/yail/index.ts`, `test/yail/create-yail-generator.test.ts`

- [ ] **Step 3.1:** Implement `createYailGenerator(model: ModelProject): (screen: ModelScreen) => string` — locate `ModelScreen` by `screen.name`; compose header + component section + block section + `(init-runtime)`.
- [ ] **Step 3.2:** Test: empty BKY + single Form → output contains `define-repl-form`, `do-after-form-creation`, `init-runtime`.
- [ ] **Step 3.3:** Test: two screens — generator uses correct qualified class for each.
- [ ] **Step 3.4:** Commit `feat(v2): add createYailGenerator (M2c)`.

---

## Task 4: Public exports + optional `writeAia` integration

**Files:** `package.json`, `src/index.ts`, `src/write.ts`, `test/write.test.ts` (extend if present)

- [ ] **Step 4.1:** Export `createYailGenerator` from `src/yail/index.ts`, root `src/index.ts`, and `package.json` exports map (`./yail`).
- [ ] **Step 4.2:** Update `writeAia`: if argument is `ModelProject`, for each screen where `screen.source.yail == null`, set written YAIL from generator; never overwrite non-null `yail`.
- [ ] **Step 4.3:** `pnpm build && pnpm test`.
- [ ] **Step 4.4:** Commit `feat(v2): expose YAIL API and fill missing yail on write (M2c)`.

---

## Self-Review Checklist

### 1. Spec coverage (design spec § YAIL Generation + Milestone 2)

| Spec item | Task |
|-----------|------|
| `createYailGenerator(model): (screen) => string` | Task 3 |
| Composes `screen.form` + blocks via lens | Tasks 1–3 |
| `./yail` subpath export (design package structure) | Task 4 |
| `mergeReports` | Already in M1 — **not** repeated here |

### 2. Risk register

| Risk | Mitigation |
|------|------------|
| MIT/Kodular YAIL diverges for edge cases | MVP + comments for unsupported blocks; golden tests from captured snippets when available |
| Wrong coercion crashes companion | Conservative defaults → `'text`; document limitations |
| `main` missing / malformed | Same fallback as `write.ts` path derivation |

### 3. Follow-ups (post-M2c)

- Expand block whitelist; align `ORPHANED_BLOCK` diagnostics with generated YAIL references.
- Golden-file tests from real AIA fixtures under `test/fixtures/` once `.yail` samples are checked in.

---

**Plan path:** `docs/superpowers/plans/2026-05-02-aia-kit-v2-m2c-yail-generation.md`

**Execution options:**

1. **Subagent-driven (recommended)** — one subagent per task, review between tasks (`superpowers:subagent-driven-development`).
2. **Inline execution** — sequential tasks in one session (`superpowers:executing-plans`).
