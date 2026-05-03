# Composable API Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove compatibility wrappers and central mutation modules that survived the composable API migration.

**Architecture:** Public APIs live in their owning domain subpaths. `buildModel` is the only model construction API, `YailEmitter` is the only YAIL generation API, and archive mutations live in `aia` while component edits live in `scm`.

**Tech Stack:** TypeScript, Vitest, NodeNext ESM.

---

## Task 1: Retired API Guardrails

**Files:**
- Create: `test/public-api-cleanup.test.ts`

- [x] Add tests that assert `src/resolve.ts`, `src/mutations/index.ts`, and `src/yail/create-yail-generator.ts` do not exist.
- [x] Add tests that assert `#/yail/index.js` exports `YailEmitter` but not `createYailGenerator`.
- [x] Run `pnpm test test/public-api-cleanup.test.ts` and verify it fails before implementation.

## Task 2: Remove Resolve Compatibility

**Files:**
- Delete: `src/resolve.ts`
- Modify: `src/parse.ts`
- Modify tests importing `#/resolve.js`

- [x] Delete `parseAndResolve` from `src/parse.ts`.
- [x] Replace test imports of `resolve` with `buildModel`.
- [x] Run targeted tests for model, analysis, AIA, and YAIL.

## Task 3: Move Mutations to Owning Domains

**Files:**
- Modify: `src/aia.ts`
- Delete: `src/mutations/*.ts`
- Modify/delete: `test/mutations/*.test.ts`
- Modify: domain tests as needed

- [x] Inline screen, asset, extension, and project merge operations in `src/aia.ts`.
- [x] Keep component tree edits on `ScmDocument`; do not expose old project-level component mutations.
- [x] Delete central `src/mutations` modules and update tests to import from `#/aia.js` or `#/scm.js`.

## Task 4: Replace CreateYailGenerator

**Files:**
- Modify: `src/yail/index.ts`
- Delete: `src/yail/create-yail-generator.ts`
- Delete/replace: `test/yail/create-yail-generator.test.ts`
- Modify docs mentioning `createYailGenerator`

- [x] Move generation logic into `YailEmitter`.
- [x] Remove the public `createYailGenerator` export.
- [x] Update tests and docs to use `YailEmitter`.

## Task 5: Final Verification

- [x] Run stale API scan for `#/resolve`, `#/mutations`, `createYailGenerator`, `parseAndResolve`, and `aia-kit/mutations`.
- [x] Run `pnpm typecheck`.
- [x] Run `pnpm test`.
- [x] Run `pnpm build`.
