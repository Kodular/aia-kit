# aia-kit v2 — Milestone 2a: Structural Mutations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement all structural mutations on `AiaProject` — screen, component, asset, extension, and project-merge operations — each returning `MutationResult`.

**Architecture:** All mutations are pure functions: `(AiaProject, ...args) → MutationResult`. No environment needed. Component mutations require a new `serializeScm` function (mirroring the existing `parseScm`) to round-trip SCM strings. Files are split by mutation domain: `mutations/screens.ts`, `mutations/components.ts`, `mutations/assets.ts`, `mutations/extensions.ts`, `mutations/projects.ts`, with `mutations/index.ts` re-exporting everything.

**Tech Stack:** TypeScript, Vitest. No new dependencies. Uses existing `parseScm` (`src/components/scm-parser.ts`) and the new `serializeScm` (`src/components/scm-serializer.ts`).

---

## Scope Note

This plan covers **Milestone 2a only**. Analysis (M2b) and YAIL generation (M2c) are separate follow-on plans. `applyScreenTemplate` is M3.

---

## File Map

### Create (new)

| File | Responsibility |
|---|---|
| `src/components/scm-serializer.ts` | `serializeScm(root, originalScm)` — `AiaComponent` → SCM string |
| `src/mutations/screens.ts` | `addScreen`, `removeScreen`, `cloneScreen` |
| `src/mutations/components.ts` | `addComponent`, `removeComponent`, `updatePropertyWhere` |
| `src/mutations/assets.ts` | `addAsset`, `removeAsset` |
| `src/mutations/extensions.ts` | `addExtension`, `removeExtension` |
| `src/mutations/projects.ts` | `MergeOptions`, `mergeProjects` |
| `src/mutations/index.ts` | Re-exports all mutation functions and `MergeOptions` |

### Modify (existing)

| File | Change |
|---|---|
| `src/index.ts` | Add mutations subpath re-export block |

### Test files (new)

| File | Covers |
|---|---|
| `test/components/scm-serializer.test.ts` | `serializeScm` round-trip |
| `test/mutations/screens.test.ts` | `addScreen`, `removeScreen`, `cloneScreen` |
| `test/mutations/components.test.ts` | `addComponent`, `removeComponent`, `updatePropertyWhere` |
| `test/mutations/assets.test.ts` | `addAsset`, `removeAsset` |
| `test/mutations/extensions.test.ts` | `addExtension`, `removeExtension` |
| `test/mutations/projects.test.ts` | `mergeProjects` |

---

## Shared Test Fixtures

The following helper appears in multiple test files — copy it verbatim into each one that needs it (do NOT import it from a shared module; that adds coupling and is harder to follow for agentic workers reading one task at a time).

```typescript
// Minimal SCM string for a screen with no children
const EMPTY_SCM = `#|
$JSON
{"authURL":["aia-kit"],"YaVersion":"1","Source":"Form","Properties":{"$Name":"Screen1","$Type":"Form","Uuid":"-1","Title":"Screen1","$Components":[]}}
|#`

const EMPTY_BKY = `<xml xmlns="https://developers.google.com/blockly/xml"></xml>`

function makeScreen(name: string, scm = EMPTY_SCM, bky = EMPTY_BKY): AiaScreen {
  return { name, scm, bky, yail: null }
}

function makeProject(...screenNames: string[]): AiaProject {
  const screens = screenNames.map(n => makeScreen(n))
  return { _tag: 'AiaProject', name: 'Test', properties: {}, screens, assets: [], extensions: [] }
}
```

---

## Task 0: SCM Serializer

**Files:**
- Create: `src/components/scm-serializer.ts`
- Create: `test/components/scm-serializer.test.ts`

`serializeScm` is the inverse of `parseScm`. It takes a root `AiaComponent` and the original SCM string (to preserve top-level metadata like `authURL`, `YaVersion`, `Source`), then produces a new SCM string with the updated component tree.

- [ ] **Step 0.1: Write failing test**

```typescript
// test/components/scm-serializer.test.ts
import { describe, it, expect } from 'vitest'
import { parseScm } from '#/components/scm-parser.js'
import { serializeScm } from '#/components/scm-serializer.js'

const SCM_WITH_BUTTON = `#|
$JSON
{"authURL":["aia-kit"],"YaVersion":"1","Source":"Form","Properties":{"$Name":"Screen1","$Type":"Form","Uuid":"-1","Title":"Screen1","$Components":[{"$Name":"Button1","$Type":"Button","Uuid":"123","Text":"Click me","$Components":[]}]}}
|#`

const EMPTY_SCM = `#|
$JSON
{"authURL":["aia-kit"],"YaVersion":"1","Source":"Form","Properties":{"$Name":"Screen1","$Type":"Form","Uuid":"-1","Title":"Screen1","$Components":[]}}
|#`

describe('serializeScm', () => {
  it('round-trips parse → serialize → parse identity', () => {
    const root = parseScm(SCM_WITH_BUTTON)
    const serialized = serializeScm(root, SCM_WITH_BUTTON)
    const reparsed = parseScm(serialized)
    expect(reparsed.name).toBe(root.name)
    expect(reparsed.type).toBe(root.type)
    expect(reparsed.uid).toBe(root.uid)
    expect(reparsed.children).toHaveLength(root.children.length)
    expect(reparsed.children[0].name).toBe('Button1')
    expect(reparsed.children[0].properties['Text']).toBe('Click me')
  })

  it('preserves top-level SCM metadata (authURL, YaVersion, Source)', () => {
    const root = parseScm(SCM_WITH_BUTTON)
    const serialized = serializeScm(root, SCM_WITH_BUTTON)
    expect(serialized).toMatch(/"authURL"/)
    expect(serialized).toMatch(/"YaVersion":"1"/)
    expect(serialized).toMatch(/"Source":"Form"/)
  })

  it('serializes a renamed root', () => {
    const root = parseScm(EMPTY_SCM)
    const renamed = { ...root, name: 'NewScreen' }
    const serialized = serializeScm(renamed, EMPTY_SCM)
    const reparsed = parseScm(serialized)
    expect(reparsed.name).toBe('NewScreen')
  })

  it('serializes nested children correctly', () => {
    const root = parseScm(SCM_WITH_BUTTON)
    const serialized = serializeScm(root, SCM_WITH_BUTTON)
    expect(serialized).toMatch(/"Button1"/)
    expect(serialized).toMatch(/"\$Type":"Button"/)
  })

  it('throws on invalid original SCM', () => {
    const root = parseScm(EMPTY_SCM)
    expect(() => serializeScm(root, 'not valid scm')).toThrow()
  })
})
```

- [ ] **Step 0.2: Run test to verify it fails**

```bash
pnpm exec vitest run test/components/scm-serializer.test.ts
```

Expected: FAIL — `Cannot find module '#/components/scm-serializer.js'`

- [ ] **Step 0.3: Write `src/components/scm-serializer.ts`**

```typescript
import type { AiaComponent } from '#/core/types.js'

// Note: property types are not preserved — parseScm already stringifies all values,
// so this serializer only guarantees AiaComponent model round-trips, not raw JSON fidelity.
export function serializeScm(root: AiaComponent, originalScm: string): string {
  const match = originalScm.match(/#\|\s*\$JSON\s*([\s\S]*?)\s*\|#/)
  if (!match || !match[1]) {
    throw new Error('Invalid SCM format: cannot serialize without original wrapper')
  }
  const wrapper = JSON.parse(match[1].trim()) as Record<string, unknown>
  wrapper.Properties = componentToJson(root)
  return `#|\n$JSON\n${JSON.stringify(wrapper)}\n|#`
}

function componentToJson(comp: AiaComponent): Record<string, unknown> {
  return {
    $Name: comp.name,
    $Type: comp.type,
    Uuid: comp.uid,
    ...comp.properties,
    $Components: comp.children.map(componentToJson),
  }
}
```

- [ ] **Step 0.4: Run tests to verify pass**

```bash
pnpm exec vitest run test/components/scm-serializer.test.ts
```

Expected: PASS (5 tests)

- [ ] **Step 0.5: Commit**

```bash
git add src/components/scm-serializer.ts test/components/scm-serializer.test.ts
git commit -m "feat(v2): add serializeScm — AiaComponent tree → SCM string"
```

---

## Task 1: Screen Mutations

**Files:**
- Create: `src/mutations/screens.ts`
- Create: `test/mutations/screens.test.ts`

`addScreen` — appends a screen, rejects duplicates with `DUPLICATE_COMPONENT_NAME`.
`removeScreen` — removes by name, rejects unknown with `MISSING_SCREEN_FILE`.
`cloneScreen` — copies SCM+BKY, renames the root component in SCM, rejects unknown source or duplicate target name.

- [ ] **Step 1.1: Write failing test**

```typescript
// test/mutations/screens.test.ts
import { describe, it, expect } from 'vitest'
import { addScreen, removeScreen, cloneScreen } from '#/mutations/screens.js'
import type { AiaProject, AiaScreen } from '#/core/types.js'
import { parseScm } from '#/components/scm-parser.js'

const EMPTY_SCM = `#|
$JSON
{"authURL":["aia-kit"],"YaVersion":"1","Source":"Form","Properties":{"$Name":"Screen1","$Type":"Form","Uuid":"-1","Title":"Screen1","$Components":[]}}
|#`

const EMPTY_BKY = `<xml xmlns="https://developers.google.com/blockly/xml"></xml>`

function makeScreen(name: string, scm = EMPTY_SCM, bky = EMPTY_BKY): AiaScreen {
  return { name, scm, bky, yail: null }
}

function makeProject(...screenNames: string[]): AiaProject {
  const screens = screenNames.map(n => makeScreen(n))
  return { _tag: 'AiaProject', name: 'Test', properties: {}, screens, assets: [], extensions: [] }
}

describe('addScreen', () => {
  it('appends a new screen', () => {
    const project = makeProject('Screen1')
    const newScreen = makeScreen('Screen2')
    const result = addScreen(project, newScreen)
    expect(result.diagnostics).toEqual([])
    expect(result.project.screens).toHaveLength(2)
    expect(result.project.screens[1].name).toBe('Screen2')
  })

  it('emits DUPLICATE_COMPONENT_NAME when screen name already exists', () => {
    const project = makeProject('Screen1')
    const result = addScreen(project, makeScreen('Screen1'))
    expect(result.diagnostics[0].code).toBe('DUPLICATE_COMPONENT_NAME')
    expect(result.project.screens).toHaveLength(1)
  })

  it('does not mutate the original project', () => {
    const project = makeProject('Screen1')
    addScreen(project, makeScreen('Screen2'))
    expect(project.screens).toHaveLength(1)
  })
})

describe('removeScreen', () => {
  it('removes an existing screen', () => {
    const project = makeProject('Screen1', 'Screen2')
    const result = removeScreen(project, 'Screen2')
    expect(result.diagnostics).toEqual([])
    expect(result.project.screens).toHaveLength(1)
    expect(result.project.screens[0].name).toBe('Screen1')
  })

  it('emits MISSING_SCREEN_FILE for unknown screen name', () => {
    const project = makeProject('Screen1')
    const result = removeScreen(project, 'NoSuch')
    expect(result.diagnostics[0].code).toBe('MISSING_SCREEN_FILE')
    expect(result.project.screens).toHaveLength(1)
  })
})

describe('cloneScreen', () => {
  it('creates a new screen with the given name', () => {
    const project = makeProject('Screen1')
    const result = cloneScreen(project, 'Screen1', 'Screen2')
    expect(result.diagnostics).toEqual([])
    expect(result.project.screens).toHaveLength(2)
    expect(result.project.screens[1].name).toBe('Screen2')
  })

  it('updates the root component name in the cloned SCM', () => {
    const project = makeProject('Screen1')
    const result = cloneScreen(project, 'Screen1', 'Screen2')
    const cloned = result.project.screens[1]
    const root = parseScm(cloned.scm)
    expect(root.name).toBe('Screen2')
  })

  it('preserves BKY content', () => {
    const project = makeProject('Screen1')
    const result = cloneScreen(project, 'Screen1', 'Screen2')
    expect(result.project.screens[1].bky).toBe(EMPTY_BKY)
  })

  it('emits MISSING_SCREEN_FILE for unknown source screen', () => {
    const project = makeProject('Screen1')
    const result = cloneScreen(project, 'NoSuch', 'Screen2')
    expect(result.diagnostics[0].code).toBe('MISSING_SCREEN_FILE')
  })

  it('emits DUPLICATE_COMPONENT_NAME when target name already exists', () => {
    const project = makeProject('Screen1', 'Screen2')
    const result = cloneScreen(project, 'Screen1', 'Screen2')
    expect(result.diagnostics[0].code).toBe('DUPLICATE_COMPONENT_NAME')
  })
})
```

- [ ] **Step 1.2: Run test to verify it fails**

```bash
pnpm exec vitest run test/mutations/screens.test.ts
```

Expected: FAIL — `Cannot find module '#/mutations/screens.js'`

- [ ] **Step 1.3: Write `src/mutations/screens.ts`**

```typescript
import { parseScm } from '#/components/scm-parser.js'
import { serializeScm } from '#/components/scm-serializer.js'
import type { AiaProject, AiaScreen, MutationResult } from '#/core/types.js'

export function addScreen(project: AiaProject, screen: AiaScreen): MutationResult {
  if (project.screens.some(s => s.name === screen.name)) {
    return {
      project,
      diagnostics: [{
        code: 'DUPLICATE_COMPONENT_NAME',
        severity: 'error',
        path: ['screens', screen.name],
        message: `Screen "${screen.name}" already exists`,
      }],
    }
  }
  return {
    project: { ...project, screens: [...project.screens, screen] },
    diagnostics: [],
  }
}

export function removeScreen(project: AiaProject, screenName: string): MutationResult {
  const idx = project.screens.findIndex(s => s.name === screenName)
  if (idx === -1) {
    return {
      project,
      diagnostics: [{
        code: 'MISSING_SCREEN_FILE',
        severity: 'error',
        path: ['screens', screenName],
        message: `Screen "${screenName}" not found`,
      }],
    }
  }
  const screens = project.screens.filter(s => s.name !== screenName)
  return { project: { ...project, screens }, diagnostics: [] }
}

export function cloneScreen(project: AiaProject, screenName: string, newName: string): MutationResult {
  const screen = project.screens.find(s => s.name === screenName)
  if (!screen) {
    return {
      project,
      diagnostics: [{
        code: 'MISSING_SCREEN_FILE',
        severity: 'error',
        path: ['screens', screenName],
        message: `Screen "${screenName}" not found`,
      }],
    }
  }
  if (project.screens.some(s => s.name === newName)) {
    return {
      project,
      diagnostics: [{
        code: 'DUPLICATE_COMPONENT_NAME',
        severity: 'error',
        path: ['screens', newName],
        message: `Screen "${newName}" already exists`,
      }],
    }
  }
  const root = parseScm(screen.scm)
  const renamedRoot = { ...root, name: newName }
  const newScm = serializeScm(renamedRoot, screen.scm)
  const cloned: AiaScreen = { name: newName, scm: newScm, bky: screen.bky, yail: null }
  return {
    project: { ...project, screens: [...project.screens, cloned] },
    diagnostics: [],
  }
}
```

- [ ] **Step 1.4: Run tests to verify pass**

```bash
pnpm exec vitest run test/mutations/screens.test.ts
```

Expected: PASS (10 tests)

- [ ] **Step 1.5: Commit**

```bash
git add src/mutations/screens.ts test/mutations/screens.test.ts
git commit -m "feat(v2): add addScreen, removeScreen, cloneScreen mutations"
```

---

## Task 2: Component Mutations

**Files:**
- Create: `src/mutations/components.ts`
- Create: `test/mutations/components.test.ts`

`addComponent` — finds the parent component by UID in the SCM tree, appends the new child.
`removeComponent` — finds and removes a component by UID from the SCM tree.
`updatePropertyWhere` — walks the SCM tree for each screen, applies a string property update to every component where the predicate returns true.

All three parse the SCM string, mutate the `AiaComponent` tree immutably, then serialize back.

- [ ] **Step 2.1: Write failing test**

```typescript
// test/mutations/components.test.ts
import { describe, it, expect } from 'vitest'
import { addComponent, removeComponent, updatePropertyWhere } from '#/mutations/components.js'
import { parseScm } from '#/components/scm-parser.js'
import type { AiaProject, AiaScreen, AiaComponent } from '#/core/types.js'

const EMPTY_BKY = `<xml xmlns="https://developers.google.com/blockly/xml"></xml>`

// SCM with one Button child
const SCM_WITH_BUTTON = `#|
$JSON
{"authURL":["aia-kit"],"YaVersion":"1","Source":"Form","Properties":{"$Name":"Screen1","$Type":"Form","Uuid":"root-uid","Title":"Screen1","$Components":[{"$Name":"Button1","$Type":"Button","Uuid":"btn-uid","Text":"Click","$Components":[]}]}}
|#`

// SCM with empty form
const EMPTY_SCM = `#|
$JSON
{"authURL":["aia-kit"],"YaVersion":"1","Source":"Form","Properties":{"$Name":"Screen1","$Type":"Form","Uuid":"root-uid","Title":"Screen1","$Components":[]}}
|#`

function makeProject(scm: string): AiaProject {
  const screen: AiaScreen = { name: 'Screen1', scm, bky: EMPTY_BKY, yail: null }
  return { _tag: 'AiaProject', name: 'Test', properties: {}, screens: [screen], assets: [], extensions: [] }
}

const NEW_LABEL: AiaComponent = {
  name: 'Label1', type: 'Label', uid: 'lbl-uid',
  properties: { Text: 'Hello' }, children: [],
}

describe('addComponent', () => {
  it('adds a component to the root form', () => {
    const project = makeProject(EMPTY_SCM)
    const result = addComponent(project, 'Screen1', NEW_LABEL, 'root-uid')
    expect(result.diagnostics).toEqual([])
    const root = parseScm(result.project.screens[0].scm)
    expect(root.children).toHaveLength(1)
    expect(root.children[0].name).toBe('Label1')
  })

  it('adds a component as a child of a nested component', () => {
    const project = makeProject(SCM_WITH_BUTTON)
    const nested: AiaComponent = { name: 'Label1', type: 'Label', uid: 'lbl-uid', properties: {}, children: [] }
    const result = addComponent(project, 'Screen1', nested, 'btn-uid')
    expect(result.diagnostics).toEqual([])
    const root = parseScm(result.project.screens[0].scm)
    const button = root.children[0]
    expect(button.children).toHaveLength(1)
    expect(button.children[0].name).toBe('Label1')
  })

  it('preserves existing children', () => {
    const project = makeProject(SCM_WITH_BUTTON)
    const newComp: AiaComponent = { name: 'Label1', type: 'Label', uid: 'lbl-uid', properties: {}, children: [] }
    const result = addComponent(project, 'Screen1', newComp, 'root-uid')
    const root = parseScm(result.project.screens[0].scm)
    expect(root.children).toHaveLength(2)
  })

  it('emits MISSING_SCREEN_FILE for unknown screen', () => {
    const project = makeProject(EMPTY_SCM)
    const result = addComponent(project, 'NoSuch', NEW_LABEL, 'root-uid')
    expect(result.diagnostics[0].code).toBe('MISSING_SCREEN_FILE')
  })

  it('emits UNRESOLVABLE_COMPONENT when parent UID not found', () => {
    const project = makeProject(EMPTY_SCM)
    const result = addComponent(project, 'Screen1', NEW_LABEL, 'nonexistent-uid')
    expect(result.diagnostics[0].code).toBe('UNRESOLVABLE_COMPONENT')
  })
})

describe('removeComponent', () => {
  it('removes a direct child of the root', () => {
    const project = makeProject(SCM_WITH_BUTTON)
    const result = removeComponent(project, 'Screen1', 'btn-uid')
    expect(result.diagnostics).toEqual([])
    const root = parseScm(result.project.screens[0].scm)
    expect(root.children).toHaveLength(0)
  })

  it('emits MISSING_SCREEN_FILE for unknown screen', () => {
    const project = makeProject(SCM_WITH_BUTTON)
    const result = removeComponent(project, 'NoSuch', 'btn-uid')
    expect(result.diagnostics[0].code).toBe('MISSING_SCREEN_FILE')
  })

  it('emits UNRESOLVABLE_COMPONENT when uid not found', () => {
    const project = makeProject(EMPTY_SCM)
    const result = removeComponent(project, 'Screen1', 'nonexistent-uid')
    expect(result.diagnostics[0].code).toBe('UNRESOLVABLE_COMPONENT')
  })

  it('emits UNRESOLVABLE_COMPONENT when attempting to remove the root form', () => {
    const project = makeProject(EMPTY_SCM)
    const result = removeComponent(project, 'Screen1', 'root-uid')
    expect(result.diagnostics[0].code).toBe('UNRESOLVABLE_COMPONENT')
    expect(result.diagnostics[0].message).toMatch(/root form/)
  })
})

describe('updatePropertyWhere', () => {
  it('updates a matching component property', () => {
    const project = makeProject(SCM_WITH_BUTTON)
    const result = updatePropertyWhere(
      project,
      c => c.type === 'Button',
      'Text',
      'Updated'
    )
    expect(result.diagnostics).toEqual([])
    const root = parseScm(result.project.screens[0].scm)
    expect(root.children[0].properties['Text']).toBe('Updated')
  })

  it('does not modify non-matching components', () => {
    const project = makeProject(SCM_WITH_BUTTON)
    const result = updatePropertyWhere(
      project,
      c => c.type === 'Label',
      'Text',
      'Changed'
    )
    const root = parseScm(result.project.screens[0].scm)
    expect(root.children[0].properties['Text']).toBe('Click')
  })

  it('applies to all screens', () => {
    const screen2: AiaScreen = {
      name: 'Screen2',
      scm: SCM_WITH_BUTTON.replace(/Screen1/g, 'Screen2'),
      bky: EMPTY_BKY,
      yail: null,
    }
    const project: AiaProject = {
      _tag: 'AiaProject', name: 'Test', properties: {},
      screens: [
        { name: 'Screen1', scm: SCM_WITH_BUTTON, bky: EMPTY_BKY, yail: null },
        screen2,
      ],
      assets: [], extensions: [],
    }
    const result = updatePropertyWhere(project, c => c.type === 'Button', 'Text', 'X')
    expect(result.diagnostics).toEqual([])
    for (const screen of result.project.screens) {
      const root = parseScm(screen.scm)
      expect(root.children[0].properties['Text']).toBe('X')
    }
  })
})
```

- [ ] **Step 2.2: Run test to verify it fails**

```bash
pnpm exec vitest run test/mutations/components.test.ts
```

Expected: FAIL — `Cannot find module '#/mutations/components.js'`

- [ ] **Step 2.3: Write `src/mutations/components.ts`**

```typescript
import { parseScm } from '#/components/scm-parser.js'
import { serializeScm } from '#/components/scm-serializer.js'
import type { AiaProject, AiaScreen, AiaComponent, MutationResult } from '#/core/types.js'
import type { Diagnostic } from '#/core/diagnostics.js'

export function addComponent(
  project: AiaProject,
  screenName: string,
  component: AiaComponent,
  parentUid: string,
): MutationResult {
  const idx = project.screens.findIndex(s => s.name === screenName)
  if (idx === -1) {
    return { project, diagnostics: [missingScreen(screenName)] }
  }
  const screen = project.screens[idx]
  const root = parseScm(screen.scm)
  const updated = addToParent(root, parentUid, component)
  if (!updated) {
    return { project, diagnostics: [unresolvedComponent(parentUid, screenName)] }
  }
  return replaceScreenScm(project, idx, screen, updated)
}

export function removeComponent(
  project: AiaProject,
  screenName: string,
  uid: string,
): MutationResult {
  const idx = project.screens.findIndex(s => s.name === screenName)
  if (idx === -1) {
    return { project, diagnostics: [missingScreen(screenName)] }
  }
  const screen = project.screens[idx]
  const root = parseScm(screen.scm)
  if (root.uid === uid) {
    return {
      project,
      diagnostics: [{
        code: 'UNRESOLVABLE_COMPONENT',
        severity: 'error',
        path: ['screens', screenName],
        message: `Cannot remove the root form component (uid "${uid}") from screen "${screenName}"`,
      }],
    }
  }
  const { result, removed } = removeFromTree(root, uid)
  if (!removed || !result) {
    return { project, diagnostics: [unresolvedComponent(uid, screenName)] }
  }
  return replaceScreenScm(project, idx, screen, result)
}

export function updatePropertyWhere(
  project: AiaProject,
  predicate: (component: AiaComponent) => boolean,
  property: string,
  value: string,
): MutationResult {
  const screens = project.screens.map(screen => {
    const root = parseScm(screen.scm)
    const updated = applyPropertyUpdate(root, predicate, property, value)
    return { ...screen, scm: serializeScm(updated, screen.scm) }
  })
  return { project: { ...project, screens }, diagnostics: [] }
}

// ── internal helpers ──────────────────────────────────────────────

function addToParent(
  node: AiaComponent,
  parentUid: string,
  child: AiaComponent,
): AiaComponent | null {
  if (node.uid === parentUid) {
    return { ...node, children: [...node.children, child] }
  }
  let changed = false
  const newChildren = node.children.map(c => {
    const r = addToParent(c, parentUid, child)
    if (r) { changed = true; return r }
    return c
  })
  return changed ? { ...node, children: newChildren } : null
}

function removeFromTree(
  node: AiaComponent,
  uid: string,
): { result: AiaComponent | null; removed: boolean } {
  if (node.uid === uid) return { result: null, removed: true }
  let removed = false
  const newChildren: AiaComponent[] = []
  for (const child of node.children) {
    const r = removeFromTree(child, uid)
    if (r.removed) {
      removed = true
      if (r.result) newChildren.push(r.result)
    } else {
      newChildren.push(child)
    }
  }
  return { result: { ...node, children: newChildren }, removed }
}

function applyPropertyUpdate(
  node: AiaComponent,
  predicate: (c: AiaComponent) => boolean,
  property: string,
  value: string,
): AiaComponent {
  const properties = predicate(node) ? { ...node.properties, [property]: value } : node.properties
  const children = node.children.map(c => applyPropertyUpdate(c, predicate, property, value))
  return { ...node, properties, children }
}

function replaceScreenScm(
  project: AiaProject,
  idx: number,
  screen: AiaScreen,
  newRoot: AiaComponent,
): MutationResult {
  const newScm = serializeScm(newRoot, screen.scm)
  const screens = [...project.screens]
  screens[idx] = { ...screen, scm: newScm }
  return { project: { ...project, screens }, diagnostics: [] }
}

function missingScreen(screenName: string): Diagnostic {
  return {
    code: 'MISSING_SCREEN_FILE',
    severity: 'error',
    path: ['screens', screenName],
    message: `Screen "${screenName}" not found`,
  }
}

function unresolvedComponent(uid: string, screenName: string): Diagnostic {
  return {
    code: 'UNRESOLVABLE_COMPONENT',
    severity: 'error',
    path: ['screens', screenName],
    message: `Component with uid "${uid}" not found in screen "${screenName}"`,
  }
}
```

- [ ] **Step 2.4: Run tests to verify pass**

```bash
pnpm exec vitest run test/mutations/components.test.ts
```

Expected: PASS (12 tests)

- [ ] **Step 2.5: Commit**

```bash
git add src/mutations/components.ts test/mutations/components.test.ts
git commit -m "feat(v2): add addComponent, removeComponent, updatePropertyWhere mutations"
```

---

## Task 3: Asset Mutations

**Files:**
- Create: `src/mutations/assets.ts`
- Create: `test/mutations/assets.test.ts`

`addAsset` — appends an asset, emits `MISSING_ASSET_REF` if name already exists.
`removeAsset` — removes by name, emits `MISSING_ASSET_REF` if not found.

- [ ] **Step 3.1: Write failing test**

```typescript
// test/mutations/assets.test.ts
import { describe, it, expect } from 'vitest'
import { addAsset, removeAsset } from '#/mutations/assets.js'
import type { AiaProject, AiaAsset } from '#/core/types.js'

function makeProject(): AiaProject {
  return { _tag: 'AiaProject', name: 'Test', properties: {}, screens: [], assets: [], extensions: [] }
}

function makeAsset(name: string, content = new Uint8Array([1, 2, 3])): AiaAsset {
  return {
    name,
    type: name.split('.').pop() ?? '',
    sizeBytes: content.length,
    data: async () => content,
  }
}

describe('addAsset', () => {
  it('appends a new asset', () => {
    const project = makeProject()
    const result = addAsset(project, makeAsset('icon.png'))
    expect(result.diagnostics).toEqual([])
    expect(result.project.assets).toHaveLength(1)
    expect(result.project.assets[0].name).toBe('icon.png')
  })

  it('emits DUPLICATE_COMPONENT_NAME when asset name already exists', () => {
    const project = { ...makeProject(), assets: [makeAsset('icon.png')] }
    const result = addAsset(project, makeAsset('icon.png'))
    expect(result.diagnostics[0].code).toBe('DUPLICATE_COMPONENT_NAME')
    expect(result.project.assets).toHaveLength(1)
  })

  it('does not mutate the original project', () => {
    const project = makeProject()
    addAsset(project, makeAsset('icon.png'))
    expect(project.assets).toHaveLength(0)
  })
})

describe('removeAsset', () => {
  it('removes an existing asset', () => {
    const project = { ...makeProject(), assets: [makeAsset('icon.png'), makeAsset('bg.jpg')] }
    const result = removeAsset(project, 'icon.png')
    expect(result.diagnostics).toEqual([])
    expect(result.project.assets).toHaveLength(1)
    expect(result.project.assets[0].name).toBe('bg.jpg')
  })

  it('emits MISSING_ASSET_REF for unknown asset name', () => {
    const project = makeProject()
    const result = removeAsset(project, 'nonexistent.png')
    expect(result.diagnostics[0].code).toBe('MISSING_ASSET_REF')
    expect(result.project.assets).toHaveLength(0)
  })
})
```

- [ ] **Step 3.2: Run test to verify it fails**

```bash
pnpm exec vitest run test/mutations/assets.test.ts
```

Expected: FAIL — `Cannot find module '#/mutations/assets.js'`

- [ ] **Step 3.3: Write `src/mutations/assets.ts`**

```typescript
import type { AiaProject, AiaAsset, MutationResult } from '#/core/types.js'

export function addAsset(project: AiaProject, asset: AiaAsset): MutationResult {
  if (project.assets.some(a => a.name === asset.name)) {
    return {
      project,
      diagnostics: [{
        code: 'DUPLICATE_COMPONENT_NAME',
        severity: 'error',
        path: ['assets', asset.name],
        message: `Asset "${asset.name}" already exists`,
      }],
    }
  }
  return {
    project: { ...project, assets: [...project.assets, asset] },
    diagnostics: [],
  }
}

export function removeAsset(project: AiaProject, assetName: string): MutationResult {
  const idx = project.assets.findIndex(a => a.name === assetName)
  if (idx === -1) {
    return {
      project,
      diagnostics: [{
        code: 'MISSING_ASSET_REF',
        severity: 'error',
        path: ['assets', assetName],
        message: `Asset "${assetName}" not found`,
      }],
    }
  }
  return {
    project: { ...project, assets: project.assets.filter(a => a.name !== assetName) },
    diagnostics: [],
  }
}
```

- [ ] **Step 3.4: Run tests to verify pass**

```bash
pnpm exec vitest run test/mutations/assets.test.ts
```

Expected: PASS (5 tests)

- [ ] **Step 3.5: Commit**

```bash
git add src/mutations/assets.ts test/mutations/assets.test.ts
git commit -m "feat(v2): add addAsset, removeAsset mutations"
```

---

## Task 4: Extension Mutations

**Files:**
- Create: `src/mutations/extensions.ts`
- Create: `test/mutations/extensions.test.ts`

`addExtension` — appends an extension, emits `VERSION_MISMATCH` if the same `packageName` already exists.
`removeExtension` — removes by `packageName`, emits `VERSION_MISMATCH` if not found.

`VERSION_MISMATCH` is the closest available code for "extension already registered / not found" — it signals an inconsistency in the extension registry.

- [ ] **Step 4.1: Write failing test**

```typescript
// test/mutations/extensions.test.ts
import { describe, it, expect } from 'vitest'
import { addExtension, removeExtension } from '#/mutations/extensions.js'
import type { AiaProject, AiaExtension } from '#/core/types.js'

function makeProject(): AiaProject {
  return { _tag: 'AiaProject', name: 'Test', properties: {}, screens: [], assets: [], extensions: [] }
}

function makeExtension(packageName: string, version = 1): AiaExtension {
  return {
    packageName,
    version,
    minSdk: 7,
    components: [],
    manifest: { packageName, version, minSdk: 7, buildVersion: '1', permissions: [] },
    loadClasses: async () => new Uint8Array(),
    loadAssets: async () => [],
  }
}

describe('addExtension', () => {
  it('appends a new extension', () => {
    const project = makeProject()
    const result = addExtension(project, makeExtension('com.example.Foo'))
    expect(result.diagnostics).toEqual([])
    expect(result.project.extensions).toHaveLength(1)
    expect(result.project.extensions[0].packageName).toBe('com.example.Foo')
  })

  it('emits VERSION_MISMATCH when packageName already exists', () => {
    const project = { ...makeProject(), extensions: [makeExtension('com.example.Foo')] }
    const result = addExtension(project, makeExtension('com.example.Foo', 2))
    expect(result.diagnostics[0].code).toBe('VERSION_MISMATCH')
    expect(result.project.extensions).toHaveLength(1)
  })

  it('does not mutate the original project', () => {
    const project = makeProject()
    addExtension(project, makeExtension('com.example.Foo'))
    expect(project.extensions).toHaveLength(0)
  })
})

describe('removeExtension', () => {
  it('removes an existing extension', () => {
    const project = { ...makeProject(), extensions: [makeExtension('com.example.Foo'), makeExtension('com.example.Bar')] }
    const result = removeExtension(project, 'com.example.Foo')
    expect(result.diagnostics).toEqual([])
    expect(result.project.extensions).toHaveLength(1)
    expect(result.project.extensions[0].packageName).toBe('com.example.Bar')
  })

  it('emits VERSION_MISMATCH for unknown package name', () => {
    const project = makeProject()
    const result = removeExtension(project, 'com.example.Missing')
    expect(result.diagnostics[0].code).toBe('VERSION_MISMATCH')
  })
})
```

- [ ] **Step 4.2: Run test to verify it fails**

```bash
pnpm exec vitest run test/mutations/extensions.test.ts
```

Expected: FAIL — `Cannot find module '#/mutations/extensions.js'`

- [ ] **Step 4.3: Write `src/mutations/extensions.ts`**

```typescript
import type { AiaProject, AiaExtension, MutationResult } from '#/core/types.js'

export function addExtension(project: AiaProject, extension: AiaExtension): MutationResult {
  if (project.extensions.some(e => e.packageName === extension.packageName)) {
    return {
      project,
      diagnostics: [{
        code: 'VERSION_MISMATCH',
        severity: 'error',
        path: ['extensions', extension.packageName],
        message: `Extension "${extension.packageName}" is already registered — remove it first to replace`,
      }],
    }
  }
  return {
    project: { ...project, extensions: [...project.extensions, extension] },
    diagnostics: [],
  }
}

export function removeExtension(project: AiaProject, packageName: string): MutationResult {
  const idx = project.extensions.findIndex(e => e.packageName === packageName)
  if (idx === -1) {
    return {
      project,
      diagnostics: [{
        code: 'VERSION_MISMATCH',
        severity: 'error',
        path: ['extensions', packageName],
        message: `Extension "${packageName}" not found`,
      }],
    }
  }
  return {
    project: { ...project, extensions: project.extensions.filter(e => e.packageName !== packageName) },
    diagnostics: [],
  }
}
```

- [ ] **Step 4.4: Run tests to verify pass**

```bash
pnpm exec vitest run test/mutations/extensions.test.ts
```

Expected: PASS (5 tests)

- [ ] **Step 4.5: Commit**

```bash
git add src/mutations/extensions.ts test/mutations/extensions.test.ts
git commit -m "feat(v2): add addExtension, removeExtension mutations"
```

---

## Task 5: Project Merge

**Files:**
- Create: `src/mutations/projects.ts`
- Create: `test/mutations/projects.test.ts`

`mergeProjects` merges all screens, assets, and optionally extensions from `source` into `target`.

`MergeOptions`:
- `screenConflict: 'skip' | 'overwrite' | 'rename'` — what to do when a screen name collides. `'rename'` appends `_2`, `_3`, etc. until unique.
- `assetConflict: 'skip' | 'overwrite'` — what to do when an asset name collides.
- `includeExtensions: boolean` — whether to merge extensions (skips duplicates by packageName).

- [ ] **Step 5.1: Write failing test**

```typescript
// test/mutations/projects.test.ts
import { describe, it, expect } from 'vitest'
import { mergeProjects } from '#/mutations/projects.js'
import { parseScm } from '#/components/scm-parser.js'
import type { AiaProject, AiaScreen, AiaAsset, AiaExtension } from '#/core/types.js'

const EMPTY_BKY = `<xml xmlns="https://developers.google.com/blockly/xml"></xml>`

function makeSCM(screenName: string): string {
  return `#|\n$JSON\n{"authURL":["aia-kit"],"YaVersion":"1","Source":"Form","Properties":{"$Name":"${screenName}","$Type":"Form","Uuid":"-1","Title":"${screenName}","$Components":[]}}\n|#`
}

function makeScreen(name: string): AiaScreen {
  return { name, scm: makeSCM(name), bky: EMPTY_BKY, yail: null }
}

function makeAsset(name: string): AiaAsset {
  return { name, type: 'png', sizeBytes: 3, data: async () => new Uint8Array([1, 2, 3]) }
}

function makeExtension(packageName: string): AiaExtension {
  return {
    packageName, version: 1, minSdk: 7, components: [],
    manifest: { packageName, version: 1, minSdk: 7, buildVersion: '1', permissions: [] },
    loadClasses: async () => new Uint8Array(),
    loadAssets: async () => [],
  }
}

function makeProject(screens: string[], assets: string[] = [], extensions: string[] = []): AiaProject {
  return {
    _tag: 'AiaProject', name: 'Test', properties: {},
    screens: screens.map(makeScreen),
    assets: assets.map(makeAsset),
    extensions: extensions.map(makeExtension),
  }
}

describe('mergeProjects — screens', () => {
  it('adds non-conflicting screens from source', () => {
    const target = makeProject(['Screen1'])
    const source = makeProject(['Screen2'])
    const result = mergeProjects(target, source, { screenConflict: 'skip', assetConflict: 'skip', includeExtensions: false })
    expect(result.diagnostics).toEqual([])
    expect(result.project.screens.map(s => s.name)).toEqual(['Screen1', 'Screen2'])
  })

  it('skip — ignores conflicting screens', () => {
    const target = makeProject(['Screen1'])
    const source = makeProject(['Screen1', 'Screen2'])
    const result = mergeProjects(target, source, { screenConflict: 'skip', assetConflict: 'skip', includeExtensions: false })
    expect(result.project.screens).toHaveLength(2)
    expect(result.project.screens.map(s => s.name)).toContain('Screen2')
  })

  it('overwrite — replaces conflicting screens', () => {
    const target = makeProject(['Screen1'])
    const source = makeProject(['Screen1'])
    source.screens[0] = { ...source.screens[0], bky: '<xml>updated</xml>' }
    const result = mergeProjects(target, source, { screenConflict: 'overwrite', assetConflict: 'skip', includeExtensions: false })
    expect(result.project.screens).toHaveLength(1)
    expect(result.project.screens[0].bky).toBe('<xml>updated</xml>')
  })

  it('rename — appends _2 to avoid conflict', () => {
    const target = makeProject(['Screen1'])
    const source = makeProject(['Screen1'])
    const result = mergeProjects(target, source, { screenConflict: 'rename', assetConflict: 'skip', includeExtensions: false })
    expect(result.project.screens).toHaveLength(2)
    expect(result.project.screens[1].name).toBe('Screen1_2')
    const root = parseScm(result.project.screens[1].scm)
    expect(root.name).toBe('Screen1_2')
  })

  it('rename — increments suffix until unique', () => {
    const target = makeProject(['Screen1', 'Screen1_2'])
    const source = makeProject(['Screen1'])
    const result = mergeProjects(target, source, { screenConflict: 'rename', assetConflict: 'skip', includeExtensions: false })
    expect(result.project.screens.map(s => s.name)).toContain('Screen1_3')
  })
})

describe('mergeProjects — assets', () => {
  it('adds non-conflicting assets', () => {
    const target = makeProject([], ['a.png'])
    const source = makeProject([], ['b.png'])
    const result = mergeProjects(target, source, { screenConflict: 'skip', assetConflict: 'skip', includeExtensions: false })
    expect(result.project.assets.map(a => a.name)).toEqual(['a.png', 'b.png'])
  })

  it('skip — ignores conflicting assets', () => {
    const target = makeProject([], ['a.png'])
    const source = makeProject([], ['a.png'])
    const result = mergeProjects(target, source, { screenConflict: 'skip', assetConflict: 'skip', includeExtensions: false })
    expect(result.project.assets).toHaveLength(1)
  })

  it('overwrite — replaces conflicting assets', () => {
    const newContent = new Uint8Array([9, 9, 9])
    const target = makeProject([], ['a.png'])
    const source: AiaProject = {
      ...makeProject([], []),
      assets: [{ name: 'a.png', type: 'png', sizeBytes: 3, data: async () => newContent }],
    }
    const result = mergeProjects(target, source, { screenConflict: 'skip', assetConflict: 'overwrite', includeExtensions: false })
    expect(result.project.assets).toHaveLength(1)
    expect(result.project.assets[0].sizeBytes).toBe(3)
  })
})

describe('mergeProjects — extensions', () => {
  it('merges extensions when includeExtensions is true', () => {
    const target = makeProject([], [], ['com.a.A'])
    const source = makeProject([], [], ['com.b.B'])
    const result = mergeProjects(target, source, { screenConflict: 'skip', assetConflict: 'skip', includeExtensions: true })
    expect(result.project.extensions.map(e => e.packageName)).toEqual(['com.a.A', 'com.b.B'])
  })

  it('skips duplicate extensions by packageName', () => {
    const target = makeProject([], [], ['com.a.A'])
    const source = makeProject([], [], ['com.a.A'])
    const result = mergeProjects(target, source, { screenConflict: 'skip', assetConflict: 'skip', includeExtensions: true })
    expect(result.project.extensions).toHaveLength(1)
  })

  it('does not merge extensions when includeExtensions is false', () => {
    const target = makeProject([], [], [])
    const source = makeProject([], [], ['com.b.B'])
    const result = mergeProjects(target, source, { screenConflict: 'skip', assetConflict: 'skip', includeExtensions: false })
    expect(result.project.extensions).toHaveLength(0)
  })
})
```

- [ ] **Step 5.2: Run test to verify it fails**

```bash
pnpm exec vitest run test/mutations/projects.test.ts
```

Expected: FAIL — `Cannot find module '#/mutations/projects.js'`

- [ ] **Step 5.3: Write `src/mutations/projects.ts`**

```typescript
import { parseScm } from '#/components/scm-parser.js'
import { serializeScm } from '#/components/scm-serializer.js'
import type { AiaProject, AiaScreen, AiaExtension, MutationResult } from '#/core/types.js'

export interface MergeOptions {
  screenConflict: 'skip' | 'overwrite' | 'rename'
  assetConflict: 'skip' | 'overwrite'
  includeExtensions: boolean
}

export function mergeProjects(
  target: AiaProject,
  source: AiaProject,
  options: MergeOptions,
): MutationResult {
  let screens = [...target.screens]
  let assets = [...target.assets]
  let extensions = [...target.extensions]

  for (const screen of source.screens) {
    const existingIdx = screens.findIndex(s => s.name === screen.name)
    if (existingIdx !== -1) {
      if (options.screenConflict === 'overwrite') {
        screens[existingIdx] = screen
      } else if (options.screenConflict === 'rename') {
        const uniqueName = findUniqueName(screen.name, screens.map(s => s.name))
        const root = parseScm(screen.scm)
        const newScm = serializeScm({ ...root, name: uniqueName }, screen.scm)
        screens.push({ ...screen, name: uniqueName, scm: newScm })
      }
      // 'skip' — do nothing
    } else {
      screens.push(screen)
    }
  }

  for (const asset of source.assets) {
    const existingIdx = assets.findIndex(a => a.name === asset.name)
    if (existingIdx !== -1) {
      if (options.assetConflict === 'overwrite') {
        assets[existingIdx] = asset
      }
      // 'skip' — do nothing
    } else {
      assets.push(asset)
    }
  }

  if (options.includeExtensions) {
    for (const ext of source.extensions) {
      if (!extensions.some(e => e.packageName === ext.packageName)) {
        extensions.push(ext)
      }
    }
  }

  return {
    project: { ...target, screens, assets, extensions },
    diagnostics: [],
  }
}

function findUniqueName(base: string, existing: string[]): string {
  let candidate = `${base}_2`
  let i = 2
  while (existing.includes(candidate)) {
    i++
    candidate = `${base}_${i}`
  }
  return candidate
}
```

- [ ] **Step 5.4: Run tests to verify pass**

```bash
pnpm exec vitest run test/mutations/projects.test.ts
```

Expected: PASS (11 tests)

- [ ] **Step 5.5: Commit**

```bash
git add src/mutations/projects.ts test/mutations/projects.test.ts
git commit -m "feat(v2): add mergeProjects mutation with MergeOptions"
```

---

## Task 6: Public Exports

**Files:**
- Create: `src/mutations/index.ts`
- Modify: `src/index.ts`

Expose all mutation functions and `MergeOptions` via the main package and the `aia-kit/mutations` subpath.

- [ ] **Step 6.1: Write `src/mutations/index.ts`**

```typescript
export { addScreen, removeScreen, cloneScreen } from '#/mutations/screens.js'
export { addComponent, removeComponent, updatePropertyWhere } from '#/mutations/components.js'
export { addAsset, removeAsset } from '#/mutations/assets.js'
export { addExtension, removeExtension } from '#/mutations/extensions.js'
export { mergeProjects } from '#/mutations/projects.js'
export type { MergeOptions } from '#/mutations/projects.js'
```

- [ ] **Step 6.1b: Add `./mutations` subpath to `package.json` exports**

In `package.json`, add `"./mutations": "./dist/src/mutations/index.js"` to the `"exports"` map:

```json
"exports": {
  ".":            "./dist/src/index.js",
  "./parse":      "./dist/src/parse.js",
  "./resolve":    "./dist/src/resolve.js",
  "./write":      "./dist/src/write.js",
  "./mutations":  "./dist/src/mutations/index.js"
},
```

- [ ] **Step 6.2: Add mutations block to `src/index.ts`**

After the existing component tree utilities export block, add:

```typescript
// Structural mutations
export { addScreen, removeScreen, cloneScreen } from '#/mutations/screens.js'
export { addComponent, removeComponent, updatePropertyWhere } from '#/mutations/components.js'
export { addAsset, removeAsset } from '#/mutations/assets.js'
export { addExtension, removeExtension } from '#/mutations/extensions.js'
export { mergeProjects } from '#/mutations/projects.js'
export type { MergeOptions } from '#/mutations/projects.js'
```

- [ ] **Step 6.3: Build to verify TypeScript compiles**

```bash
pnpm build
```

Expected: Clean compile with no errors.

- [ ] **Step 6.4: Run the full test suite**

```bash
pnpm test
```

Expected: All tests pass (previous 69 + new 48 = 117 total).

- [ ] **Step 6.5: Commit**

```bash
git add src/mutations/index.ts src/index.ts package.json
git commit -m "feat(v2): expose structural mutations in public API"
```

---

## Self-Review Checklist

### 1. Spec Coverage

| Spec requirement | Task |
|---|---|
| `addScreen`, `removeScreen`, `cloneScreen` | Task 1 |
| `addComponent`, `removeComponent` | Task 2 |
| `updatePropertyWhere` | Task 2 |
| `addAsset`, `removeAsset` | Task 3 |
| `addExtension`, `removeExtension` | Task 4 |
| `mergeProjects` + `MergeOptions` | Task 5 |
| `serializeScm` (prerequisite) | Task 0 |
| All return `MutationResult` | All tasks |

Items from spec excluded from M2a (belong to M3):
- `applyScreenTemplate` — M3 (Screen templates)

### 2. Type Consistency

| Type | Defined in | Used correctly in |
|---|---|---|
| `AiaProject` | `src/core/types.ts` | All mutation files |
| `AiaScreen` | `src/core/types.ts` | `screens.ts`, `components.ts` |
| `AiaComponent` | `src/core/types.ts` | `components.ts`, `scm-serializer.ts` |
| `AiaAsset` | `src/core/types.ts` | `assets.ts` |
| `AiaExtension` | `src/core/types.ts` | `extensions.ts`, `projects.ts` |
| `MutationResult` | `src/core/types.ts` | All mutation functions |
| `Diagnostic` | `src/core/diagnostics.ts` | `components.ts` (helper fns) |
| `MergeOptions` | `src/mutations/projects.ts` | Exported via `mutations/index.ts` |
