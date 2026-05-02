# aia-kit — Ubiquitous Language

This document defines the canonical terms used throughout aia-kit's codebase, documentation, and API. When in doubt, prefer these terms over synonyms.

---

## File Formats

**AIA**
The project archive format used by App Inventor platforms. A ZIP file containing screens, assets, extensions, and project metadata. Stands for _App Inventor Archive_.

**AIX**
The extension package format. A ZIP file containing component descriptors, compiled code, assets, and an Android manifest. Stands for _App Inventor Extension_.

**AIS**
A single-screen export format. Subset of AIA containing one screen's SCM and BKY files.

**SCM**
The component definition file for a screen. A JSON document describing the component tree — types, names, UIDs, and property values. One SCM file per screen (e.g., `Screen1.scm`).

**BKY**
The block definition file for a screen. An XML document (Blockly format) describing all event handlers, procedures, and logic blocks. One BKY file per screen (e.g., `Screen1.bky`).

**YAIL**
The intermediate textual format (Scheme-like, typically interpreted by **Kawa** in the Companion) generated from a screen's SCM + BKY. MIT sources expand the acronym as **Young Android Intermediate Language**; **Yet Another Intermediate Language** appears in older/community writing — both names refer to the same layer. See [YAIL](yail.md).

---

## Raw Layer

The raw layer represents file-format-faithful data. Types in this layer carry the `Aia*` or `Aix*` prefix. Raw types can always round-trip back to an identical file.

**AiaProject**
The structured representation of an AIA file's contents. Contains screens, assets, extensions, and project properties. Does not interpret component types or validate property values — faithful to the ZIP.

**AiaScreen**
A single screen's raw data: the SCM string, BKY string, and optional YAIL string. The strings are preserved exactly as found in the ZIP.

**AiaAsset**
A media file or resource bundled in the AIA. Name, type, size, and lazily-loadable binary data.

**AiaExtension**
Represents an extension — both as bundled inside an AIA and as a standalone AIX file (`parseAix` returns this same type). Metadata and component descriptors are eagerly available (needed for `resolve()`). Binary files (`classes.jar`, assets) are lazy-loaded on demand. Merges what might have been called `AixProject` — there is no separate type for the AIX file representation.

**AixProject** *(removed — merged into `AiaExtension`)*
Previously a separate type for AIX file contents. Merged into `AiaExtension` in v2 — see below.

---

## Model Layer

The model layer is the environment-enriched object model derived from the raw layer. Types carry the `Model*` prefix. Conceptually parallel to the DOM (Document Object Model) or Maven's POM (Project Object Model).

**ModelProject**
An `AiaProject` enriched with environment knowledge. Component types are resolved against descriptors, properties are typed, and the component tree is built. Carries a `source` back-reference to the originating `AiaProject`. Produced by `resolve()`.

**ModelScreen**
A screen within a `ModelProject`. Contains the resolved component tree (`form`) and a `source` back-reference to the originating `AiaScreen`.

**ModelComponent**
A single component node in the resolved tree. Carries its `ComponentDescriptor`, typed `properties`, `children`, name, type, and UID. No `parent` reference — use `getParent()` or `getComponentPath()` for upward traversal.

---

## Environment

**Environment**
Represents a target App Inventor platform — the set of built-in components and their descriptors available on that platform. Used during `resolve()` to attach descriptors to component nodes. Can be extended with AIX extensions via `withExtension()`.

Built-in environments: `Environment.kodularCreator()`, `Environment.mitAppInventor()`.

**ComponentDescriptor**
The definition of a component type as declared by the environment or an extension. Specifies available properties, events, methods, property editors, SDK requirements, and permissions.

**ComponentProperty**
A resolved property on a `ModelComponent` — a name, value, and associated `ComponentPropertyDescriptor` from the `ComponentDescriptor`.

---

## Blocks

**BlockAst**
The parsed in-memory representation of a BKY file. A typed tree of block nodes. Accessed via the block lens (`queryBlocks`) or directly via `parseBlocks(bky)` for multi-pass use.

**Block Lens**
The functional API for reading and mutating blocks. Callers provide a query or updater function that receives a `BlockAst`; the library handles parsing and serialisation internally. Functions: `queryBlocks`, `updateBlocks`, `updateAllScreenBlocks`. For multi-pass scenarios, use `parseBlocks`/`serializeBlocks` directly and fold back via `updateBlocks(project, screenName, ast)` (value overload) or `updateScreenBky`.

**Orphaned Block**
A block that references a component that no longer exists — typically left behind after `removeExtension` or `removeComponent`. Orphaned blocks are surfaced as `Diagnostic` entries with code `ORPHANED_BLOCK`. Callers decide whether to strip them.

---

## Pipeline

**Parse**
The IO stage. Reads a `Uint8Array` or `Blob`, decompresses the ZIP, and produces an `AiaProject` or `AixProject`. Throws on hard IO failure (`AiaZipError`, `AiaStructureError`). Does not interpret component types.

**Resolve**
The enrichment stage. Takes an `AiaProject` and an `Environment`, builds the component tree with descriptors attached, and produces a `ModelProject`. Sync and pure. Never throws — populates `diagnostics` for partial failures instead.

**Write**
The serialisation stage. Packages an `AiaProject` (or `ModelProject`, using its `source`) back into a ZIP and returns a `Blob`. Throws `AiaWriteError` on failure.

**parseAndResolve**
A convenience function that combines Parse and Resolve in one async call. Suitable for the common case where both steps are always performed together.

---

## Mutations

**MutationResult**
The return type of all mutation functions. Contains a new `AiaProject` (immutably derived) and a `Diagnostic[]` slice listing issues introduced or detected by that mutation.

**Structural Mutation**
A mutation that operates on the shape of an `AiaProject` without environment knowledge — adding/removing screens, components, assets, or extensions; merging projects; updating property values by predicate.

**Platform-Aware Mutation**
A mutation that requires `Environment` knowledge — migrating a component type, migrating a project between platforms.

---

## Diagnostics

**Diagnostic**
A single issue entry. Has a `code` (typed discriminant), `severity` (`error`, `warning`, `info`), `path` (location in the project), and human-readable `message`.

**DiagnosticCode**
A string literal union discriminating each known issue type. Examples: `UNRESOLVABLE_COMPONENT`, `ORPHANED_BLOCK`, `MISSING_ASSET_REF`, `PLATFORM_INCOMPATIBLE_COMPONENT`.

**mergeReports**
Combines multiple `Diagnostic[]` arrays into one. Used when chaining sequential mutations to accumulate a unified report.

---

## Migration

**ExtensionMigrationPlan**
A plain data type describing how to map one extension's components and properties to another's. Produced by `planExtensionMigration`. Callers can spread-and-override before passing to `migrateExtension`.

**Platform Migration**
Moving an `AiaProject` from one `Environment` to another (e.g., Kodular Creator → MIT App Inventor). Performed by `migrateToEnvironment`. Compatibility issues surface as `Diagnostic` entries — callers inspect before using the result.

**Extension Migration**
Replacing one extension with another in an `AiaProject`, mapping old component types and property names to new ones. Performed by `migrateExtension` with a plan from `planExtensionMigration`.

**Extension Upgrade**
Updating an existing extension to a newer version of the same package where the API has changed. Uses `diffAixVersions` to understand breaking changes, then `upgradeExtension` to apply them.

---

## Analysis

**diagnose**
A comprehensive read-only validator. Takes an `AiaProject` and `Environment`, returns a full `Diagnostic[]` covering all known issue types. Lighter than `resolve` — does not build the full model tree.

**NavGraph**
A directed graph of screen-to-screen navigation edges. Each edge carries the triggering component, event, and whether navigation is conditional or always executed.

**ComplexityReport**
Per-screen complexity metrics: cyclomatic complexity (branching paths through blocks), nesting depth, block counts, and a composite score.

**PermissionReport**
Android permissions inferred from component usage. Each permission entry identifies which components require it, distinguishing certain requirements from conditional ones.

---

## Structural Concepts

**Component Tree**
The nested hierarchy of `ModelComponent` nodes for a screen, rooted at the `Form` component. Reflects the App Inventor project structure exactly. Source of truth for YAIL generation and write-back.

**Form**
The root component of every screen's component tree. Corresponds to the `Form` type in App Inventor — the screen itself, which is also a component.

**UID**
A unique identifier assigned to each component instance within a project. Used for stable references across SCM and BKY files.

**Round-trip**
The property of `AiaProject` that ensures `writeAia(parseAia(bytes))` produces a byte-identical output. The raw layer preserves SCM and BKY strings exactly, enabling this guarantee.
