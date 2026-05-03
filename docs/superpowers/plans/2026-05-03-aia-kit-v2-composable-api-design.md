# aia-kit v2 Composable API Design Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the current v2 rewrite from the broad `parse` / `resolve` / `mutations` API into the composable domain-subpath API described by `docs/superpowers/specs/2026-05-03-aia-kit-v2-composable-api-design.md`.

**Architecture:** Preserve the existing working parser, writer, SCM, BKY, YAIL, mutation, and analysis internals, but wrap and refactor them into explicit bounded contexts: `aia`, `aix`, `scm`, `bky`, `yail`, `model`, `environment`, `component-descriptor`, `project-properties`, and `analysis`. `AiaProject` stays archive truth; `buildModel(project, environment)` creates immutable model snapshots with an effective registry assembled from base platform descriptors plus project-installed extension descriptors.

**Tech Stack:** TypeScript, Vitest, NodeNext ESM, `@zip.js/zip.js`, `@xmldom/xmldom`, `properties-file`.

---

## Scope Note

This plan supersedes the public API parts of the older milestone plans. It is intentionally a migration from the current repo state, not a clean-slate rewrite. Keep working parser/writer internals unless a task explicitly changes them.

Execute tasks sequentially. Do not dispatch multiple implementation subagents in parallel because package exports, renamed APIs, and model/environment types are shared across tasks.

## File Map

### Create

| File | Responsibility |
|---|---|
| `src/aia.ts` | AIA domain public API: `readAia`, `writeAia`, project-level screen/asset/extension operations |
| `src/aix.ts` | AIX domain public API: `readAix` |
| `src/scm.ts` | Public `ScmDocument` wrapper around SCM parse/serialize/component tree edits |
| `src/bky.ts` | Public BKY parse/serialize and independent AST transforms |
| `src/model.ts` | Public model module: `buildModel` and model types |
| `src/environment.ts` | Public environment module: `Platform`, `getEnvironmentFor`, `createEnvironment`, environment types |
| `src/component-descriptor.ts` | Public descriptor and registry module |
| `src/project-properties.ts` | Public project properties parser/serializer module |
| `src/utils/block-types.ts` | Shared Blockly block classification helpers |
| `src/utils/component-tree.ts` | Raw `AiaComponent` tree query/edit helpers |
| `src/utils/naming.ts` | Collision-safe naming helpers |
| `src/utils/package-names.ts` | App Inventor package/class name helpers |
| `test/aia.test.ts` | Mirrors `src/aia.ts` public domain operations |
| `test/aix.test.ts` | Mirrors `src/aix.ts` public domain operations |
| `test/bky.test.ts` | Mirrors `src/bky.ts` public domain operations |
| `test/component-descriptor.test.ts` | Mirrors `src/component-descriptor.ts` public descriptor and registry exports |
| `test/environment.test.ts` | Mirrors `src/environment.ts` public environment exports |
| `test/index.test.ts` | Mirrors intentionally small `src/index.ts` root export |
| `test/model.test.ts` | Mirrors `src/model.ts` public model exports |
| `test/scm.test.ts` | Mirrors `src/scm.ts` public `ScmDocument` API |
| `test/yail/index.test.ts` | Mirrors `src/yail/index.ts` public YAIL API |

### Modify

| File | Change |
|---|---|
| `package.json` | Replace legacy exports with composable subpath exports |
| `src/index.ts` | Make root export intentionally small |
| `src/parse.ts` | Rename public-facing functions through wrappers; keep internal implementation reusable |
| `src/write.ts` | Add `WriteAiaOptions` overload behavior and explicit YAIL generation gate |
| `src/resolve.ts` | Convert to compatibility-internal wrapper or remove after `buildModel` migration |
| `src/core/environment.ts` | Replace behavior-heavy class with plain environment construction/loading helpers |
| `src/core/model.ts` | Add effective registries and readonly snapshot fields |
| `src/core/registries.ts` | Convert registry factories to `ComponentRegistry` / `MutableComponentRegistry` classes |
| `src/yail/index.ts` | Export `YailEmitter` while preserving `createYailGenerator` internally if useful |
| `src/mutations/*.ts` | Invalidate YAIL for SCM/BKY/project-level mutations where relevant |
| `test/helpers.ts` | Add shared builders used by domain and YAIL tests |
| `test/parse.test.ts` | Move coverage to `test/aia.test.ts`, `test/aix.test.ts`, and `test/project-properties.test.ts` |
| `test/write.test.ts` | Move coverage to `test/aia.test.ts` |
| `test/resolve.test.ts` | Move coverage to `test/model.test.ts` |
| `test/registries.test.ts` | Move coverage to `test/component-descriptor.test.ts` and `test/core/registries.test.ts` |
| `docs/usage.md` | Update imports and workflows to domain subpaths |
| `docs/api.md` | Update API reference to new public surface |

### Keep Internal Unless Needed

| Path | Note |
|---|---|
| `src/components/scm-parser.ts` | Internal parser used by `ScmDocument` and `buildModel` |
| `src/components/scm-serializer.ts` | Internal serializer used by `ScmDocument` and mutations |
| `src/blocks/bky-parser.ts` | Internal parser re-exported through `src/bky.ts` |
| `src/blocks/bky-serializer.ts` | Internal serializer re-exported through `src/bky.ts` |
| `src/blocks/lens.ts` | Delete after YAIL generation uses `parseBky` directly |

## Subagent Execution Protocol

For each task:

1. Dispatch one implementer subagent with that task's full text and this file map.
2. Require the implementer to run the task-specific tests and `pnpm typecheck`.
3. Dispatch a spec-compliance reviewer subagent for the task.
4. Dispatch a code-quality reviewer subagent after spec compliance passes.
5. Mark the task complete only after both reviewers approve.

Use these ownership boundaries:

| Task | Primary ownership |
|---|---|
| 0 | `test/helpers.ts`, `src/utils/*.ts`, utility extraction tests |
| 1 | `src/core/registries.ts`, `src/core/environment.ts`, `src/environment.ts`, registry/environment tests |
| 2 | `src/core/model.ts`, `src/model.ts`, `src/resolve.ts`, model tests |
| 3 | `src/yail/index.ts`, YAIL emitter tests |
| 4 | `src/aia.ts`, `src/write.ts`, `src/mutations/*.ts`, AIA tests |
| 5 | `src/scm.ts`, SCM document tests |
| 6 | `src/bky.ts`, BKY public tests |
| 7 | `src/*.ts` domain barrels, `package.json`, public API tests |
| 8 | `docs/*.md`, final typecheck/build/test |

## Test Layout Rule

Tests should mirror source structure. When a task creates or renames a source public module, it must create or move the corresponding test file in the matching `test/` location:

| Source | Test |
|---|---|
| `src/aia.ts` | `test/aia.test.ts` |
| `src/aix.ts` | `test/aix.test.ts` |
| `src/bky.ts` | `test/bky.test.ts` |
| `src/component-descriptor.ts` | `test/component-descriptor.test.ts` |
| `src/environment.ts` | `test/environment.test.ts` |
| `src/index.ts` | `test/index.test.ts` |
| `src/model.ts` | `test/model.test.ts` |
| `src/project-properties.ts` | `test/project-properties.test.ts` |
| `src/scm.ts` | `test/scm.test.ts` |
| `src/core/*.ts` | `test/core/*.test.ts` |
| `src/blocks/*.ts` | `test/blocks/*.test.ts` |
| `src/components/*.ts` | `test/components/*.test.ts` |
| `src/yail/*.ts` | `test/yail/*.test.ts` |
| `src/analysis/*.ts` | `test/analysis/*.test.ts` |
| `src/mutations/*.ts` | `test/mutations/*.test.ts` |

Legacy root tests must be moved or deleted as the public modules move:

| Legacy test | Destination |
|---|---|
| `test/parse.test.ts` | `test/aia.test.ts` and `test/aix.test.ts` |
| `test/write.test.ts` | `test/aia.test.ts` |
| `test/resolve.test.ts` | `test/model.test.ts` |
| `test/registries.test.ts` | `test/component-descriptor.test.ts` and `test/core/registries.test.ts` |

Do not leave duplicate root-level compatibility tests for non-canonical modules such as `parse`, `resolve`, `write`, or `mutations` after Task 7 removes those paths from the public export map.

## Task 0: Shared Utility and Test Helper Pre-Cleanup

**Files:**
- Modify: `test/helpers.ts`
- Create: `src/utils/package-names.ts`
- Create: `src/utils/block-types.ts`
- Create: `src/utils/naming.ts`
- Create: `src/utils/component-tree.ts`
- Modify: `src/write.ts`
- Modify: `src/yail/create-yail-generator.ts`
- Modify: `src/parse.ts`
- Modify: `src/analysis/cross-cutting.ts`
- Modify: `src/yail/block-emit.ts`
- Modify: `src/mutations/projects.ts`
- Delete: `src/blocks/lens.ts`
- Create: `test/utils/package-names.test.ts`
- Create: `test/utils/block-types.test.ts`
- Create: `test/utils/naming.test.ts`
- Create: `test/utils/component-tree.test.ts`

This task removes duplicated low-level helpers before public API migration begins. It is intentionally first because later tasks need shared test builders and raw component-tree helpers.

- [ ] **Step 0.1: Extend `test/helpers.ts` with reusable builders**

Add these exports and migrate later task tests to import them instead of redefining local copies.

```typescript
import type {
  AiaAsset,
  AiaComponent,
  AiaExtension,
  AiaProject,
  AiaScreen,
  ProjectProperties,
} from '#/core/types.js'
import type { ComponentDescriptor } from '#/core/descriptors.js'

export const EMPTY_BKY = '<xml xmlns="https://developers.google.com/blockly/xml"></xml>'

export function scmForScreen(name: string): string {
  return `#|\n$JSON\n|#\n{"Properties":{"$Name":"${name}","$Type":"Form","Uuid":"0","$Components":[]}}`
}

export function makeProjectProperties(overrides: Partial<ProjectProperties> = {}): ProjectProperties {
  return {
    main: 'appinventor.ai_user.Project.Screen1',
    name: 'Project',
    versionCode: 1,
    versionName: '1.0',
    unknown: {},
    ...overrides,
  }
}

export function makeScreen(overrides: Partial<AiaScreen> = {}): AiaScreen {
  const name = overrides.name ?? 'Screen1'
  return {
    name,
    scm: overrides.scm ?? scmForScreen(name),
    bky: overrides.bky ?? EMPTY_BKY,
    yail: overrides.yail ?? null,
  }
}

export function makeAsset(name = 'asset.txt', content = new Uint8Array([1, 2, 3])): AiaAsset {
  return {
    name,
    type: name.includes('.') ? name.split('.').pop() ?? '' : '',
    sizeBytes: content.byteLength,
    data: async () => content,
  }
}

export function makeDescriptor(overrides: Partial<ComponentDescriptor> = {}): ComponentDescriptor {
  return {
    type: 'com.google.appinventor.components.runtime.Button',
    name: 'Button',
    external: false,
    version: 1,
    categoryString: 'USERINTERFACE',
    helpString: '',
    showOnPalette: true,
    nonVisible: false,
    iconName: '',
    properties: [],
    blockProperties: [],
    events: [],
    methods: [],
    ...overrides,
  }
}

export function makeExtension(overrides: Partial<AiaExtension> = {}): AiaExtension {
  const packageName = overrides.packageName ?? 'com.example'
  const version = overrides.version ?? 1
  return {
    packageName,
    version,
    minSdk: overrides.minSdk ?? 7,
    components: overrides.components ?? [makeDescriptor({ type: `${packageName}.ExtensionComponent`, name: 'ExtensionComponent', external: true })],
    manifest: overrides.manifest ?? { packageName, version, minSdk: 7, buildVersion: '1', permissions: [] },
    loadClasses: overrides.loadClasses ?? (async () => new Uint8Array()),
    loadAssets: overrides.loadAssets ?? (async () => []),
  }
}

export function makeMinimalProject(overrides: Partial<AiaProject> = {}): AiaProject {
  return {
    _tag: 'AiaProject',
    name: 'Project',
    properties: makeProjectProperties(),
    screens: [makeScreen()],
    assets: [],
    extensions: [],
    ...overrides,
  }
}
```

- [ ] **Step 0.2: Extract package-name helpers and remove YAIL lens dependency**

Create `src/utils/package-names.ts` and update `src/write.ts`, `src/yail/create-yail-generator.ts`, and `src/parse.ts` to use it.

```typescript
import type { ProjectProperties } from '#/core/types.js'

const FALLBACK_PACKAGE_PREFIX = 'appinventor.ai_user.Project'

export function getDotPackagePrefix(properties: ProjectProperties): string {
  const parts = properties.main.split('.').filter(Boolean)
  return parts.length > 1 ? parts.slice(0, -1).join('.') : FALLBACK_PACKAGE_PREFIX
}

export function getPackagePath(properties: ProjectProperties): string {
  return getDotPackagePrefix(properties).replaceAll('.', '/')
}

export function extractPackageName(typeName: string): string {
  const parts = typeName.split('.').filter(Boolean)
  return parts.length > 1 ? parts.slice(0, -1).join('.') : ''
}

export function extractClassName(typeName: string): string {
  const parts = typeName.split('.').filter(Boolean)
  return parts.at(-1) ?? typeName
}
```

While updating `src/yail/create-yail-generator.ts`, remove the import from `#/blocks/lens.js`. Use `parseBky(screen.source.bky)` directly.

```typescript
import { parseBky } from '#/blocks/bky-parser.js'

const blockSection = emitBlockSection(
  parseBky(resolved.source.bky),
  model.builtinBlockRegistry,
)
```

- [ ] **Step 0.3: Extract block type classification**

Create `src/utils/block-types.ts` and update `src/analysis/cross-cutting.ts` and `src/yail/block-emit.ts`.

```typescript
export function isEventHandlerBlock(type: string): boolean {
  return (
    type === 'event_handler' ||
    type.includes('event_') ||
    type.startsWith('when_') ||
    (type.startsWith('component_') && type.includes('Click'))
  )
}
```

- [ ] **Step 0.4: Extract naming helper**

Create `src/utils/naming.ts` and update `src/mutations/projects.ts`.

```typescript
export function findUniqueName(base: string, existing: readonly string[]): string {
  const names = new Set(existing)
  let i = 2
  let candidate = `${base}_${i}`
  while (names.has(candidate)) {
    i += 1
    candidate = `${base}_${i}`
  }
  return candidate
}
```

- [ ] **Step 0.5: Extract raw component-tree helpers**

Create `src/utils/component-tree.ts`. These operate on raw `AiaComponent`, not `ModelComponent`; `src/components/tree.ts` remains the model-tree utility module.

```typescript
import type { AiaComponent } from '#/core/types.js'

export function findRawComponentByUid(root: AiaComponent, uid: string): AiaComponent | null {
  if (root.uid === uid) return root
  for (const child of root.children) {
    const found = findRawComponentByUid(child, uid)
    if (found) return found
  }
  return null
}

export function getRawComponentsByType(root: AiaComponent, type: string): AiaComponent[] {
  const matches = root.type === type ? [root] : []
  return matches.concat(root.children.flatMap(child => getRawComponentsByType(child, type)))
}

export function addRawComponentToParent(
  root: AiaComponent,
  parentUid: string,
  component: AiaComponent,
): AiaComponent | null {
  if (root.uid === parentUid) {
    return { ...root, children: [...root.children, component] }
  }
  for (const child of root.children) {
    const updated = addRawComponentToParent(child, parentUid, component)
    if (updated) {
      return { ...root, children: root.children.map(candidate => candidate === child ? updated : candidate) }
    }
  }
  return null
}

export function removeRawComponentByUid(
  root: AiaComponent,
  uid: string,
): { root: AiaComponent | null; removed: boolean } {
  if (root.uid === uid) return { root: null, removed: true }
  let removed = false
  const children: AiaComponent[] = []
  for (const child of root.children) {
    const result = removeRawComponentByUid(child, uid)
    if (result.removed) {
      removed = true
      if (result.root) children.push(result.root)
    } else {
      children.push(child)
    }
  }
  return { root: { ...root, children }, removed }
}
```

- [ ] **Step 0.6: Delete `src/blocks/lens.ts` and move remaining coverage**

Delete `src/blocks/lens.ts` and `test/blocks/lens.test.ts`. Move parse/serialize coverage into `test/bky.test.ts` in Task 6. Do not preserve `parseBlocks`, `serializeBlocks`, `queryBlocks`, `updateBlocks`, or `updateAllScreenBlocks`; callback-style lens helpers are a non-goal of the composable API.

- [ ] **Step 0.7: Add focused utility tests**

Create `test/utils/package-names.test.ts`, `test/utils/block-types.test.ts`, `test/utils/naming.test.ts`, and `test/utils/component-tree.test.ts`. Each test file should cover the exported helpers directly. Use `test/helpers.ts` builders for raw component fixtures.

- [ ] **Step 0.8: Run verification**

Run:

```bash
pnpm test test/utils
pnpm test test/write.test.ts test/yail/create-yail-generator.test.ts test/analysis/cross-cutting.test.ts test/yail/block-emit.test.ts test/mutations/projects.test.ts test/blocks/bky-parser.test.ts test/blocks/bky-serializer.test.ts
pnpm typecheck
```

Expected: all utility tests pass and the existing behavior of writer, YAIL generation, analysis, and project merge remains unchanged.

- [ ] **Step 0.9: Commit**

```bash
git add test/helpers.ts src/utils/package-names.ts src/utils/block-types.ts src/utils/naming.ts src/utils/component-tree.ts test/utils src/write.ts src/yail/create-yail-generator.ts src/parse.ts src/analysis/cross-cutting.ts src/yail/block-emit.ts src/mutations/projects.ts src/blocks/lens.ts test/blocks/lens.test.ts
git commit -m "chore(v2): extract shared utilities and test builders"
```

## Deferred Utility Note

Do not add `src/utils/colors.ts` in this plan. Color conversion is not used by the current composable API spec, and stub-only utilities would violate the implementation-plan requirement for concrete behavior. When color-aware model enrichment, CSS output, or design-time validation is specified, add real `parseAndroidColor()` and `toCssHex()` behavior with tests.

## Task 1: Registry and Environment Foundations

**Files:**
- Modify: `src/core/registries.ts`
- Modify: `src/core/environment.ts`
- Modify: `src/core/errors.ts`
- Modify: `src/parse.ts`
- Modify: `src/resolve.ts`
- Modify: `src/yail/create-yail-generator.ts`
- Create: `src/environment.ts`
- Create: `test/environment.test.ts`
- Create: `test/component-descriptor.test.ts`
- Create: `test/core/registries.test.ts`
- Modify: `test/core/environment.test.ts`
- Delete after moving coverage: `test/registries.test.ts`

- [ ] **Step 1.1: Write failing registry tests**

Add tests that prove the new registry classes are immutable at public boundaries and mutable only through `toMutable()`.

```typescript
import { describe, expect, it } from 'vitest'
import { ComponentRegistry, MutableComponentRegistry } from '#/component-descriptor.js'
import type { ComponentDescriptor } from '#/core/descriptors.js'

const button: ComponentDescriptor = {
  type: 'com.google.appinventor.components.runtime.Button',
  name: 'Button',
  external: false,
  version: 1,
  categoryString: 'USERINTERFACE',
  helpString: '',
  showOnPalette: true,
  nonVisible: false,
  iconName: '',
  properties: [],
  blockProperties: [],
  events: [],
  methods: [],
}

describe('ComponentRegistry', () => {
  it('creates immutable snapshots and mutable working copies', () => {
    const registry = ComponentRegistry.of([button])
    expect(registry.lookup(button.type)).toBe(button)
    expect(registry.lookup('Button')).toBe(button)
    expect(registry.has('Button')).toBe(true)

    const mutable = registry.toMutable()
    expect(mutable).toBeInstanceOf(MutableComponentRegistry)
    mutable.remove('Button')
    expect(mutable.lookup('Button')).toBeNull()
    expect(registry.lookup('Button')).toBe(button)
  })
})
```

- [ ] **Step 1.2: Write failing environment tests**

Update tests away from `Environment.kodularCreator()` and `env.withExtension(...)`.

```typescript
import { describe, expect, it } from 'vitest'
import { createEnvironment, getEnvironmentFor, Platform } from '#/environment.js'
import { ComponentRegistry } from '#/component-descriptor.js'

describe('environment', () => {
  it('loads built-in platforms through getEnvironmentFor', async () => {
    const env = await getEnvironmentFor(Platform.MitAppInventor)
    expect(env.meta.id).toBe(Platform.MitAppInventor)
    expect(env.componentRegistry.lookup('Button')).not.toBeNull()
    expect(env.builtinBlockRegistry.lookup('logic_boolean')).not.toBeNull()
  })

  it('creates a validated custom environment', () => {
    const env = createEnvironment({
      meta: { id: 'custom', name: 'Custom Platform' },
      components: [],
      builtinBlocks: [],
    })
    expect(env.meta.name).toBe('Custom Platform')
    expect(env.componentRegistry).toBeInstanceOf(ComponentRegistry)
  })
})
```

- [ ] **Step 1.3: Implement component and built-in block registry classes**

Replace the interface-only `ComponentRegistry` with classes.

```typescript
export class ComponentRegistry {
  protected items: ComponentDescriptor[]
  protected byTypeOrName: Map<string, ComponentDescriptor>

  protected constructor(descriptors: readonly ComponentDescriptor[]) {
    this.items = [...descriptors]
    this.byTypeOrName = buildDescriptorMap(this.items)
  }

  static of(descriptors: readonly ComponentDescriptor[]): ComponentRegistry {
    return new ComponentRegistry(descriptors)
  }

  get descriptors(): readonly ComponentDescriptor[] {
    return Object.freeze([...this.items])
  }

  lookup(typeOrName: string): ComponentDescriptor | null {
    return this.byTypeOrName.get(typeOrName) ?? null
  }

  has(typeOrName: string): boolean {
    return this.lookup(typeOrName) !== null
  }

  toMutable(): MutableComponentRegistry {
    return new MutableComponentRegistry(this.descriptors)
  }
}

export class MutableComponentRegistry extends ComponentRegistry {
  constructor(descriptors: readonly ComponentDescriptor[] = []) {
    super(descriptors)
  }

  add(descriptors: ComponentDescriptor | readonly ComponentDescriptor[]): void {
    const next = Array.isArray(descriptors) ? descriptors : [descriptors]
    this.items = [...this.items, ...next]
    this.byTypeOrName = buildDescriptorMap(this.items)
  }

  remove(typeOrNames: string | readonly string[]): void {
    const names = new Set(Array.isArray(typeOrNames) ? typeOrNames : [typeOrNames])
    this.items = this.items.filter(d => !names.has(d.type) && !names.has(d.name))
    this.byTypeOrName = buildDescriptorMap(this.items)
  }

  snapshot(): ComponentRegistry {
    return ComponentRegistry.of(this.items)
  }
}

function buildDescriptorMap(descriptors: readonly ComponentDescriptor[]): Map<string, ComponentDescriptor> {
  return new Map(descriptors.flatMap(d => [[d.type, d], [d.name, d]] as const))
}
```

Replace the interface-style block registry with a `BuiltinBlockRegistry` class. Do not keep `BlockRegistry` or `createBlockRegistry()` compatibility aliases; this branch is in the middle of a rewrite and the canonical v2 surface should use the final names directly.

```typescript
export class BuiltinBlockRegistry {
  readonly builtins: ReadonlyMap<string, BuiltinBlockDescriptor>

  private constructor(builtins: readonly BuiltinBlockDescriptor[]) {
    this.builtins = new Map(builtins.map(block => [block.type, block]))
  }

  static of(builtins: readonly BuiltinBlockDescriptor[]): BuiltinBlockRegistry {
    return new BuiltinBlockRegistry(builtins)
  }

  lookup(type: string): BuiltinBlockDescriptor | null {
    return this.builtins.get(type) ?? null
  }

  has(type: string): boolean {
    return this.lookup(type) !== null
  }
}

export function defaultBlockRegistry(): BuiltinBlockRegistry {
  return BuiltinBlockRegistry.of(DEFAULT_BUILTINS)
}
```

Update every source import and type reference from `BlockRegistry` / `createBlockRegistry()` to `BuiltinBlockRegistry` / `BuiltinBlockRegistry.of(...)` or `defaultBlockRegistry()`.

- [ ] **Step 1.4: Convert `Environment` from class to plain value interface**

Replace the `Environment` class in `src/core/environment.ts`. Remove canonical support for `Environment.kodularCreator()`, `Environment.mitAppInventor()`, `env.withExtension()`, and `env.withExtensions()`. Update every internal caller to use `getEnvironmentFor(Platform...)`, `createEnvironment(...)`, and `environment.componentRegistry.lookup(...)`.

Internal migration requirements:

| Current pattern | Replacement |
|---|---|
| `Environment.kodularCreator()` | `getEnvironmentFor(Platform.KodularCreator)` |
| `Environment.mitAppInventor()` | `getEnvironmentFor(Platform.MitAppInventor)` |
| `env.lookup(type)` | `env.componentRegistry.lookup(type)` |
| `env.withExtension(ext)` | handled in `buildModel(project, env)` in Task 2 |
| `env.withExtensions(exts)` | handled in `buildModel(project, env)` in Task 2 |
| `env.blockRegistry` | `env.builtinBlockRegistry` |

Make `Environment` a value interface and expose `Platform`, `getEnvironmentFor()`, and `createEnvironment()`.

```typescript
export const Platform = {
  MitAppInventor: 'mit-app-inventor',
  KodularCreator: 'kodular-creator',
} as const

export type Platform = typeof Platform[keyof typeof Platform]

export interface EnvironmentMeta {
  readonly id: Platform | string
  readonly name: string
  readonly version?: string
  readonly website?: string
  readonly source?: string
}

export interface Environment {
  readonly componentRegistry: ComponentRegistry
  readonly builtinBlockRegistry: BuiltinBlockRegistry
  readonly meta: EnvironmentMeta
}

export function createEnvironment(input: CreateEnvironmentInput): Environment {
  if (!input.meta.id || !input.meta.name) {
    throw new EnvironmentConstructionError('Environment meta.id and meta.name are required')
  }
  return {
    meta: input.meta,
    componentRegistry: ComponentRegistry.of(input.components),
    builtinBlockRegistry: BuiltinBlockRegistry.of(input.builtinBlocks ?? DEFAULT_BUILTINS),
  }
}
```

`getEnvironmentFor(platform)` must lazy-load JSON from `environments/<platform>/simple_components.json` and memoize by platform.

Use `ComponentRegistry.of(descriptors)` when loading built-in platform components. Do not call `createComponentRegistry()` from environment loading after this step.

Add `EnvironmentConstructionError` to `src/core/errors.ts`:

```typescript
export class EnvironmentConstructionError extends AiaKitError {
  constructor(message: string) {
    super(message)
    this.name = 'EnvironmentConstructionError'
  }
}
```

- [ ] **Step 1.5: Run verification**

Run:

```bash
pnpm test test/environment.test.ts test/component-descriptor.test.ts test/core/environment.test.ts test/core/registries.test.ts
pnpm test test/yail/create-yail-generator.test.ts test/analysis/cross-cutting.test.ts
pnpm typecheck
```

Expected: all tests pass and TypeScript accepts the new environment surface.

- [ ] **Step 1.6: Commit**

```bash
git add src/core/registries.ts src/core/environment.ts src/core/errors.ts src/environment.ts src/parse.ts src/resolve.ts src/yail/create-yail-generator.ts test/environment.test.ts test/component-descriptor.test.ts test/core/environment.test.ts test/core/registries.test.ts test/registries.test.ts
git commit -m "feat(v2): add composable environment and registry APIs"
```

## Task 2: Rename Resolve to Build Model and Fold Extensions Into Model Registry

**Files:**
- Modify: `src/core/model.ts`
- Create: `src/model.ts`
- Modify: `src/resolve.ts`
- Modify: `test/helpers.ts`
- Create: `test/model.test.ts`
- Delete after moving coverage: `test/resolve.test.ts`

- [ ] **Step 2.1: Write failing build model tests**

```typescript
import { describe, expect, it } from 'vitest'
import { buildModel } from '#/model.js'
import { createEnvironment } from '#/environment.js'
import type { AiaProject, AiaExtension } from '#/core/types.js'
import type { ComponentDescriptor } from '#/core/descriptors.js'

const extensionDescriptor: ComponentDescriptor = {
  type: 'com.example.ExtensionButton',
  name: 'ExtensionButton',
  external: true,
  version: 1,
  categoryString: 'EXTENSION',
  helpString: '',
  showOnPalette: true,
  nonVisible: false,
  iconName: '',
  properties: [],
  blockProperties: [],
  events: [],
  methods: [],
}

describe('buildModel', () => {
  it('builds an effective registry from environment plus project extensions', () => {
    const environment = createEnvironment({
      meta: { id: 'test', name: 'Test' },
      components: [],
      builtinBlocks: [],
    })
    const extension: AiaExtension = {
      packageName: 'com.example',
      version: 1,
      minSdk: 7,
      components: [extensionDescriptor],
      manifest: { packageName: 'com.example', version: 1, minSdk: 7, buildVersion: '1', permissions: [] },
      loadClasses: async () => new Uint8Array(),
      loadAssets: async () => [],
    }
    const project: AiaProject = {
      _tag: 'AiaProject',
      name: 'Project',
      properties: { main: 'appinventor.ai_user.Project.Screen1', name: 'Project', versionCode: 1, versionName: '1.0', unknown: {} },
      assets: [],
      extensions: [extension],
      screens: [],
    }
    const model = buildModel(project, environment)
    expect(model.componentRegistry.lookup('ExtensionButton')).toBe(extensionDescriptor)
    expect(environment.componentRegistry.lookup('ExtensionButton')).toBeNull()
  })
})
```

- [ ] **Step 2.2: Update model types**

`ModelProject` must expose `source`, `environment`, `componentRegistry`, `builtinBlockRegistry`, `screens`, and `diagnostics` as readonly snapshot fields.

```typescript
export interface ModelProject {
  readonly _tag: 'ModelProject'
  readonly source: AiaProject
  readonly environment: Environment
  readonly componentRegistry: ComponentRegistry
  readonly builtinBlockRegistry: BuiltinBlockRegistry
  readonly screens: readonly ModelScreen[]
  readonly diagnostics: readonly Diagnostic[]
}
```

- [ ] **Step 2.3: Implement `buildModel`**

Move the current `resolve()` implementation to `buildModel(project, environment)`. Use the model's effective registry for component lookup.

```typescript
export function buildModel(project: AiaProject, environment: Environment): ModelProject {
  const componentRegistry = environment.componentRegistry.toMutable()
  for (const extension of project.extensions) {
    componentRegistry.add(extension.components)
  }
  const effectiveComponentRegistry = componentRegistry.snapshot()
  const diagnostics: Diagnostic[] = []
  const screens = project.screens.flatMap(screen => buildScreen(screen, effectiveComponentRegistry, diagnostics))

  return {
    _tag: 'ModelProject',
    source: project,
    environment,
    componentRegistry: effectiveComponentRegistry,
    builtinBlockRegistry: environment.builtinBlockRegistry,
    screens,
    diagnostics,
  }
}
```

Keep `src/resolve.ts` as:

```typescript
export { buildModel as resolve } from '#/model.js'
```

This keeps existing local tests compiling while the public export map changes in Task 7.

- [ ] **Step 2.4: Add `makeMinimalModelProject()` test helper**

After `src/model.ts` and `src/environment.ts` exist, extend `test/helpers.ts` with a shared model helper for YAIL and analysis tests.

```typescript
import { createEnvironment } from '#/environment.js'
import { buildModel } from '#/model.js'
import type { ModelProject } from '#/core/model.js'

export function makeMinimalModelProject(project = makeMinimalProject()): ModelProject {
  return buildModel(project, createEnvironment({
    meta: { id: 'test', name: 'Test' },
    components: [makeDescriptor()],
    builtinBlocks: [],
  }))
}
```

- [ ] **Step 2.5: Run verification**

Run:

```bash
pnpm test test/model.test.ts
pnpm typecheck
```

Expected: model tests pass; any existing `resolve` tests still pass through the compatibility wrapper.

- [ ] **Step 2.6: Commit**

```bash
git add src/core/model.ts src/model.ts src/resolve.ts test/helpers.ts test/model.test.ts test/resolve.test.ts
git commit -m "feat(v2): replace resolve with buildModel snapshots"
```

## Task 3: YailEmitter API

**Files:**
- Modify: `src/yail/index.ts`
- Create: `test/yail/index.test.ts`
- Modify: existing `test/yail/*.test.ts` if imports change

- [ ] **Step 3.1: Write failing YAIL emitter tests**

```typescript
import { describe, expect, it } from 'vitest'
import { YailEmitter } from '#/yail/index.js'
import { makeMinimalModelProject } from '../helpers.js'

describe('YailEmitter', () => {
  it('emits by screen object and screen name', () => {
    const model = makeMinimalModelProject()
    const emitter = YailEmitter.for(model)
    expect(emitter.emit(model.screens[0])).toContain('(define-repl-form')
    expect(emitter.emitScreen(model.screens[0].name)).toContain('(define-repl-form')
  })
})
```

Use `makeMinimalModelProject()` from `test/helpers.ts` rather than defining another model fixture inside this test.

- [ ] **Step 3.2: Implement `YailEmitter`**

```typescript
export class YailEmitter {
  private readonly generator: (screen: ModelScreen) => string

  private constructor(private readonly model: ModelProject) {
    this.generator = createYailGenerator(model)
  }

  static for(model: ModelProject): YailEmitter {
    return new YailEmitter(model)
  }

  emit(screen: ModelScreen): string {
    return this.generator(screen)
  }

  emitScreen(screenName: string): string {
    const screen = this.model.screens.find(candidate => candidate.name === screenName)
    if (!screen) throw new AiaWriteError(`Cannot emit YAIL for missing screen "${screenName}"`)
    return this.emit(screen)
  }
}
```

- [ ] **Step 3.3: Run verification**

Run:

```bash
pnpm test test/yail/index.test.ts test/yail
pnpm typecheck
```

Expected: existing YAIL generator tests pass and emitter tests prove the class API.

- [ ] **Step 3.4: Commit**

```bash
git add src/yail/index.ts test/yail/index.test.ts test/yail
git commit -m "feat(v2): add YailEmitter API"
```

## Task 4: AIA Domain API and Explicit YAIL Write Semantics

**Files:**
- Create: `src/aia.ts`
- Modify: `src/write.ts`
- Modify: `src/mutations/screens.ts`
- Modify: `src/mutations/components.ts`
- Create: `test/aia.test.ts`
- Delete after moving coverage: `test/write.test.ts`
- Delete after moving coverage: `test/parse.test.ts`

- [ ] **Step 4.1: Write failing AIA domain tests**

```typescript
import { describe, expect, it } from 'vitest'
import { getScreen, replaceScreenBky, replaceScreenScm, writeAia } from '#/aia.js'
import type { AiaProject } from '#/core/types.js'

function project(): AiaProject {
  return {
    _tag: 'AiaProject',
    name: 'Project',
    properties: { main: 'appinventor.ai_user.Project.Screen1', name: 'Project', versionCode: 1, versionName: '1.0', unknown: {} },
    assets: [],
    extensions: [],
    screens: [{ name: 'Screen1', scm: '{}', bky: '<xml />', yail: 'old yail' }],
  }
}

describe('aia domain operations', () => {
  it('gets and replaces screen source while invalidating derived yail', () => {
    const original = project()
    expect(getScreen(original, 'Screen1')?.name).toBe('Screen1')

    const scmResult = replaceScreenScm(original, 'Screen1', '{"Properties":{}}')
    expect(scmResult.project.screens[0].scm).toBe('{"Properties":{}}')
    expect(scmResult.project.screens[0].yail).toBeNull()

    const bkyResult = replaceScreenBky(original, 'Screen1', '<xml><block type="logic_boolean" /></xml>')
    expect(bkyResult.project.screens[0].bky).toContain('logic_boolean')
    expect(bkyResult.project.screens[0].yail).toBeNull()
  })

  it('rejects raw AiaProject yail generation at compile time', async () => {
    await writeAia(project(), { withYail: false })
    // @ts-expect-error YAIL generation requires ModelProject semantics.
    await writeAia(project(), { withYail: true })
  })
})
```

- [ ] **Step 4.2: Implement `src/aia.ts`**

Export `readAia` as the public name for the current parser and collect archive-level operations in one module.

```typescript
export { parseAia as readAia } from '#/parse.js'
export { writeAia } from '#/write.js'
export type { AiaProject, AiaScreen, AiaAsset, AiaExtension, MutationResult } from '#/core/types.js'

export function getScreen(project: AiaProject, name: string): AiaScreen | null {
  return project.screens.find(screen => screen.name === name) ?? null
}

export function replaceScreen(project: AiaProject, screen: AiaScreen): MutationResult {
  const index = project.screens.findIndex(candidate => candidate.name === screen.name)
  if (index === -1) return missingScreen(project, screen.name)
  const screens = [...project.screens]
  screens[index] = screen
  return { project: { ...project, screens }, diagnostics: [] }
}

export function replaceScreenScm(project: AiaProject, screenName: string, scm: string): MutationResult {
  const screen = getScreen(project, screenName)
  return screen === null ? missingScreen(project, screenName) : replaceScreen(project, { ...screen, scm, yail: null })
}

export function replaceScreenBky(project: AiaProject, screenName: string, bky: string): MutationResult {
  const screen = getScreen(project, screenName)
  return screen === null ? missingScreen(project, screenName) : replaceScreen(project, { ...screen, bky, yail: null })
}
```

Re-export existing `addScreen`, `removeScreen`, `addAsset`, `removeAsset`, `addExtension`, and `removeExtension` from the domain module.

- [ ] **Step 4.3: Implement write overloads**

`writeAia(project, { withYail: true })` must be a TypeScript error. Runtime should also throw if a caller bypasses types.

```typescript
export interface WriteAiaOptions {
  withYail?: boolean
}

export function writeAia(project: AiaProject, options?: { withYail?: false }): Promise<Blob>
export function writeAia(model: ModelProject, options?: WriteAiaOptions): Promise<Blob>
export async function writeAia(input: AiaProject | ModelProject, options: WriteAiaOptions = {}): Promise<Blob> {
  const isModel = input._tag === 'ModelProject'
  if (options.withYail === true && !isModel) {
    throw new AiaWriteError('writeAia(project, { withYail: true }) requires a ModelProject')
  }
  const raw = isModel ? input.source : input
  const emitter = isModel && options.withYail === true ? YailEmitter.for(input) : null
}
```

When `withYail` is true and the input is `ModelProject`, generate and embed each screen's YAIL. When `withYail` is false or omitted, preserve existing non-null `screen.yail` and do not generate missing YAIL.

```typescript
const yail = emitter ? emitter.emitScreen(screen.name) : screen.yail
if (yail !== null && yail !== '') {
  await zw.add(`${dir}/${screen.name}.yail`, new TextReader(yail))
}
```

- [ ] **Step 4.4: Invalidate YAIL for project-level SCM/BKY edits**

Ensure existing mutations that change `screen.scm` or `screen.bky` set `yail: null`. `addScreen` may preserve the provided screen's `yail` because it is explicit caller data; component edits and block updates must invalidate.

```typescript
screens[idx] = { ...screen, scm: newScm, yail: null }
```

- [ ] **Step 4.5: Run verification**

Run:

```bash
pnpm test test/aia.test.ts test/mutations/screens.test.ts test/mutations/components.test.ts
pnpm typecheck
```

Expected: AIA domain tests pass; write overload type assertions pass; mutation tests still pass with updated YAIL invalidation expectations.

- [ ] **Step 4.6: Commit**

```bash
git add src/aia.ts src/write.ts src/mutations/screens.ts src/mutations/components.ts test/aia.test.ts test/write.test.ts test/parse.test.ts test/mutations/screens.test.ts test/mutations/components.test.ts
git commit -m "feat(v2): add AIA domain API and explicit yail writes"
```

## Task 5: Public SCM Document API

**Files:**
- Create: `src/scm.ts`
- Create: `test/scm.test.ts`

- [ ] **Step 5.1: Write failing `ScmDocument` tests**

```typescript
import { describe, expect, it } from 'vitest'
import { ScmDocument } from '#/scm.js'
import type { AiaComponent } from '#/core/types.js'

const component: AiaComponent = {
  name: 'Button1',
  type: 'Button',
  uid: '2',
  properties: { Text: 'Tap' },
  children: [],
}

describe('ScmDocument', () => {
  it('edits a local SCM document and serializes it', () => {
    const doc = ScmDocument.parse('#|\n$JSON\n|#\n{"Properties":{"$Name":"Screen1","$Type":"Form","Uuid":"0","$Components":[]}}')
    expect(doc.findComponentByUid('0')?.name).toBe('Screen1')
    expect(doc.addComponent('0', component)).toEqual([])
    expect(doc.findComponentByUid('2')?.name).toBe('Button1')
    expect(doc.getComponentsByType('Button')).toHaveLength(1)
    expect(doc.serialize()).toContain('Button1')
  })

  it('does not mutate the document when an edit fails', () => {
    const doc = ScmDocument.parse('{"Properties":{"$Name":"Screen1","$Type":"Form","Uuid":"0","$Components":[]}}')
    const diagnostics = doc.removeComponent('missing')
    expect(diagnostics[0].severity).toBe('error')
    expect(doc.serialize()).not.toContain('missing')
  })
})
```

- [ ] **Step 5.2: Implement `ScmDocument`**

Use the current parser and serializer plus the raw tree helpers from `src/utils/component-tree.ts`. Do not use `src/components/tree.ts` here; that module operates on `ModelComponent`, while `ScmDocument` owns raw `AiaComponent` data. Mutating methods only mutate the document instance after validation succeeds.

```typescript
export class ScmDocument {
  readonly diagnostics: Diagnostic[] = []
  private constructor(private rootComponent: AiaComponent, private readonly originalScm: string) {}

  static parse(scm: string): ScmDocument {
    return new ScmDocument(parseScm(scm), scm)
  }

  get root(): AiaComponent {
    return this.rootComponent
  }

  findComponentByUid(uid: string): AiaComponent | null {
    return findRawComponentByUid(this.rootComponent, uid)
  }

  getComponentsByType(type: string): AiaComponent[] {
    return getRawComponentsByType(this.rootComponent, type)
  }

  addComponent(parentUid: string, component: AiaComponent): Diagnostic[] {
    const next = addRawComponentToParent(this.rootComponent, parentUid, component)
    if (next === null) return [componentNotFound(parentUid)]
    this.rootComponent = next
    return []
  }

  removeComponent(uid: string): Diagnostic[] {
    if (this.rootComponent.uid === uid) return [cannotRemoveRoot(uid)]
    const result = removeRawComponentByUid(this.rootComponent, uid)
    if (!result.removed || result.root === null) return [componentNotFound(uid)]
    this.rootComponent = result.root
    return []
  }

  serialize(): string {
    return serializeScm(this.rootComponent, this.originalScm)
  }
}
```

- [ ] **Step 5.3: Run verification**

Run:

```bash
pnpm test test/scm.test.ts test/components/scm-parser.test.ts test/components/scm-serializer.test.ts test/components/tree.test.ts
pnpm typecheck
```

Expected: document API tests pass and existing parser/serializer tests are unchanged.

- [ ] **Step 5.4: Commit**

```bash
git add src/scm.ts test/scm.test.ts
git commit -m "feat(v2): add ScmDocument public API"
```

## Task 6: BKY Public API Without Lens Helpers

**Files:**
- Create: `src/bky.ts`
- Create: `test/bky.test.ts`

- [ ] **Step 6.1: Write failing BKY public tests**

```typescript
import { describe, expect, it } from 'vitest'
import { parseBky, renameComponentReferences, serializeBky } from '#/bky.js'

describe('bky public API', () => {
  it('parses and serializes block XML', () => {
    const ast = parseBky('<xml><block type="event_handler" id="e1" /></xml>')
    expect(ast.blocks[0].type).toBe('event_handler')
    expect(parseBky(serializeBky(ast)).blocks[0].type).toBe('event_handler')
  })

  it('parses, transforms, and serializes block XML', () => {
    const ast = parseBky('<xml><block type="component_method"><mutation component_type="Button" instance_name="Button1" /></block></xml>')
    const renamed = renameComponentReferences(ast, 'Button1', 'PrimaryButton')
    expect(serializeBky(renamed)).toContain('PrimaryButton')
  })
})
```

- [ ] **Step 6.2: Implement `src/bky.ts`**

Export the parser and serializer under the names from the spec. Implement transforms as pure functions returning new AST values.

```typescript
import type { BlockAst, BlockNode } from '#/blocks/ast.js'

export { parseBky } from '#/blocks/bky-parser.js'
export { serializeBky } from '#/blocks/bky-serializer.js'
export type { BlockAst, BlockNode } from '#/blocks/ast.js'

export function removeDisabledBlocks(ast: BlockAst): BlockAst {
  return {
    ...ast,
    blocks: ast.blocks
      .filter(block => block.disabled !== true)
      .map(block => mapBlock(block, child => child)),
  }
}

export function renameComponentReferences(ast: BlockAst, fromName: string, toName: string): BlockAst {
  return {
    ...ast,
    blocks: ast.blocks.map(block => mapBlock(block, current => ({
      ...current,
      fields: Object.fromEntries(
        Object.entries(current.fields).map(([key, value]) => [key, value === fromName ? toName : value])
      ),
      mutation: Object.fromEntries(
        Object.entries(current.mutation).map(([key, value]) => [key, value === fromName ? toName : value])
      ),
    }))),
  }
}

function mapBlock(block: BlockNode, mapper: (block: BlockNode) => BlockNode): BlockNode {
  const nextValues = Object.fromEntries(
    Object.entries(block.values).map(([key, value]) => [key, mapBlock(value, mapper)])
  )
  const nextStatements = Object.fromEntries(
    Object.entries(block.statements).map(([key, value]) => [key, mapBlock(value, mapper)])
  )
  const next = block.next ? mapBlock(block.next, mapper) : null
  return mapper({ ...block, values: nextValues, statements: nextStatements, next })
}
```

Do not recreate or expose `queryBlocks`, `updateBlocks`, or `updateAllScreenBlocks`.

- [ ] **Step 6.3: Run verification**

Run:

```bash
pnpm test test/bky.test.ts test/blocks/bky-parser.test.ts test/blocks/bky-serializer.test.ts
pnpm typecheck
```

Expected: BKY public tests pass and parser/serializer tests still cover the internal XML conversion layer.

- [ ] **Step 6.4: Commit**

```bash
git add src/bky.ts test/bky.test.ts
git commit -m "feat(v2): add function-first BKY public API"
```

## Task 7: Domain Subpath Barrels and Package Exports

**Files:**
- Create: `src/aix.ts`
- Create: `src/component-descriptor.ts`
- Create: `src/project-properties.ts`
- Modify: `src/analysis/index.ts`
- Modify: `src/index.ts`
- Modify: `package.json`
- Create: `test/index.test.ts`
- Create: `test/aix.test.ts`
- Modify: `test/project-properties.test.ts`

- [ ] **Step 7.1: Write failing public API import tests**

```typescript
import { describe, expect, it } from 'vitest'
import { readAia, writeAia } from '#/aia.js'
import { readAix } from '#/aix.js'
import { parseBky, serializeBky } from '#/bky.js'
import { ComponentRegistry } from '#/component-descriptor.js'
import { getEnvironmentFor, Platform } from '#/environment.js'
import { buildModel } from '#/model.js'
import { parseProjectProperties, serializeProjectProperties } from '#/project-properties.js'
import { ScmDocument } from '#/scm.js'
import { YailEmitter } from '#/yail/index.js'

describe('public domain subpaths', () => {
  it('exposes canonical composable modules', () => {
    expect(readAia).toBeTypeOf('function')
    expect(writeAia).toBeTypeOf('function')
    expect(readAix).toBeTypeOf('function')
    expect(parseBky).toBeTypeOf('function')
    expect(serializeBky).toBeTypeOf('function')
    expect(ComponentRegistry.of).toBeTypeOf('function')
    expect(getEnvironmentFor).toBeTypeOf('function')
    expect(Platform.KodularCreator).toBe('kodular-creator')
    expect(buildModel).toBeTypeOf('function')
    expect(parseProjectProperties).toBeTypeOf('function')
    expect(serializeProjectProperties).toBeTypeOf('function')
    expect(ScmDocument.parse).toBeTypeOf('function')
    expect(YailEmitter.for).toBeTypeOf('function')
  })
})
```

- [ ] **Step 7.2: Create domain barrels**

Use thin source files that preserve module boundaries.

```typescript
// src/aix.ts
export { parseAix as readAix } from '#/parse.js'
export type { AiaExtension, AixManifest, AixAsset } from '#/core/types.js'
```

```typescript
// src/component-descriptor.ts
export {
  ComponentRegistry,
  MutableComponentRegistry,
  normalizeComponentDescriptor,
} from '#/core/registries.js'
export type {
  ComponentDescriptor,
  ComponentPropertyDescriptor,
  ComponentBlockPropertyDescriptor,
  ComponentEventDescriptor,
  ComponentMethodDescriptor,
  ComponentDescriptorParam,
} from '#/core/descriptors.js'
```

```typescript
// src/project-properties.ts
export { parseProjectProperties } from '#/parse.js'
export { serializeProperties as serializeProjectProperties } from '#/write.js'
export type { ProjectProperties } from '#/core/types.js'
```

Implement `normalizeComponentDescriptor` in `src/core/descriptors.ts` and re-export it from `src/component-descriptor.ts`. Invalid input should throw `AiaParseError`.

```typescript
export function normalizeComponentDescriptor(raw: unknown): ComponentDescriptor {
  if (typeof raw !== 'object' || raw === null) {
    throw new AiaParseError('Component descriptor must be an object', raw)
  }
  const value = raw as Partial<ComponentDescriptor>
  if (typeof value.type !== 'string' || value.type.length === 0) {
    throw new AiaParseError('Component descriptor requires a non-empty type', raw)
  }
  return {
    type: value.type,
    name: typeof value.name === 'string' && value.name.length > 0 ? value.name : value.type.split('.').pop() ?? value.type,
    external: value.external ?? false,
    version: value.version ?? 1,
    categoryString: value.categoryString ?? 'UNKNOWN',
    helpString: value.helpString ?? '',
    showOnPalette: value.showOnPalette ?? true,
    nonVisible: value.nonVisible ?? false,
    iconName: value.iconName ?? '',
    properties: value.properties ?? [],
    blockProperties: value.blockProperties ?? [],
    events: value.events ?? [],
    methods: value.methods ?? [],
  }
}
```

- [ ] **Step 7.3: Make root export intentionally small**

Replace the current broad `src/index.ts` barrel with only the most basic types and no broad operational API.

```typescript
export type {
  AiaProject,
  AiaScreen,
  AiaAsset,
  AiaExtension,
  AiaComponent,
  ProjectProperties,
  MutationResult,
} from '#/core/types.js'
export type { Diagnostic, DiagnosticSeverity, DiagnosticCode } from '#/core/diagnostics.js'
export type { ModelProject, ModelScreen, ModelComponent, ComponentProperty } from '#/core/model.js'
```

- [ ] **Step 7.4: Update `package.json` exports**

Set the export map to domain subpaths. Keep `"."` intentionally small.

```json
"exports": {
  ".": "./dist/src/index.js",
  "./aia": "./dist/src/aia.js",
  "./aix": "./dist/src/aix.js",
  "./scm": "./dist/src/scm.js",
  "./bky": "./dist/src/bky.js",
  "./yail": "./dist/src/yail/index.js",
  "./model": "./dist/src/model.js",
  "./environment": "./dist/src/environment.js",
  "./project-properties": "./dist/src/project-properties.js",
  "./component-descriptor": "./dist/src/component-descriptor.js",
  "./diagnostics": "./dist/src/core/diagnostics.js",
  "./analysis": "./dist/src/analysis/index.js"
}
```

Do not export `./parse`, `./resolve`, `./write`, or `./mutations` as canonical public subpaths.

- [ ] **Step 7.5: Run verification**

Run:

```bash
pnpm test test/index.test.ts test/aix.test.ts test/project-properties.test.ts
pnpm build
node --input-type=module -e "import('aia-kit/aia').then(m => console.log(typeof m.readAia))"
```

Expected: the test passes, `pnpm build` succeeds, and the Node import prints `function` after build.

- [ ] **Step 7.6: Commit**

```bash
git add src/aix.ts src/component-descriptor.ts src/project-properties.ts src/analysis/index.ts src/index.ts package.json test/index.test.ts test/aix.test.ts test/project-properties.test.ts
git commit -m "feat(v2): publish composable domain subpaths"
```

## Task 8: Documentation Migration and Final Verification

**Files:**
- Modify: `README.md`
- Modify: `docs/usage.md`
- Modify: `docs/api.md`
- Modify: format/domain docs only where they show obsolete imports

- [ ] **Step 8.1: Update documentation imports**

Replace obsolete public imports:

```typescript
import { parseAia } from 'aia-kit/parse'
import { resolve } from 'aia-kit/resolve'
import { writeAia } from 'aia-kit/write'
import { addComponent } from 'aia-kit/mutations'
```

with composable imports:

```typescript
import { readAia, replaceScreenScm, writeAia } from 'aia-kit/aia'
import { buildModel } from 'aia-kit/model'
import { getEnvironmentFor, Platform } from 'aia-kit/environment'
import { ScmDocument } from 'aia-kit/scm'
```

- [ ] **Step 8.2: Document root export policy**

Add a short note to `docs/api.md`:

```markdown
The root `aia-kit` export is intentionally small and type-focused. Prefer domain subpaths such as `aia-kit/aia`, `aia-kit/scm`, `aia-kit/bky`, `aia-kit/model`, and `aia-kit/environment` for operational APIs.
```

- [ ] **Step 8.3: Run full verification**

Run:

```bash
pnpm typecheck
pnpm test
pnpm build
```

Expected: all commands pass.

- [ ] **Step 8.4: Commit**

```bash
git add README.md docs/usage.md docs/api.md docs/*.md
git commit -m "docs(v2): update docs for composable API"
```

## Final Review Checklist

- [ ] `readAia` / `writeAia` are imported from `aia-kit/aia`.
- [ ] `readAix` is imported from `aia-kit/aix`.
- [ ] `parseBky` / `serializeBky` are imported from `aia-kit/bky`.
- [ ] `ScmDocument` is imported from `aia-kit/scm`.
- [ ] `buildModel` is imported from `aia-kit/model`.
- [ ] `getEnvironmentFor`, `createEnvironment`, and `Platform` are imported from `aia-kit/environment`.
- [ ] `ComponentRegistry` and `MutableComponentRegistry` are imported from `aia-kit/component-descriptor`.
- [ ] `YailEmitter` is imported from `aia-kit/yail`.
- [ ] Root export is intentionally small.
- [ ] `Environment.withExtension`, `Environment.kodularCreator`, and `Environment.mitAppInventor` are removed from the canonical public API.
- [ ] `resolve` is not part of the canonical public export map.
- [ ] `writeAia(project, { withYail: true })` is rejected by TypeScript and throws at runtime if bypassed.
- [ ] SCM and BKY mutations invalidate stale screen YAIL by setting `screen.yail` to `null`.
- [ ] `ModelProject.componentRegistry` contains base environment descriptors plus installed extension descriptors.
- [ ] `Environment.componentRegistry` is not mutated by installed project extensions.
- [ ] `pnpm typecheck`, `pnpm test`, and `pnpm build` pass.
