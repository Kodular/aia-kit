# aia-kit — Ubiquitous Language

This document defines the canonical terms used throughout aia-kit's codebase, documentation, and API. When in doubt, prefer these terms over synonyms.

---

## File Formats

**AIA**
The project archive format used by App Inventor platforms. A ZIP file containing screens, assets, extensions, and project metadata. Stands for _App Inventor Archive_. See [aia.md](aia.md).

**AIX**
The extension package format. A ZIP file containing component descriptors, compiled code, assets, and an Android manifest. Stands for _App Inventor Extension_. See [aix.md](aix.md).

**AIS**
A single-screen export format — AIA-shaped subset focused on one screen’s SCM/BKY (and optional YAIL). See [ais.md](ais.md).

**SCM**
The component definition file for a screen. A JSON document describing the component tree — types, names, UIDs, and property values — embedded in a `#| $JSON … |#` wrapper. One SCM file per screen (e.g., `Screen1.scm`). See [SCM](scm.md).

**BKY**
The block definition file for a screen. An XML document (Blockly format) describing all event handlers, procedures, and logic blocks. One BKY file per screen (e.g., `Screen1.bky`). See [BKY](bky.md).

**YAIL**
The intermediate textual format (Scheme-like, typically interpreted by **Kawa** in the Companion) generated from a screen's SCM + BKY. MIT sources expand the acronym as **Young Android Intermediate Language**; **Yet Another Intermediate Language** appears in older/community writing — both names refer to the same layer. See [YAIL](yail.md).

---

## Raw Layer

The raw layer is the **data space**. It represents file-format-faithful archive data. Types in this layer carry the `Aia*` or `Aix*` prefix. Raw types can round-trip back to AIA/AIX-shaped files.

**AiaProject**
The structured representation of an AIA file's contents. Contains screens, assets, extensions, and project properties. Does not interpret component types or validate property values — faithful to the ZIP.

**AiaScreen**
A single screen's raw data: the SCM string, BKY string, and optional YAIL string. The strings are preserved exactly as found in the ZIP.

**AiaAsset**
A media file or resource bundled in the AIA. Name, type, size, and lazily-loadable binary data.

**AiaExtension**
Represents an extension — both as bundled inside an AIA and as a standalone AIX file (`readAix` returns this same type). Metadata and component descriptors are eagerly available for model-building. Binary files (`classes.jar`, assets) are lazy-loaded on demand. Merges what might have been called `AixProject` — there is no separate type for the AIX file representation.

**AixProject** *(removed — merged into `AiaExtension`)*
Previously a separate type for AIX file contents. Merged into `AiaExtension` in v2 — see below.

---

## Model Layer

The model layer is the **model space**: an environment-enriched semantic projection derived from the raw layer. Types carry the `Model*` prefix. Model objects are snapshots built from `AiaProject + Environment` by `buildModel`.

**ModelProject**
An `AiaProject` enriched with platform and project-extension knowledge. Component types are matched against an effective component registry, properties are typed, and component trees are built. Carries a `source` back-reference to the originating `AiaProject`. Produced by `buildModel(project, environment)`.

**Effective Component Registry**
The immutable `ComponentRegistry` exposed on `ModelProject`. It is built from the base `Environment.componentRegistry` plus descriptors from project-installed `AiaExtension` values.

**ModelScreen**
A screen within a `ModelProject`. Contains the model component tree (`form`) and a `source` back-reference to the originating `AiaScreen`.

**ModelComponent**
A single component node in the model tree. Carries its `ComponentDescriptor`, typed `properties`, `children`, name, type, and UID.

---

## Environment

**Environment**
Represents a base App Inventor platform — the built-in component registry, built-in block registry, and platform metadata for MIT App Inventor, Kodular Creator, or a custom compatible platform. Used during `buildModel()` to attach descriptors to component nodes. Extensions do not modify `Environment`; they belong to `AiaProject`.

Built-in environments are loaded with `getEnvironmentFor(Platform.KodularCreator)` and `getEnvironmentFor(Platform.MitAppInventor)`.

**Platform**
A string-literal platform identifier exposed through a const object. Current built-ins: `Platform.MitAppInventor` (`"mit-app-inventor"`) and `Platform.KodularCreator` (`"kodular-creator"`).

**ComponentDescriptor**
The definition of a component type as declared by the environment or an extension. Specifies available properties, events, methods, property editors, SDK requirements, and permissions.

**ComponentRegistry**
An immutable/read-only class containing component descriptors and lookup behavior. Use `ComponentRegistry.of(descriptors)` to construct one from descriptors.

**MutableComponentRegistry**
A mutable subclass of `ComponentRegistry` for project-scoped registry assembly and extension add/remove workflows. It supports adding/removing descriptors and returns an immutable snapshot with `snapshot()`. `Environment` and `ModelProject` expose immutable `ComponentRegistry` snapshots.

**ComponentProperty**
A model property on a `ModelComponent` — a name, value, and associated `ComponentPropertyDescriptor` from the `ComponentDescriptor`.

---

## Blocks

**BlockAst**
The parsed in-memory representation of a BKY file. A typed tree of block nodes. Built from BKY text with `parseBky(bky)` and converted back to text with `serializeBky(ast)`.

**BKY Transform**
A function that accepts a `BlockAst` and returns a new `BlockAst`. BKY remains function-first because block programs have many possible transformations. Avoid callback-style lens APIs in the core surface.

**ScmDocument**
The public SCM editing abstraction. It parses SCM text, preserves wrapper metadata, exposes component-tree queries/edits, and serialises back to SCM text. Use `ScmDocument.parse(scm).serialize()` for public SCM workflows.

**YailEmitter**
The YAIL emitter scoped to a `ModelProject`. Use `YailEmitter.for(model).emitScreen(screenName)` when callers need to inspect or materialise YAIL directly. `writeAia(model, { withYail: true })` uses the same domain behavior for ordinary archive writing.

**Orphaned Block**
A block that references a component that no longer exists — typically left behind after `removeExtension` or `removeComponent`. Orphaned blocks are surfaced as `Diagnostic` entries with code `ORPHANED_BLOCK`. Callers decide whether to strip them.

---

## Pipeline

**Read**
The archive IO stage. Reads a `Uint8Array`, `ArrayBuffer`, or `Blob`, decompresses the ZIP, and produces an `AiaProject` or `AiaExtension`. Throws on hard IO failure (`AiaZipError`, `AiaStructureError`). Does not interpret component types. Public archive APIs use `readAia`, `readAix`, and optionally `readAis`.

**Parse**
The text-format stage. Converts structured text formats into in-memory data, e.g. `parseBky` and `parseProjectProperties`. SCM is the exception in public API: use `ScmDocument.parse()` rather than exposing low-level SCM parse/serialise details.

**Build Model**
The enrichment stage. Takes an `AiaProject` and an `Environment`, builds component trees with descriptors attached, folds project-installed extension descriptors into the effective component registry, and produces a `ModelProject`. Sync and pure. Never throws for data-level project issues — populates `diagnostics` for partial failures instead.

**Write**
The archive serialisation stage. Packages an `AiaProject` or `ModelProject` back into a ZIP and returns a `Blob`. `writeAia(model, { withYail: true })` emits and embeds YAIL. Throws `AiaWriteError` on failure.

**Emit**
The compiler-style output stage for derived text such as YAIL. "Emit" means producing target text from an already-built semantic model and block ASTs.

---

## Mutations

**MutationResult**
The return type of all mutation functions. Contains a new `AiaProject` (immutably derived) and a `Diagnostic[]` slice listing issues introduced or detected by that mutation.

**Project-Level Operation**
An operation that changes `AiaProject` data and returns a `MutationResult`, such as adding/removing screens, assets, or extensions, or replacing one screen's SCM/BKY text. These operations live in the owning domain module, primarily `aia-kit/aia`.

**SCM Edit**
A local edit to a single `ScmDocument`, such as adding/removing components or updating component properties. SCM edits mutate only the local document instance and then serialise back to SCM text for project fold-back.

**Derived Output Invalidation**
When SCM or BKY changes, existing YAIL for the affected screen may be stale. Project-level operations such as `replaceScreenScm` and `replaceScreenBky` should set that screen's `yail` to `null` unless the operation explicitly preserves caller-supplied YAIL.

---

## Diagnostics

**Diagnostic**
A single issue entry. Has a `code` (typed discriminant), `severity` (`error`, `warning`, `info`), `path` (location in the project), and human-readable `message`.

**DiagnosticCode**
A string literal union discriminating each known issue type. Examples: `UNRESOLVABLE_COMPONENT`, `ORPHANED_BLOCK`, `MISSING_ASSET_REF`, `PLATFORM_INCOMPATIBLE_COMPONENT`.

---

## Migration

Migration APIs are not part of the current composable v2 target surface. This section is historical vocabulary retained for older design notes.

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
A comprehensive read-only validator. Takes an `AiaProject` and `Environment`, returns a full `Diagnostic[]` covering all known issue types. Analysis helpers are convenience APIs over lower-level domain modules.

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
The property of `AiaProject` that ensures `writeAia(await readAia(bytes))` preserves archive content and structure as faithfully as possible. The raw layer preserves SCM and BKY strings unless explicitly edited.
