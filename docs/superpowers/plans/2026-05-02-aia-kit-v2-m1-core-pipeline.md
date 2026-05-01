# aia-kit v2 — Milestone 1: Core Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the foundational v2 core pipeline — raw types, model types, diagnostics, error hierarchy, block lens, component tree utilities, Environment, parseAia, parseAix, resolve, writeAia, and parseAndResolve — replacing the v1 class-based API with the spec's plain-data + pure-functions design.

**Architecture:** Two-layer type system (raw `Aia*` / model `Model*`) connected by a pure `resolve()` function that requires an `Environment`. All mutations return `MutationResult`; all data-level problems surface as `Diagnostic[]`; throws are reserved for hard IO failures. All v1 source files are deleted in Task 0 before any new code is written — this is a clean-slate rewrite.

**Tech Stack:** TypeScript, Vitest, `@zip.js/zip.js` for ZIP I/O, `@xmldom/xmldom` for BKY XML parsing, `properties-file` for project.properties parsing.

---

## Scope Note

This plan covers **Milestone 1 only**. Milestones 2 (Mutations & Analysis) and 3 (Migration & Export) from the v2 design spec are separate follow-on plans.

---

## File Map

### Create (new)
| File | Responsibility |
|---|---|
| `src/core/types.ts` | Raw layer types: `AiaProject`, `AiaScreen`, `AiaAsset`, `AixManifest`, `AixAsset`, `AiaExtension`, `AiaComponent`, `MutationResult` |
| `src/core/descriptors.ts` | `ComponentDescriptor` and related descriptor sub-types |
| `src/core/model.ts` | Model layer: `ModelProject`, `ModelScreen`, `ModelComponent`, `ComponentProperty` |
| `src/core/diagnostics.ts` | `Diagnostic`, `DiagnosticSeverity`, `DiagnosticCode`, `mergeReports` |
| `src/core/errors.ts` | Error hierarchy: `AiaKitError`, `AiaParseError`, `AiaZipError`, `AiaStructureError`, `AiaWriteError` |
| `src/core/environment.ts` | `Environment` class |
| `src/blocks/ast.ts` | `BlockAst`, `BlockNode` types |
| `src/blocks/bky-parser.ts` | `BkyParser` — internal XML ↔ `BlockAst` (not exported from index) |
| `src/blocks/lens.ts` | Block lens public API: `queryBlocks`, `updateBlocks`, `updateAllScreenBlocks`, `parseBlocks`, `serializeBlocks`, `updateScreenBky` |
| `src/components/scm-parser.ts` | `ScmParser` — internal SCM JSON → `AiaComponent` (not exported from index) |
| `src/components/tree.ts` | Component tree utilities: `getParent`, `getComponentPath`, `getComponentsByType`, `findComponent` |
| `src/parse.ts` | `parseAia`, `parseAix`, `parseAndResolve` |
| `src/resolve.ts` | `resolve` |
| `src/write.ts` | `writeAia` |

### Delete (v1 — entire files/directories)
| Path | Note |
|---|---|
| `src/asset.ts` | v1 class |
| `src/component.ts` | v1 class |
| `src/ComponentMetadata.ts` | v1 class |
| `src/Environment.ts` | v1 class — replaced by `src/core/environment.ts` |
| `src/extension.ts` | v1 class |
| `src/file_structures.ts` | v1 constants |
| `src/project.ts` | v1 class |
| `src/reader.ts` | v1 reader — replaced by `src/parse.ts` |
| `src/screen.ts` | v1 class |
| `src/types.ts` | v1 types — replaced by `src/core/types.ts` |
| `src/types.zod.ts` | v1 Zod schemas (if present) |
| `src/property_processor.ts` | v1 utility (if present) |
| `src/writer.ts` | v1 writer — replaced by `src/write.ts` |
| `src/parsers/` | v1 BkyParser, ScmParser — replaced by `src/blocks/` and `src/components/` |
| `src/generators/` | v1 YAIL generator — YAIL generation is Milestone 2 |
| `src/utils/` | v1 utilities — logic ported inline into new modules |
| `src/validators/` | v1 Zod validators — replaced by plain TypeScript interfaces |
| `test/aia.test.ts` | v1 test |
| `test/writer.test.ts` | v1 test |
| `test/generators/` | v1 YAIL tests |

**Keep:**
- `src/environments/kodular-creator/simple_components.json` — still referenced by `src/core/environment.ts`
- `src/environments/mit-app-inventor/simple_components.json` — same
- `test/fixtures/` — fixture AIA files used by all v2 tests
- `src/index.ts` — rewritten in Task 14

### Modify (existing)
| File | Change |
|---|---|
| `src/index.ts` | Replace v1 exports with v2 public API |
| `package.json` | Update `exports` map to v2 subpath structure |

### Test files (new)
| File | Covers |
|---|---|
| `test/v2/core/diagnostics.test.ts` | `mergeReports` |
| `test/v2/core/errors.test.ts` | Error hierarchy `instanceof` chain |
| `test/v2/blocks/bky-parser.test.ts` | BKY parse → serialize round-trip |
| `test/v2/blocks/lens.test.ts` | `queryBlocks`, `updateBlocks`, `parseBlocks`, `serializeBlocks` |
| `test/v2/components/scm-parser.test.ts` | SCM string → `AiaComponent` tree |
| `test/v2/components/tree.test.ts` | `getParent`, `findComponent`, `getComponentsByType`, `getComponentPath` |
| `test/v2/core/environment.test.ts` | `lookup`, `withExtension` |
| `test/v2/parse.test.ts` | `parseAia` with fixtures |
| `test/v2/resolve.test.ts` | `resolve` produces `ModelProject` with correct diagnostics |
| `test/v2/write.test.ts` | `writeAia` produces readable ZIP |
| `test/v2/round-trip.test.ts` | `parseAia` → `writeAia` → `parseAia` equality |

---

## Task 0: Delete All v1 Source Files

**Files:** See "Delete" section in File Map above.

This is a clean-slate rewrite. Remove all v1 code before writing any v2 code so there is no ambiguity about which layer is in effect.

- [ ] **Step 0.1: Delete v1 source files**

```bash
rm src/asset.ts src/component.ts src/ComponentMetadata.ts src/Environment.ts \
   src/extension.ts src/file_structures.ts src/project.ts src/reader.ts \
   src/screen.ts src/types.ts src/writer.ts
# Remove if present (not in all repo states):
rm -f src/types.zod.ts src/property_processor.ts
rm -rf src/parsers src/generators src/utils src/validators
```

- [ ] **Step 0.2: Delete v1 tests**

```bash
rm test/aia.test.ts test/writer.test.ts
rm -rf test/generators
```

- [ ] **Step 0.3: Clear src/index.ts to a blank file (will be rewritten in Task 14)**

```bash
echo "// v2 exports — see Task 14" > src/index.ts
```

- [ ] **Step 0.4: Verify the build fails as expected (nothing left to compile)**

```bash
pnpm build 2>&1 | head -20
```

Expected: TypeScript errors about missing modules in `src/index.ts` re-exports or a clean compile with the stub index — either is fine. The goal is confirming v1 is gone.

- [ ] **Step 0.5: Commit**

```bash
git add -A
git commit -m "chore(v2): delete all v1 source files — clean-slate rewrite"
```

---

## Task 1: Core Raw Types

**Files:**
- Create: `src/core/types.ts`
- Create: `src/core/descriptors.ts`

- [ ] **Step 1.1: Write `src/core/descriptors.ts`**

```typescript
export interface ComponentDescriptorParam {
  name: string
  type: string
}

export interface ComponentPropertyDescriptor {
  name: string
  editorType: string
  defaultValue: string
  propertyType?: string
  editorArgs?: unknown[]
}

export interface ComponentBlockPropertyDescriptor {
  name: string
  description: string
  type: string
  rw: string
  deprecated: boolean
}

export interface ComponentEventDescriptor {
  name: string
  description: string
  deprecated: boolean
  params: ComponentDescriptorParam[]
}

export interface ComponentMethodDescriptor {
  name: string
  description: string
  deprecated: boolean
  params: ComponentDescriptorParam[]
  returnType?: string
}

export interface ComponentDescriptor {
  type: string
  name: string
  external: boolean
  version: number
  categoryString: string
  helpString: string
  showOnPalette: boolean
  nonVisible: boolean
  iconName: string
  properties: ComponentPropertyDescriptor[]
  blockProperties: ComponentBlockPropertyDescriptor[]
  events: ComponentEventDescriptor[]
  methods: ComponentMethodDescriptor[]
}
```

- [ ] **Step 1.2: Write `src/core/types.ts`**

```typescript
import type { ComponentDescriptor } from './descriptors.js'

export interface AiaProject {
  readonly _tag: 'AiaProject'
  name: string
  properties: Record<string, string>
  screens: AiaScreen[]
  assets: AiaAsset[]
  extensions: AiaExtension[]
}

export interface AiaScreen {
  name: string
  scm: string
  bky: string
  yail: string | null
}

export interface AiaAsset {
  name: string
  type: string
  sizeBytes: number
  data(): Promise<Uint8Array>
}

export interface AixManifest {
  packageName: string
  version: number
  minSdk: number
  buildVersion: string
  permissions: string[]
}

export interface AixAsset {
  name: string
  data(): Promise<Uint8Array>
}

export interface AiaExtension {
  packageName: string
  version: number
  minSdk: number
  components: ComponentDescriptor[]
  manifest: AixManifest
  loadClasses(): Promise<Uint8Array>
  loadAssets(): Promise<AixAsset[]>
}

export interface AiaComponent {
  name: string
  type: string
  uid: string
  properties: Record<string, string>
  children: AiaComponent[]
}

export interface MutationResult {
  project: AiaProject
  diagnostics: import('./diagnostics.js').Diagnostic[]
}
```

> **Note:** `MutationResult` references `Diagnostic` from diagnostics.ts (created in Task 4). TypeScript resolves this lazily via the import type. Alternatively, move `MutationResult` to `diagnostics.ts` after Task 4 — either works. The plan keeps it in `types.ts` matching the spec.

- [ ] **Step 1.3: Commit**

```bash
git add src/core/types.ts src/core/descriptors.ts
git commit -m "feat(v2): add raw layer types and ComponentDescriptor"
```

---

## Task 2: Model Layer Types

**Files:**
- Create: `src/core/model.ts`

- [ ] **Step 2.1: Write `src/core/model.ts`**

```typescript
import type { AiaProject, AiaScreen } from './types.js'
import type { ComponentDescriptor, ComponentPropertyDescriptor } from './descriptors.js'
import type { Diagnostic } from './diagnostics.js'
import type { Environment } from './environment.js'

export interface ModelProject {
  readonly _tag: 'ModelProject'
  source: AiaProject
  environment: Environment
  screens: ModelScreen[]
  diagnostics: Diagnostic[]
}

export interface ModelScreen {
  source: AiaScreen
  name: string
  form: ModelComponent
}

export interface ModelComponent {
  name: string
  type: string
  uid: string
  descriptor: ComponentDescriptor
  properties: ComponentProperty[]
  children: ModelComponent[]
}

export interface ComponentProperty {
  name: string
  value: string
  descriptor: ComponentPropertyDescriptor | null
}
```

> **Note:** `Environment` import is a forward reference — create environment.ts in Task 7. TypeScript import types are resolved at declaration, not usage, so this compiles once all files exist.

- [ ] **Step 2.2: Commit**

```bash
git add src/core/model.ts
git commit -m "feat(v2): add model layer types"
```

---

## Task 3: Diagnostics System

**Files:**
- Create: `src/core/diagnostics.ts`
- Create: `test/v2/core/diagnostics.test.ts`

- [ ] **Step 3.1: Write failing test**

```typescript
// test/v2/core/diagnostics.test.ts
import { describe, it, expect } from 'vitest'
import { mergeReports } from '../../../src/core/diagnostics.js'
import type { Diagnostic } from '../../../src/core/diagnostics.js'

describe('mergeReports', () => {
  it('merges empty arrays', () => {
    expect(mergeReports()).toEqual([])
  })

  it('merges multiple arrays into a flat array', () => {
    const a: Diagnostic[] = [
      { code: 'MISSING_SCREEN_FILE', severity: 'error', path: ['screens', 'Screen1'], message: 'missing' }
    ]
    const b: Diagnostic[] = [
      { code: 'ORPHANED_BLOCK', severity: 'warning', path: ['screens', 'Screen2'], message: 'orphaned' }
    ]
    expect(mergeReports(a, b)).toEqual([...a, ...b])
  })

  it('preserves order', () => {
    const d1: Diagnostic = { code: 'MALFORMED_SCM', severity: 'error', path: [], message: 'bad scm' }
    const d2: Diagnostic = { code: 'MALFORMED_BKY', severity: 'error', path: [], message: 'bad bky' }
    expect(mergeReports([d1], [d2])).toEqual([d1, d2])
  })
})
```

- [ ] **Step 3.2: Run test to verify it fails**

```bash
pnpm exec vitest run test/v2/core/diagnostics.test.ts
```

Expected: FAIL — `Cannot find module '../../../src/core/diagnostics.js'`

- [ ] **Step 3.3: Write `src/core/diagnostics.ts`**

```typescript
export type DiagnosticSeverity = 'error' | 'warning' | 'info'

export type DiagnosticCode =
  | 'MISSING_SCREEN_FILE'
  | 'UNRESOLVABLE_COMPONENT'
  | 'INVALID_PROPERTY'
  | 'DUPLICATE_COMPONENT_NAME'
  | 'ORPHANED_BLOCK'
  | 'VERSION_MISMATCH'
  | 'MISSING_ASSET_REF'
  | 'MALFORMED_SCM'
  | 'MALFORMED_BKY'
  | 'PLATFORM_INCOMPATIBLE_COMPONENT'
  | 'PLATFORM_INCOMPATIBLE_PROPERTY'
  | 'EXTENSION_BREAKING_CHANGE'

export interface Diagnostic {
  code: DiagnosticCode
  severity: DiagnosticSeverity
  path: string[]
  message: string
}

export const mergeReports = (...reports: Diagnostic[][]): Diagnostic[] => reports.flat()
```

- [ ] **Step 3.4: Run tests to verify pass**

```bash
pnpm exec vitest run test/v2/core/diagnostics.test.ts
```

Expected: PASS (3 tests)

- [ ] **Step 3.5: Commit**

```bash
git add src/core/diagnostics.ts test/v2/core/diagnostics.test.ts
git commit -m "feat(v2): add diagnostics system with mergeReports"
```

---

## Task 4: Error Hierarchy

**Files:**
- Create: `src/core/errors.ts`
- Create: `test/v2/core/errors.test.ts`

- [ ] **Step 4.1: Write failing test**

```typescript
// test/v2/core/errors.test.ts
import { describe, it, expect } from 'vitest'
import {
  AiaKitError,
  AiaParseError,
  AiaZipError,
  AiaStructureError,
  AiaWriteError
} from '../../../src/core/errors.js'

describe('error hierarchy', () => {
  it('AiaZipError is instanceof AiaParseError and AiaKitError', () => {
    const e = new AiaZipError('bad zip', new Error('cause'))
    expect(e).toBeInstanceOf(AiaZipError)
    expect(e).toBeInstanceOf(AiaParseError)
    expect(e).toBeInstanceOf(AiaKitError)
    expect(e).toBeInstanceOf(Error)
  })

  it('AiaStructureError is instanceof AiaParseError and AiaKitError', () => {
    const e = new AiaStructureError('bad structure', new Error('cause'))
    expect(e).toBeInstanceOf(AiaStructureError)
    expect(e).toBeInstanceOf(AiaParseError)
    expect(e).toBeInstanceOf(AiaKitError)
  })

  it('AiaWriteError is instanceof AiaKitError but not AiaParseError', () => {
    const e = new AiaWriteError('write failed')
    expect(e).toBeInstanceOf(AiaWriteError)
    expect(e).toBeInstanceOf(AiaKitError)
    expect(e).not.toBeInstanceOf(AiaParseError)
  })

  it('preserves cause', () => {
    const cause = new Error('original')
    const e = new AiaZipError('wrapped', cause)
    expect(e.cause).toBe(cause)
  })
})
```

- [ ] **Step 4.2: Run test to verify it fails**

```bash
pnpm exec vitest run test/v2/core/errors.test.ts
```

Expected: FAIL — `Cannot find module '../../../src/core/errors.js'`

- [ ] **Step 4.3: Write `src/core/errors.ts`**

```typescript
export class AiaKitError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AiaKitError'
  }
}

export class AiaParseError extends AiaKitError {
  cause: unknown
  constructor(message: string, cause: unknown) {
    super(message)
    this.name = 'AiaParseError'
    this.cause = cause
  }
}

export class AiaZipError extends AiaParseError {
  constructor(message: string, cause: unknown) {
    super(message, cause)
    this.name = 'AiaZipError'
  }
}

export class AiaStructureError extends AiaParseError {
  constructor(message: string, cause: unknown) {
    super(message, cause)
    this.name = 'AiaStructureError'
  }
}

export class AiaWriteError extends AiaKitError {
  constructor(message: string) {
    super(message)
    this.name = 'AiaWriteError'
  }
}
```

- [ ] **Step 4.4: Run tests to verify pass**

```bash
pnpm exec vitest run test/v2/core/errors.test.ts
```

Expected: PASS (4 tests)

- [ ] **Step 4.5: Commit**

```bash
git add src/core/errors.ts test/v2/core/errors.test.ts
git commit -m "feat(v2): add error hierarchy"
```

---

## Task 5: BlockAst Types + BkyParser

**Files:**
- Create: `src/blocks/ast.ts`
- Create: `src/blocks/bky-parser.ts`
- Create: `test/v2/blocks/bky-parser.test.ts`

- [ ] **Step 5.1: Write failing test**

```typescript
// test/v2/blocks/bky-parser.test.ts
import { describe, it, expect } from 'vitest'
import { BkyParser } from '../../../src/blocks/bky-parser.js'

const SIMPLE_BKY = `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="text_print" id="b1" x="10" y="20">
    <value name="TEXT">
      <block type="text" id="b2">
        <field name="TEXT">Hello</field>
      </block>
    </value>
  </block>
</xml>`

const EMPTY_BKY = `<xml xmlns="https://developers.google.com/blockly/xml"></xml>`

describe('BkyParser', () => {
  describe('parse', () => {
    it('parses top-level blocks', () => {
      const ast = BkyParser.parse(SIMPLE_BKY)
      expect(ast.blocks).toHaveLength(1)
      expect(ast.blocks[0].type).toBe('text_print')
      expect(ast.blocks[0].id).toBe('b1')
      expect(ast.blocks[0].x).toBe(10)
      expect(ast.blocks[0].y).toBe(20)
    })

    it('parses nested value blocks', () => {
      const ast = BkyParser.parse(SIMPLE_BKY)
      const inner = ast.blocks[0].values['TEXT']
      expect(inner).toBeDefined()
      expect(inner.type).toBe('text')
      expect(inner.fields['TEXT']).toBe('Hello')
    })

    it('parses empty xml', () => {
      const ast = BkyParser.parse(EMPTY_BKY)
      expect(ast.blocks).toHaveLength(0)
    })

    it('throws on invalid XML', () => {
      expect(() => BkyParser.parse('not xml')).toThrow()
    })
  })

  describe('serialize', () => {
    it('round-trips through parse → serialize → parse', () => {
      const ast1 = BkyParser.parse(SIMPLE_BKY)
      const xml = BkyParser.serialize(ast1)
      const ast2 = BkyParser.parse(xml)
      expect(ast2.blocks).toHaveLength(ast1.blocks.length)
      expect(ast2.blocks[0].type).toBe(ast1.blocks[0].type)
      expect(ast2.blocks[0].fields).toEqual(ast1.blocks[0].fields)
      expect(ast2.blocks[0].values['TEXT'].fields['TEXT']).toBe('Hello')
    })

    it('serializes empty ast as xml element', () => {
      const ast = BkyParser.parse(EMPTY_BKY)
      const xml = BkyParser.serialize(ast)
      expect(xml).toMatch(/<xml/)
      expect(xml).toMatch(/<\/xml>/)
    })
  })
})
```

- [ ] **Step 5.2: Run test to verify it fails**

```bash
pnpm exec vitest run test/v2/blocks/bky-parser.test.ts
```

Expected: FAIL — `Cannot find module '../../../src/blocks/bky-parser.js'`

- [ ] **Step 5.3: Write `src/blocks/ast.ts`**

```typescript
export interface BlockNode {
  type: string
  id: string
  x?: number
  y?: number
  disabled?: boolean
  collapsed?: boolean
  fields: Record<string, string>
  values: Record<string, BlockNode>
  statements: Record<string, BlockNode>
  mutation: Record<string, string>
  next: BlockNode | null
}

export interface BlockAst {
  blocks: BlockNode[]
}
```

- [ ] **Step 5.4: Write `src/blocks/bky-parser.ts`**

```typescript
import { DOMParser } from '@xmldom/xmldom'
import type { BlockAst, BlockNode } from './ast.js'

type XMLElement = Element

export class BkyParser {
  static parse(bky: string): BlockAst {
    const doc = new DOMParser().parseFromString(bky, 'text/xml')
    const parseError = doc.getElementsByTagName('parsererror')[0]
    if (parseError) {
      throw new Error(`Invalid BKY XML: ${parseError.textContent}`)
    }
    const root = doc.getElementsByTagName('xml')[0] ?? doc.getElementsByTagName('XML')[0]
    if (!root) {
      throw new Error('BKY XML missing <xml> root element')
    }
    const blocks: BlockNode[] = []
    for (let i = 0; i < root.childNodes.length; i++) {
      const node = root.childNodes[i] as XMLElement
      if (node.nodeName === 'block') {
        blocks.push(parseBlock(node))
      }
    }
    return { blocks }
  }

  static serialize(ast: BlockAst): string {
    const parts: string[] = ['<xml xmlns="https://developers.google.com/blockly/xml">']
    for (const block of ast.blocks) {
      parts.push(serializeBlock(block, true))
    }
    parts.push('</xml>')
    return parts.join('\n')
  }
}

function parseBlock(el: XMLElement): BlockNode {
  const node: BlockNode = {
    type: el.getAttribute('type') ?? '',
    id: el.getAttribute('id') ?? '',
    x: el.hasAttribute('x') ? Number(el.getAttribute('x')) : undefined,
    y: el.hasAttribute('y') ? Number(el.getAttribute('y')) : undefined,
    disabled: el.getAttribute('disabled') === 'true' ? true : undefined,
    collapsed: el.getAttribute('collapsed') === 'true' ? true : undefined,
    fields: {},
    values: {},
    statements: {},
    mutation: {},
    next: null,
  }

  for (let i = 0; i < el.childNodes.length; i++) {
    const child = el.childNodes[i] as XMLElement
    switch (child.nodeName) {
      case 'field':
        node.fields[child.getAttribute('name') ?? ''] = child.textContent ?? ''
        break
      case 'value': {
        const innerBlock = firstBlockChild(child)
        if (innerBlock) node.values[child.getAttribute('name') ?? ''] = parseBlock(innerBlock)
        break
      }
      case 'statement': {
        const innerBlock = firstBlockChild(child)
        if (innerBlock) node.statements[child.getAttribute('name') ?? ''] = parseBlock(innerBlock)
        break
      }
      case 'mutation': {
        for (let j = 0; j < (child as XMLElement).attributes.length; j++) {
          const attr = (child as XMLElement).attributes[j]
          node.mutation[attr.name] = attr.value
        }
        break
      }
      case 'next': {
        const innerBlock = firstBlockChild(child)
        if (innerBlock) node.next = parseBlock(innerBlock)
        break
      }
    }
  }
  return node
}

function firstBlockChild(el: XMLElement): XMLElement | null {
  for (let i = 0; i < el.childNodes.length; i++) {
    const child = el.childNodes[i] as XMLElement
    if (child.nodeName === 'block') return child
  }
  return null
}

function serializeBlock(node: BlockNode, isTop: boolean): string {
  const attrs = [`type="${esc(node.type)}" id="${esc(node.id)}"`]
  if (isTop && node.x !== undefined) attrs.push(`x="${node.x}"`)
  if (isTop && node.y !== undefined) attrs.push(`y="${node.y}"`)
  if (node.disabled) attrs.push('disabled="true"')
  if (node.collapsed) attrs.push('collapsed="true"')

  const children: string[] = []

  if (Object.keys(node.mutation).length > 0) {
    const mutAttrs = Object.entries(node.mutation).map(([k, v]) => `${k}="${esc(v)}"`).join(' ')
    children.push(`<mutation ${mutAttrs}></mutation>`)
  }

  for (const [name, value] of Object.entries(node.fields)) {
    children.push(`<field name="${esc(name)}">${esc(value)}</field>`)
  }

  for (const [name, inner] of Object.entries(node.values)) {
    children.push(`<value name="${esc(name)}">${serializeBlock(inner, false)}</value>`)
  }

  for (const [name, inner] of Object.entries(node.statements)) {
    children.push(`<statement name="${esc(name)}">${serializeBlock(inner, false)}</statement>`)
  }

  if (node.next) {
    children.push(`<next>${serializeBlock(node.next, false)}</next>`)
  }

  return `<block ${attrs.join(' ')}>${children.join('')}</block>`
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
```

- [ ] **Step 5.5: Run tests to verify pass**

```bash
pnpm exec vitest run test/v2/blocks/bky-parser.test.ts
```

Expected: PASS (6 tests)

- [ ] **Step 5.6: Commit**

```bash
git add src/blocks/ast.ts src/blocks/bky-parser.ts test/v2/blocks/bky-parser.test.ts
git commit -m "feat(v2): add BlockAst types and BkyParser with serialize"
```

---

## Task 6: Block Lens

**Files:**
- Create: `src/blocks/lens.ts`
- Create: `test/v2/blocks/lens.test.ts`

- [ ] **Step 6.1: Write failing test**

```typescript
// test/v2/blocks/lens.test.ts
import { describe, it, expect } from 'vitest'
import {
  parseBlocks,
  serializeBlocks,
  queryBlocks,
  updateBlocks,
  updateAllScreenBlocks,
  updateScreenBky,
} from '../../../src/blocks/lens.js'
import type { AiaProject, AiaScreen } from '../../../src/core/types.js'

const SCREEN_BKY = `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="event_handler" id="e1" x="0" y="0">
    <field name="COMPONENT_SELECTOR">Button1</field>
    <field name="EVENT_NAME">Click</field>
  </block>
</xml>`

function makeProject(bky: string): AiaProject {
  const screen: AiaScreen = { name: 'Screen1', scm: '', bky, yail: null }
  return { _tag: 'AiaProject', name: 'Test', properties: {}, screens: [screen], assets: [], extensions: [] }
}

describe('parseBlocks / serializeBlocks', () => {
  it('parseBlocks returns a BlockAst', () => {
    const ast = parseBlocks(SCREEN_BKY)
    expect(ast.blocks).toHaveLength(1)
    expect(ast.blocks[0].type).toBe('event_handler')
  })

  it('serializeBlocks round-trips', () => {
    const ast = parseBlocks(SCREEN_BKY)
    const xml = serializeBlocks(ast)
    const ast2 = parseBlocks(xml)
    expect(ast2.blocks[0].type).toBe('event_handler')
  })
})

describe('queryBlocks', () => {
  it('queries block count from an AiaScreen', () => {
    const screen: AiaScreen = { name: 'Screen1', scm: '', bky: SCREEN_BKY, yail: null }
    const count = queryBlocks(screen, ast => ast.blocks.length)
    expect(count).toBe(1)
  })
})

describe('updateBlocks', () => {
  it('applies updater fn to named screen', () => {
    const project = makeProject(SCREEN_BKY)
    const result = updateBlocks(project, 'Screen1', ast => ({
      blocks: ast.blocks.map(b => ({ ...b, type: 'modified_block' }))
    }))
    expect(result.diagnostics).toEqual([])
    const updatedAst = parseBlocks(result.project.screens[0].bky)
    expect(updatedAst.blocks[0].type).toBe('modified_block')
  })

  it('accepts a pre-built BlockAst directly', () => {
    const project = makeProject(SCREEN_BKY)
    const newAst = parseBlocks(SCREEN_BKY)
    newAst.blocks[0] = { ...newAst.blocks[0], type: 'direct_ast' }
    const result = updateBlocks(project, 'Screen1', newAst)
    const updatedAst = parseBlocks(result.project.screens[0].bky)
    expect(updatedAst.blocks[0].type).toBe('direct_ast')
  })

  it('emits MISSING_SCREEN_FILE diagnostic for unknown screen', () => {
    const project = makeProject(SCREEN_BKY)
    const result = updateBlocks(project, 'NoSuchScreen', ast => ast)
    expect(result.diagnostics[0].code).toBe('MISSING_SCREEN_FILE')
  })
})

describe('updateAllScreenBlocks', () => {
  it('applies updater to all screens', () => {
    const screen2: AiaScreen = { name: 'Screen2', scm: '', bky: SCREEN_BKY, yail: null }
    const project: AiaProject = {
      _tag: 'AiaProject', name: 'Test', properties: {},
      screens: [
        { name: 'Screen1', scm: '', bky: SCREEN_BKY, yail: null },
        screen2,
      ],
      assets: [], extensions: []
    }
    const result = updateAllScreenBlocks(project, (ast, screenName) => ({
      blocks: ast.blocks.map(b => ({ ...b, type: `${screenName}_block` }))
    }))
    const ast1 = parseBlocks(result.project.screens[0].bky)
    const ast2 = parseBlocks(result.project.screens[1].bky)
    expect(ast1.blocks[0].type).toBe('Screen1_block')
    expect(ast2.blocks[0].type).toBe('Screen2_block')
  })
})

describe('updateScreenBky', () => {
  it('replaces bky string directly', () => {
    const project = makeProject(SCREEN_BKY)
    const newBky = `<xml xmlns="https://developers.google.com/blockly/xml"></xml>`
    const result = updateScreenBky(project, 'Screen1', newBky)
    expect(result.project.screens[0].bky).toBe(newBky)
    expect(result.diagnostics).toEqual([])
  })
})
```

- [ ] **Step 6.2: Run test to verify it fails**

```bash
pnpm exec vitest run test/v2/blocks/lens.test.ts
```

Expected: FAIL — `Cannot find module '../../../src/blocks/lens.js'`

- [ ] **Step 6.3: Write `src/blocks/lens.ts`**

```typescript
import { BkyParser } from './bky-parser.js'
import type { BlockAst } from './ast.js'
import type { AiaProject, AiaScreen } from '../core/types.js'
import type { Diagnostic } from '../core/diagnostics.js'

export type { BlockAst } from './ast.js'
export type { BlockNode } from './ast.js'

export function parseBlocks(bky: string): BlockAst {
  return BkyParser.parse(bky)
}

export function serializeBlocks(ast: BlockAst): string {
  return BkyParser.serialize(ast)
}

export function queryBlocks<T>(
  screen: AiaScreen | { source: AiaScreen },
  query: (ast: BlockAst) => T
): T {
  const bky = 'source' in screen ? screen.source.bky : screen.bky
  return query(BkyParser.parse(bky))
}

export function updateBlocks(
  project: AiaProject,
  screenName: string,
  astOrUpdater: BlockAst | ((ast: BlockAst) => BlockAst)
): { project: AiaProject; diagnostics: Diagnostic[] } {
  const screenIndex = project.screens.findIndex(s => s.name === screenName)
  if (screenIndex === -1) {
    return {
      project,
      diagnostics: [{
        code: 'MISSING_SCREEN_FILE',
        severity: 'error',
        path: ['screens', screenName],
        message: `Screen "${screenName}" not found`
      }]
    }
  }
  const screen = project.screens[screenIndex]
  const ast = typeof astOrUpdater === 'function'
    ? astOrUpdater(BkyParser.parse(screen.bky))
    : astOrUpdater
  const newScreens = [...project.screens]
  newScreens[screenIndex] = { ...screen, bky: BkyParser.serialize(ast) }
  return { project: { ...project, screens: newScreens }, diagnostics: [] }
}

export function updateAllScreenBlocks(
  project: AiaProject,
  updater: (ast: BlockAst, screenName: string) => BlockAst
): { project: AiaProject; diagnostics: Diagnostic[] } {
  const newScreens = project.screens.map(screen => {
    const ast = updater(BkyParser.parse(screen.bky), screen.name)
    return { ...screen, bky: BkyParser.serialize(ast) }
  })
  return { project: { ...project, screens: newScreens }, diagnostics: [] }
}

export function updateScreenBky(
  project: AiaProject,
  screenName: string,
  bky: string
): { project: AiaProject; diagnostics: Diagnostic[] } {
  const screenIndex = project.screens.findIndex(s => s.name === screenName)
  if (screenIndex === -1) {
    return {
      project,
      diagnostics: [{
        code: 'MISSING_SCREEN_FILE',
        severity: 'error',
        path: ['screens', screenName],
        message: `Screen "${screenName}" not found`
      }]
    }
  }
  const newScreens = [...project.screens]
  newScreens[screenIndex] = { ...newScreens[screenIndex], bky }
  return { project: { ...project, screens: newScreens }, diagnostics: [] }
}
```

- [ ] **Step 6.4: Run tests to verify pass**

```bash
pnpm exec vitest run test/v2/blocks/lens.test.ts
```

Expected: PASS (8 tests)

- [ ] **Step 6.5: Commit**

```bash
git add src/blocks/lens.ts test/v2/blocks/lens.test.ts
git commit -m "feat(v2): add block lens public API"
```

---

## Task 7: ScmParser

**Files:**
- Create: `src/components/scm-parser.ts`
- Create: `test/v2/components/scm-parser.test.ts`

The SCM format is a string wrapping a JSON blob: `#|\n$JSON\n{...}\n|#`. The JSON contains a `Properties` tree of nested components. The `uid` comes from the `Uuid` field; raw string properties from all non-`$`-prefixed keys excluding `$Components`.

- [ ] **Step 7.1: Write failing test**

```typescript
// test/v2/components/scm-parser.test.ts
import { describe, it, expect } from 'vitest'
import { ScmParser } from '../../../src/components/scm-parser.js'

const SCM = `#|
$JSON
{"authURL":["aia-kit"],"YaVersion":"1","Source":"Form","Properties":{"$Name":"Screen1","$Type":"Form","Uuid":"-1","Title":"Screen1","$Components":[{"$Name":"Button1","$Type":"Button","Uuid":"123","Text":"Click me","$Components":[]}]}}
|#`

describe('ScmParser', () => {
  describe('parse', () => {
    it('parses root form component', () => {
      const root = ScmParser.parse(SCM)
      expect(root.name).toBe('Screen1')
      expect(root.type).toBe('Form')
      expect(root.uid).toBe('-1')
    })

    it('parses child components', () => {
      const root = ScmParser.parse(SCM)
      expect(root.children).toHaveLength(1)
      expect(root.children[0].name).toBe('Button1')
      expect(root.children[0].type).toBe('Button')
      expect(root.children[0].uid).toBe('123')
    })

    it('parses component properties', () => {
      const root = ScmParser.parse(SCM)
      const button = root.children[0]
      expect(button.properties['Text']).toBe('Click me')
    })

    it('excludes $-prefixed keys from properties', () => {
      const root = ScmParser.parse(SCM)
      expect(root.properties).not.toHaveProperty('$Name')
      expect(root.properties).not.toHaveProperty('$Type')
      expect(root.properties).not.toHaveProperty('$Components')
    })

    it('throws on invalid SCM format', () => {
      expect(() => ScmParser.parse('no json block here')).toThrow()
    })
  })
})
```

- [ ] **Step 7.2: Run test to verify it fails**

```bash
pnpm exec vitest run test/v2/components/scm-parser.test.ts
```

Expected: FAIL — `Cannot find module '../../../src/components/scm-parser.js'`

- [ ] **Step 7.3: Write `src/components/scm-parser.ts`**

```typescript
import type { AiaComponent } from '../core/types.js'

interface RawComponentJson {
  $Name: string
  $Type: string
  Uuid: string
  $Components?: RawComponentJson[]
  [key: string]: unknown
}

interface ScmJson {
  YaVersion: string
  Source: string
  Properties: RawComponentJson
}

export class ScmParser {
  static parse(scm: string): AiaComponent {
    const match = scm.match(/#\|\s*\$JSON\s*([\s\S]*?)\s*\|#/)
    if (!match || !match[1]) {
      throw new Error('Invalid SCM format: no $JSON block found')
    }
    let data: ScmJson
    try {
      data = JSON.parse(match[1].trim())
    } catch (e) {
      throw new Error(`Invalid SCM format: JSON parse failed — ${e}`)
    }
    return parseComponent(data.Properties)
  }
}

function parseComponent(raw: RawComponentJson): AiaComponent {
  const properties: Record<string, string> = {}
  for (const [key, value] of Object.entries(raw)) {
    if (!key.startsWith('$') && key !== 'Uuid') {
      properties[key] = String(value)
    }
  }
  const children = (raw.$Components ?? []).map(parseComponent)
  return {
    name: raw.$Name,
    type: raw.$Type,
    uid: raw.Uuid,
    properties,
    children,
  }
}
```

- [ ] **Step 7.4: Run tests to verify pass**

```bash
pnpm exec vitest run test/v2/components/scm-parser.test.ts
```

Expected: PASS (5 tests)

- [ ] **Step 7.5: Commit**

```bash
git add src/components/scm-parser.ts test/v2/components/scm-parser.test.ts
git commit -m "feat(v2): add ScmParser — SCM string to AiaComponent tree"
```

---

## Task 8: Component Tree Utilities

**Files:**
- Create: `src/components/tree.ts`
- Create: `test/v2/components/tree.test.ts`

- [ ] **Step 8.1: Write failing test**

```typescript
// test/v2/components/tree.test.ts
import { describe, it, expect } from 'vitest'
import {
  findComponent,
  getComponentsByType,
  getParent,
  getComponentPath,
} from '../../../src/components/tree.js'
import type { ModelComponent } from '../../../src/core/model.js'

function makeModel(name: string, type: string, uid: string, children: ModelComponent[] = []): ModelComponent {
  return { name, type, uid, descriptor: {} as any, properties: [], children }
}

const leaf1 = makeModel('Button1', 'Button', 'uid-1')
const leaf2 = makeModel('Label1', 'Label', 'uid-2')
const inner = makeModel('HArrangement1', 'HorizontalArrangement', 'uid-3', [leaf1, leaf2])
const root = makeModel('Screen1', 'Form', 'uid-root', [inner])

describe('findComponent', () => {
  it('finds a direct child', () => {
    expect(findComponent(root, 'uid-3')).toBe(inner)
  })

  it('finds a deeply nested component', () => {
    expect(findComponent(root, 'uid-1')).toBe(leaf1)
  })

  it('returns null for unknown uid', () => {
    expect(findComponent(root, 'missing')).toBeNull()
  })

  it('finds root itself', () => {
    expect(findComponent(root, 'uid-root')).toBe(root)
  })
})

describe('getComponentsByType', () => {
  it('finds all components of a given type', () => {
    const buttons = getComponentsByType(root, 'Button')
    expect(buttons).toHaveLength(1)
    expect(buttons[0]).toBe(leaf1)
  })

  it('returns empty array when type not found', () => {
    expect(getComponentsByType(root, 'TextBox')).toHaveLength(0)
  })
})

describe('getParent', () => {
  it('returns parent of a direct child', () => {
    expect(getParent(root, inner)).toBe(root)
  })

  it('returns parent of a deeply nested component', () => {
    expect(getParent(root, leaf1)).toBe(inner)
  })

  it('returns null for root', () => {
    expect(getParent(root, root)).toBeNull()
  })

  it('returns null for unknown component', () => {
    const stranger = makeModel('X', 'Button', 'uid-x')
    expect(getParent(root, stranger)).toBeNull()
  })
})

describe('getComponentPath', () => {
  it('returns path from root to leaf', () => {
    const path = getComponentPath(root, 'uid-1')
    expect(path.map(c => c.uid)).toEqual(['uid-root', 'uid-3', 'uid-1'])
  })

  it('returns [root] for root uid', () => {
    const path = getComponentPath(root, 'uid-root')
    expect(path.map(c => c.uid)).toEqual(['uid-root'])
  })

  it('returns empty array when uid not found', () => {
    expect(getComponentPath(root, 'missing')).toEqual([])
  })
})
```

- [ ] **Step 8.2: Run test to verify it fails**

```bash
pnpm exec vitest run test/v2/components/tree.test.ts
```

Expected: FAIL — `Cannot find module '../../../src/components/tree.js'`

- [ ] **Step 8.3: Write `src/components/tree.ts`**

```typescript
import type { ModelComponent } from '../core/model.js'

export function findComponent(root: ModelComponent, uid: string): ModelComponent | null {
  if (root.uid === uid) return root
  for (const child of root.children) {
    const found = findComponent(child, uid)
    if (found) return found
  }
  return null
}

export function getComponentsByType(root: ModelComponent, type: string): ModelComponent[] {
  const results: ModelComponent[] = []
  if (root.type === type) results.push(root)
  for (const child of root.children) {
    results.push(...getComponentsByType(child, type))
  }
  return results
}

export function getParent(root: ModelComponent, target: ModelComponent): ModelComponent | null {
  if (root === target) return null
  for (const child of root.children) {
    if (child === target) return root
    const found = getParent(child, target)
    if (found) return found
  }
  return null
}

export function getComponentPath(root: ModelComponent, uid: string): ModelComponent[] {
  if (root.uid === uid) return [root]
  for (const child of root.children) {
    const subPath = getComponentPath(child, uid)
    if (subPath.length > 0) return [root, ...subPath]
  }
  return []
}
```

- [ ] **Step 8.4: Run tests to verify pass**

```bash
pnpm exec vitest run test/v2/components/tree.test.ts
```

Expected: PASS (10 tests)

- [ ] **Step 8.5: Commit**

```bash
git add src/components/tree.ts test/v2/components/tree.test.ts
git commit -m "feat(v2): add component tree utilities"
```

---

## Task 9: Environment Class

**Files:**
- Create: `src/core/environment.ts`
- Create: `test/v2/core/environment.test.ts`

The existing component JSON files live at `src/environments/kodular-creator/simple_components.json` and `src/environments/mit-app-inventor/simple_components.json`. The v2 Environment class will reference these same files via dynamic import — no file moves needed.

- [ ] **Step 9.1: Write failing test**

```typescript
// test/v2/core/environment.test.ts
import { describe, it, expect } from 'vitest'
import { Environment } from '../../../src/core/environment.js'
import type { AiaExtension } from '../../../src/core/types.js'
import type { ComponentDescriptor } from '../../../src/core/descriptors.js'

describe('Environment', () => {
  describe('kodularCreator', () => {
    it('loads without throwing', async () => {
      const env = await Environment.kodularCreator()
      expect(env).toBeDefined()
    })

    it('looks up a known built-in component type', async () => {
      const env = await Environment.kodularCreator()
      const desc = env.lookup('com.google.appinventor.components.runtime.Button')
      expect(desc).not.toBeNull()
      expect(desc?.name).toBe('Button')
    })

    it('returns null for unknown type', async () => {
      const env = await Environment.kodularCreator()
      expect(env.lookup('com.example.nonexistent.Widget')).toBeNull()
    })
  })

  describe('withExtension', () => {
    it('returns a new Environment with the extension components accessible', async () => {
      const env = await Environment.kodularCreator()
      const fakeDesc: ComponentDescriptor = {
        type: 'com.example.MyExt',
        name: 'MyExt',
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
      const ext: AiaExtension = {
        packageName: 'com.example',
        version: 1,
        minSdk: 7,
        components: [fakeDesc],
        manifest: { packageName: 'com.example', version: 1, minSdk: 7, buildVersion: '1', permissions: [] },
        loadClasses: async () => new Uint8Array(),
        loadAssets: async () => [],
      }
      const extEnv = env.withExtension(ext)
      expect(extEnv.lookup('com.example.MyExt')).toBe(fakeDesc)
      expect(env.lookup('com.example.MyExt')).toBeNull()
    })

    it('withExtensions is equivalent to chaining withExtension', async () => {
      const env = await Environment.kodularCreator()
      const makeExt = (type: string): AiaExtension => ({
        packageName: type,
        version: 1,
        minSdk: 7,
        components: [{ type, name: type, external: true, version: 1, categoryString: 'EXTENSION', helpString: '', showOnPalette: true, nonVisible: false, iconName: '', properties: [], blockProperties: [], events: [], methods: [] }],
        manifest: { packageName: type, version: 1, minSdk: 7, buildVersion: '1', permissions: [] },
        loadClasses: async () => new Uint8Array(),
        loadAssets: async () => [],
      })
      const ext1 = makeExt('com.a.A')
      const ext2 = makeExt('com.b.B')
      const envA = env.withExtensions([ext1, ext2])
      expect(envA.lookup('com.a.A')).toBeDefined()
      expect(envA.lookup('com.b.B')).toBeDefined()
    })
  })
})
```

- [ ] **Step 9.2: Run test to verify it fails**

```bash
pnpm exec vitest run test/v2/core/environment.test.ts
```

Expected: FAIL — `Cannot find module '../../../src/core/environment.js'`

- [ ] **Step 9.3: Write `src/core/environment.ts`**

```typescript
import type { ComponentDescriptor } from './descriptors.js'
import type { AiaExtension } from './types.js'

export class Environment {
  private readonly descriptors: ReadonlyArray<ComponentDescriptor>

  private constructor(descriptors: ComponentDescriptor[]) {
    this.descriptors = descriptors
  }

  lookup(typeName: string): ComponentDescriptor | null {
    return this.descriptors.find(d => d.type === typeName) ?? null
  }

  withExtension(ext: AiaExtension): Environment {
    return new Environment([...this.descriptors, ...ext.components])
  }

  withExtensions(exts: AiaExtension[]): Environment {
    return new Environment([...this.descriptors, ...exts.flatMap(e => e.components)])
  }

  static async kodularCreator(): Promise<Environment> {
    const json = (await import('../environments/kodular-creator/simple_components.json', {
      with: { type: 'json' }
    })).default
    return new Environment(json as ComponentDescriptor[])
  }

  static async mitAppInventor(): Promise<Environment> {
    const json = (await import('../environments/mit-app-inventor/simple_components.json', {
      with: { type: 'json' }
    })).default
    return new Environment(json as ComponentDescriptor[])
  }
}
```

- [ ] **Step 9.4: Run tests to verify pass**

```bash
pnpm exec vitest run test/v2/core/environment.test.ts
```

Expected: PASS (5 tests)

- [ ] **Step 9.5: Commit**

```bash
git add src/core/environment.ts test/v2/core/environment.test.ts
git commit -m "feat(v2): add Environment class with lookup and withExtension"
```

---

## Task 10: parseAia

**Files:**
- Create: `src/parse.ts`
- Create: `test/v2/parse.test.ts`

`parseAia` reads a ZIP, extracts `youngandroidproject/project.properties`, screen `.scm`/`.bky`/`.yail` files, asset blobs, and extension JSON. It does **not** take an `Environment` parameter — that belongs in `resolve()`.

- [ ] **Step 10.1: Write failing test**

```typescript
// test/v2/parse.test.ts
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parseAia } from '../../src/parse.js'

const FIXTURES = join(import.meta.dirname, '../fixtures')

describe('parseAia', () => {
  it('parses HelloPurr.aia without throwing', async () => {
    const bytes = readFileSync(join(FIXTURES, 'HelloPurr.aia'))
    const project = await parseAia(new Uint8Array(bytes).buffer as ArrayBuffer)
    expect(project._tag).toBe('AiaProject')
    expect(project.name).toBeTruthy()
  })

  it('returns at least one screen', async () => {
    const bytes = readFileSync(join(FIXTURES, 'HelloPurr.aia'))
    const project = await parseAia(new Uint8Array(bytes))
    expect(project.screens.length).toBeGreaterThan(0)
    expect(project.screens[0].name).toBeTruthy()
    expect(typeof project.screens[0].scm).toBe('string')
    expect(typeof project.screens[0].bky).toBe('string')
  })

  it('screen scm contains $JSON block', async () => {
    const bytes = readFileSync(join(FIXTURES, 'HelloPurr.aia'))
    const project = await parseAia(new Uint8Array(bytes))
    expect(project.screens[0].scm).toMatch(/\$JSON/)
  })

  it('asset data() returns Uint8Array', async () => {
    const bytes = readFileSync(join(FIXTURES, 'HelloPurr.aia'))
    const project = await parseAia(new Uint8Array(bytes))
    if (project.assets.length > 0) {
      const data = await project.assets[0].data()
      expect(data).toBeInstanceOf(Uint8Array)
      expect(data.length).toBe(project.assets[0].sizeBytes)
    }
  })

  it('throws AiaZipError for invalid ZIP bytes', async () => {
    const { AiaZipError } = await import('../../src/core/errors.js')
    await expect(parseAia(new Uint8Array([0, 1, 2, 3]))).rejects.toBeInstanceOf(AiaZipError)
  })

  it('throws AiaStructureError for valid ZIP missing project.properties', async () => {
    const { AiaStructureError } = await import('../../src/core/errors.js')
    const { BlobWriter, ZipWriter } = await import('@zip.js/zip.js')
    const zw = new ZipWriter(new BlobWriter())
    await zw.close()
    const emptyZip = await (new BlobWriter()).getData?.() ?? new Blob()
    // Build a real empty ZIP via zip.js
    const bw = new BlobWriter()
    const writer = new ZipWriter(bw)
    const blob = await writer.close()
    const ab = await blob.arrayBuffer()
    await expect(parseAia(new Uint8Array(ab))).rejects.toBeInstanceOf(AiaStructureError)
  })
})
```

- [ ] **Step 10.2: Run test to verify it fails**

```bash
pnpm exec vitest run test/v2/parse.test.ts
```

Expected: FAIL — `Cannot find module '../../src/parse.js'`

- [ ] **Step 10.3: Write `src/parse.ts`**

```typescript
import { BlobReader, BlobWriter, ZipReader, ZipWriter, TextReader, type Entry } from '@zip.js/zip.js'
import { parse as parseProperties } from 'properties-file'
import type { AiaProject, AiaScreen, AiaAsset, AiaExtension, AixManifest, AixAsset } from './core/types.js'
import type { ComponentDescriptor } from './core/descriptors.js'
import { AiaZipError, AiaStructureError } from './core/errors.js'
import type { Environment } from './core/environment.js'
import type { ModelProject } from './core/model.js'

export async function parseAia(input: Uint8Array | ArrayBuffer | Blob): Promise<AiaProject> {
  const blob = toBlob(input)
  let entries: Entry[]
  try {
    const zr = new ZipReader(new BlobReader(blob))
    entries = await zr.getEntries()
    await zr.close()
  } catch (e) {
    throw new AiaZipError(`Cannot read AIA archive: ${e}`, e)
  }

  const propsEntry = entries.find(e => e.filename === 'youngandroidproject/project.properties')
  if (!propsEntry) {
    throw new AiaStructureError('Missing youngandroidproject/project.properties', null)
  }

  const propsText = await readText(propsEntry)
  const properties = parseProperties(propsText) as Record<string, string>
  const name = (properties['main'] ?? '').split('.').pop() ?? 'Unknown'

  const screenMap = new Map<string, { scm?: string; bky?: string; yail?: string }>()
  const assetEntries: Entry[] = []
  const extEntries = new Map<string, Entry[]>()

  for (const entry of entries) {
    const parts = entry.filename.split('/')
    if (parts[0] === 'youngandroidproject') continue

    if (parts[0] === 'assets' && parts.length === 2 && parts[1]) {
      assetEntries.push(entry)
      continue
    }

    if (parts[0] === 'assets' && parts[1] === 'external_comps' && parts[2]) {
      const pkg = parts[2]
      if (!extEntries.has(pkg)) extEntries.set(pkg, [])
      extEntries.get(pkg)!.push(entry)
      continue
    }

    if (parts[0] === 'src') {
      const filename = parts[parts.length - 1]
      const dotIdx = filename.lastIndexOf('.')
      if (dotIdx === -1) continue
      const screenName = filename.slice(0, dotIdx)
      const ext = filename.slice(dotIdx + 1)
      if (!screenMap.has(screenName)) screenMap.set(screenName, {})
      const screen = screenMap.get(screenName)!
      if (ext === 'scm') screen.scm = await readText(entry)
      else if (ext === 'bky') screen.bky = await readText(entry)
      else if (ext === 'yail') screen.yail = await readText(entry)
    }
  }

  const screens: AiaScreen[] = []
  for (const [screenName, files] of screenMap) {
    if (!files.scm || !files.bky) continue
    screens.push({ name: screenName, scm: files.scm, bky: files.bky, yail: files.yail ?? null })
  }

  if (screens.length === 0) {
    throw new AiaStructureError('AIA contains no valid screens (missing .scm/.bky pairs)', null)
  }

  const assets: AiaAsset[] = await Promise.all(
    assetEntries.map(async entry => {
      const blobData = await readBlob(entry)
      const name = entry.filename.split('/').pop() ?? entry.filename
      const type = name.includes('.') ? name.split('.').pop() ?? '' : ''
      return {
        name,
        type,
        sizeBytes: blobData.size,
        data: async () => new Uint8Array(await blobData.arrayBuffer()),
      }
    })
  )

  const extensions: AiaExtension[] = await buildExtensions(extEntries, entries)

  return { _tag: 'AiaProject', name, properties, screens, assets, extensions }
}

async function buildExtensions(
  extEntries: Map<string, Entry[]>,
  allEntries: Entry[]
): Promise<AiaExtension[]> {
  const extensions: AiaExtension[] = []
  for (const [pkg, entries] of extEntries) {
    const componentEntry = entries.find(e => {
      const f = e.filename.split('/').pop()
      return f === 'component.json' || f === 'components.json'
    })
    if (!componentEntry) continue
    let components: ComponentDescriptor[]
    try {
      const text = await readText(componentEntry)
      const parsed = JSON.parse(text)
      components = Array.isArray(parsed) ? parsed : [parsed]
    } catch {
      continue
    }
    const first = components[0]
    const manifest: AixManifest = {
      packageName: pkg,
      version: first?.version ?? 1,
      minSdk: 7,
      buildVersion: '1',
      permissions: [],
    }
    const jarEntry = allEntries.find(e => e.filename.includes(pkg) && e.filename.endsWith('classes.jar'))
    extensions.push({
      packageName: pkg,
      version: first?.version ?? 1,
      minSdk: 7,
      components,
      manifest,
      loadClasses: async () => jarEntry ? new Uint8Array(await (await readBlob(jarEntry)).arrayBuffer()) : new Uint8Array(),
      loadAssets: async () => [],
    })
  }
  return extensions
}

export async function parseAix(input: Uint8Array | ArrayBuffer | Blob): Promise<AiaExtension> {
  const blob = toBlob(input)
  let entries: Entry[]
  try {
    const zr = new ZipReader(new BlobReader(blob))
    entries = await zr.getEntries()
    await zr.close()
  } catch (e) {
    throw new AiaZipError(`Cannot read AIX archive: ${e}`, e)
  }

  const componentEntry = entries.find(e => {
    const f = e.filename.split('/').pop()
    return f === 'component.json' || f === 'components.json'
  })
  if (!componentEntry) {
    throw new AiaStructureError('AIX missing component.json or components.json', null)
  }

  const text = await readText(componentEntry)
  const parsed = JSON.parse(text)
  const components: ComponentDescriptor[] = Array.isArray(parsed) ? parsed : [parsed]
  const first = components[0]
  const packageName = first?.type?.split('.').slice(0, -1).join('.') ?? 'unknown'

  const manifest: AixManifest = {
    packageName,
    version: first?.version ?? 1,
    minSdk: 7,
    buildVersion: '1',
    permissions: [],
  }

  const jarEntry = entries.find(e => e.filename.endsWith('classes.jar'))
  const assetEntries = entries.filter(e => e.filename.startsWith('assets/') && !e.filename.endsWith('/'))

  return {
    packageName,
    version: first?.version ?? 1,
    minSdk: 7,
    components,
    manifest,
    loadClasses: async () => jarEntry ? new Uint8Array(await (await readBlob(jarEntry)).arrayBuffer()) : new Uint8Array(),
    loadAssets: async (): Promise<AixAsset[]> =>
      Promise.all(assetEntries.map(async entry => ({
        name: entry.filename.split('/').pop() ?? entry.filename,
        data: async () => new Uint8Array(await (await readBlob(entry)).arrayBuffer()),
      }))),
  }
}

export async function parseAndResolve(
  input: Uint8Array | ArrayBuffer | Blob,
  env: Environment
): Promise<ModelProject> {
  const { resolve } = await import('./resolve.js')
  const project = await parseAia(input)
  return resolve(project, env)
}

function toBlob(input: Uint8Array | ArrayBuffer | Blob): Blob {
  if (input instanceof Blob) return input
  if (input instanceof ArrayBuffer) return new Blob([input])
  return new Blob([input])
}

async function readText(entry: Entry): Promise<string> {
  const { TextWriter } = await import('@zip.js/zip.js')
  return entry.getData!(new TextWriter())
}

async function readBlob(entry: Entry): Promise<Blob> {
  return entry.getData!(new BlobWriter())
}
```

- [ ] **Step 10.4: Run tests to verify pass**

```bash
pnpm exec vitest run test/v2/parse.test.ts
```

Expected: PASS (6 tests). Note: the last test (valid ZIP without project.properties) requires `BlobWriter` from zip.js — verify the import path in the test if it fails.

- [ ] **Step 10.5: Fix the empty-zip test if it fails**

The test creates an empty zip inline. If the `ZipWriter` usage is awkward in the test, simplify it:

```typescript
it('throws AiaStructureError for valid ZIP missing project.properties', async () => {
  const { AiaStructureError } = await import('../../src/core/errors.js')
  const { BlobWriter, ZipWriter } = await import('@zip.js/zip.js')
  const bw = new BlobWriter()
  const writer = new ZipWriter(bw)
  const blob = await writer.close()
  const ab = await blob.arrayBuffer()
  await expect(parseAia(new Uint8Array(ab))).rejects.toBeInstanceOf(AiaStructureError)
})
```

- [ ] **Step 10.6: Commit**

```bash
git add src/parse.ts test/v2/parse.test.ts
git commit -m "feat(v2): add parseAia, parseAix, parseAndResolve"
```

---

## Task 11: resolve

**Files:**
- Create: `src/resolve.ts`
- Create: `test/v2/resolve.test.ts`

`resolve` is sync, pure, never throws. It maps `AiaProject` → `ModelProject` by resolving each screen's SCM into `ModelComponent` trees using `Environment.lookup`. Unresolvable component types emit `UNRESOLVABLE_COMPONENT` diagnostics but still produce a partial `ModelComponent` with a minimal descriptor.

- [ ] **Step 11.1: Write failing test**

```typescript
// test/v2/resolve.test.ts
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parseAia } from '../../src/parse.js'
import { resolve } from '../../src/resolve.js'
import { Environment } from '../../src/core/environment.js'

const FIXTURES = join(import.meta.dirname, '../fixtures')

describe('resolve', () => {
  it('returns a ModelProject with _tag', async () => {
    const bytes = readFileSync(join(FIXTURES, 'HelloPurr.aia'))
    const raw = await parseAia(new Uint8Array(bytes))
    const env = await Environment.kodularCreator()
    const model = resolve(raw, env)
    expect(model._tag).toBe('ModelProject')
  })

  it('model.screens has same count as raw screens', async () => {
    const bytes = readFileSync(join(FIXTURES, 'HelloPurr.aia'))
    const raw = await parseAia(new Uint8Array(bytes))
    const env = await Environment.kodularCreator()
    const model = resolve(raw, env)
    expect(model.screens).toHaveLength(raw.screens.length)
  })

  it('resolves root form component', async () => {
    const bytes = readFileSync(join(FIXTURES, 'HelloPurr.aia'))
    const raw = await parseAia(new Uint8Array(bytes))
    const env = await Environment.kodularCreator()
    const model = resolve(raw, env)
    const screen = model.screens[0]
    expect(screen.form.name).toBeTruthy()
    expect(screen.form.descriptor).toBeTruthy()
  })

  it('never throws, even with empty screens', () => {
    const raw = {
      _tag: 'AiaProject' as const,
      name: 'Empty',
      properties: {},
      screens: [{
        name: 'Screen1',
        scm: `#|\n$JSON\n{"YaVersion":"1","Source":"Form","Properties":{"$Name":"Screen1","$Type":"Form","Uuid":"-1","$Components":[]}}\n|#`,
        bky: '<xml xmlns="https://developers.google.com/blockly/xml"></xml>',
        yail: null,
      }],
      assets: [],
      extensions: [],
    }
    const env = { lookup: () => null, withExtension: () => env, withExtensions: () => env } as any
    expect(() => resolve(raw, env)).not.toThrow()
  })

  it('emits UNRESOLVABLE_COMPONENT diagnostic for unknown type', () => {
    const raw = {
      _tag: 'AiaProject' as const,
      name: 'Test',
      properties: {},
      screens: [{
        name: 'Screen1',
        scm: `#|\n$JSON\n{"YaVersion":"1","Source":"Form","Properties":{"$Name":"Screen1","$Type":"Form","Uuid":"-1","$Components":[{"$Name":"Widget1","$Type":"GhostWidget","Uuid":"abc","$Components":[]}]}}\n|#`,
        bky: '<xml xmlns="https://developers.google.com/blockly/xml"></xml>',
        yail: null,
      }],
      assets: [],
      extensions: [],
    }
    const env = { lookup: () => null, withExtension: () => env, withExtensions: () => env } as any
    const model = resolve(raw, env)
    expect(model.diagnostics.some(d => d.code === 'UNRESOLVABLE_COMPONENT')).toBe(true)
  })
})
```

- [ ] **Step 11.2: Run test to verify it fails**

```bash
pnpm exec vitest run test/v2/resolve.test.ts
```

Expected: FAIL — `Cannot find module '../../src/resolve.js'`

- [ ] **Step 11.3: Write `src/resolve.ts`**

```typescript
import { ScmParser } from './components/scm-parser.js'
import type { AiaProject, AiaComponent } from './core/types.js'
import type { ModelProject, ModelScreen, ModelComponent, ComponentProperty } from './core/model.js'
import type { ComponentDescriptor, ComponentPropertyDescriptor } from './core/descriptors.js'
import type { Diagnostic } from './core/diagnostics.js'
import type { Environment } from './core/environment.js'

export function resolve(project: AiaProject, env: Environment): ModelProject {
  const diagnostics: Diagnostic[] = []
  const screens: ModelScreen[] = []

  for (const screen of project.screens) {
    let root: AiaComponent
    try {
      root = ScmParser.parse(screen.scm)
    } catch (e) {
      diagnostics.push({
        code: 'MALFORMED_SCM',
        severity: 'error',
        path: ['screens', screen.name],
        message: `Failed to parse SCM for "${screen.name}": ${e}`,
      })
      continue
    }
    const form = resolveComponent(root, env, ['screens', screen.name], diagnostics)
    screens.push({ source: screen, name: screen.name, form })
  }

  return { _tag: 'ModelProject', source: project, environment: env, screens, diagnostics }
}

function resolveComponent(
  raw: AiaComponent,
  env: Environment,
  path: string[],
  diagnostics: Diagnostic[]
): ModelComponent {
  const compPath = [...path, raw.name]
  const fullType = raw.type.includes('.')
    ? raw.type
    : `com.google.appinventor.components.runtime.${raw.type}`
  
  let descriptor = env.lookup(fullType)
  if (!descriptor) {
    diagnostics.push({
      code: 'UNRESOLVABLE_COMPONENT',
      severity: 'warning',
      path: compPath,
      message: `No descriptor found for component type "${raw.type}"`,
    })
    descriptor = makeFallbackDescriptor(raw.type, fullType)
  }

  const properties: ComponentProperty[] = Object.entries(raw.properties).map(([name, value]) => {
    const propDesc = descriptor!.properties.find((p: ComponentPropertyDescriptor) => p.name === name) ?? null
    return { name, value, descriptor: propDesc }
  })

  const children = raw.children.map(child =>
    resolveComponent(child, env, compPath, diagnostics)
  )

  return { name: raw.name, type: raw.type, uid: raw.uid, descriptor, properties, children }
}

function makeFallbackDescriptor(simpleName: string, fullType: string): ComponentDescriptor {
  return {
    type: fullType,
    name: simpleName,
    external: false,
    version: 1,
    categoryString: 'UNKNOWN',
    helpString: '',
    showOnPalette: false,
    nonVisible: false,
    iconName: '',
    properties: [],
    blockProperties: [],
    events: [],
    methods: [],
  }
}
```

- [ ] **Step 11.4: Run tests to verify pass**

```bash
pnpm exec vitest run test/v2/resolve.test.ts
```

Expected: PASS (5 tests)

- [ ] **Step 11.5: Commit**

```bash
git add src/resolve.ts test/v2/resolve.test.ts
git commit -m "feat(v2): add resolve — AiaProject + Environment → ModelProject"
```

---

## Task 12: writeAia

**Files:**
- Create: `src/write.ts`
- Create: `test/v2/write.test.ts`

`writeAia` accepts either `AiaProject` or `ModelProject` (using `.source` for the latter). It packages the project back into a ZIP using the same file structure that `parseAia` reads.

- [ ] **Step 12.1: Write failing test**

```typescript
// test/v2/write.test.ts
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parseAia } from '../../src/parse.js'
import { writeAia } from '../../src/write.js'

const FIXTURES = join(import.meta.dirname, '../fixtures')

describe('writeAia', () => {
  it('returns a Blob', async () => {
    const bytes = readFileSync(join(FIXTURES, 'HelloPurr.aia'))
    const project = await parseAia(new Uint8Array(bytes))
    const out = await writeAia(project)
    expect(out).toBeInstanceOf(Blob)
    expect(out.size).toBeGreaterThan(0)
  })

  it('output is a valid ZIP (starts with PK signature)', async () => {
    const bytes = readFileSync(join(FIXTURES, 'HelloPurr.aia'))
    const project = await parseAia(new Uint8Array(bytes))
    const out = await writeAia(project)
    const ab = await out.arrayBuffer()
    const header = new Uint8Array(ab).slice(0, 4)
    // ZIP local file header signature: 0x50 0x4B 0x03 0x04
    expect(header[0]).toBe(0x50)
    expect(header[1]).toBe(0x4B)
  })

  it('output re-parses with same screen names', async () => {
    const bytes = readFileSync(join(FIXTURES, 'HelloPurr.aia'))
    const project = await parseAia(new Uint8Array(bytes))
    const out = await writeAia(project)
    const ab = await out.arrayBuffer()
    const reparsed = await parseAia(new Uint8Array(ab))
    const originalNames = project.screens.map(s => s.name).sort()
    const reparsedNames = reparsed.screens.map(s => s.name).sort()
    expect(reparsedNames).toEqual(originalNames)
  })

  it('accepts a ModelProject by using its source', async () => {
    const bytes = readFileSync(join(FIXTURES, 'HelloPurr.aia'))
    const project = await parseAia(new Uint8Array(bytes))
    const { resolve } = await import('../../src/resolve.js')
    const { Environment } = await import('../../src/core/environment.js')
    const env = await Environment.kodularCreator()
    const model = resolve(project, env)
    const out = await writeAia(model)
    expect(out).toBeInstanceOf(Blob)
  })
})
```

- [ ] **Step 12.2: Run test to verify it fails**

```bash
pnpm exec vitest run test/v2/write.test.ts
```

Expected: FAIL — `Cannot find module '../../src/write.js'`

- [ ] **Step 12.3: Write `src/write.ts`**

```typescript
import { BlobWriter, ZipWriter, TextReader, BlobReader } from '@zip.js/zip.js'
import type { AiaProject } from './core/types.js'
import type { ModelProject } from './core/model.js'
import { AiaWriteError } from './core/errors.js'

export async function writeAia(project: AiaProject | ModelProject): Promise<Blob> {
  const raw: AiaProject = '_tag' in project && project._tag === 'ModelProject'
    ? (project as ModelProject).source
    : project as AiaProject

  try {
    const zw = new ZipWriter(new BlobWriter('application/zip'))

    await zw.add(
      'youngandroidproject/project.properties',
      new TextReader(serializeProperties(raw.properties))
    )

    const packagePath = getPackagePath(raw.properties)

    for (const screen of raw.screens) {
      const dir = `src/${packagePath}`
      await zw.add(`${dir}/${screen.name}.scm`, new TextReader(screen.scm))
      await zw.add(`${dir}/${screen.name}.bky`, new TextReader(screen.bky))
      if (screen.yail) {
        await zw.add(`${dir}/${screen.name}.yail`, new TextReader(screen.yail))
      }
    }

    for (const asset of raw.assets) {
      const data = await asset.data()
      await zw.add(`assets/${asset.name}`, new BlobReader(new Blob([data])))
    }

    for (const ext of raw.extensions) {
      const descriptor = JSON.stringify(
        ext.components.length === 1 ? ext.components[0] : ext.components
      )
      await zw.add(
        `assets/external_comps/${ext.packageName}/component${ext.components.length > 1 ? 's' : ''}.json`,
        new TextReader(descriptor)
      )
    }

    return zw.close()
  } catch (e) {
    if (e instanceof AiaWriteError) throw e
    throw new AiaWriteError(`Failed to write AIA: ${e}`)
  }
}

function serializeProperties(props: Record<string, string>): string {
  return Object.entries(props).map(([k, v]) => `${k}=${v}`).join('\n') + '\n'
}

function getPackagePath(properties: Record<string, string>): string {
  const main = properties['main'] ?? ''
  const parts = main.split('.')
  if (parts.length > 1) {
    return parts.slice(0, -1).join('/')
  }
  return 'appinventor/ai_user/Project'
}
```

- [ ] **Step 12.4: Run tests to verify pass**

```bash
pnpm exec vitest run test/v2/write.test.ts
```

Expected: PASS (4 tests)

- [ ] **Step 12.5: Commit**

```bash
git add src/write.ts test/v2/write.test.ts
git commit -m "feat(v2): add writeAia — AiaProject/ModelProject → Blob"
```

---

## Task 13: Round-Trip Integration Test

**Files:**
- Create: `test/v2/round-trip.test.ts`

Tests end-to-end correctness: `parseAia` → `writeAia` → `parseAia` preserves screens, SCM content, and BKY content across all fixtures.

- [ ] **Step 13.1: Write the round-trip test**

```typescript
// test/v2/round-trip.test.ts
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { parseAia } from '../../src/parse.js'
import { writeAia } from '../../src/write.js'

const FIXTURES = join(import.meta.dirname, '../fixtures')
const AIA_FILES = readdirSync(FIXTURES).filter(f => f.endsWith('.aia'))

describe('round-trip: parseAia → writeAia → parseAia', () => {
  for (const filename of AIA_FILES) {
    it(`preserves ${filename}`, async () => {
      const bytes = readFileSync(join(FIXTURES, filename))
      const original = await parseAia(new Uint8Array(bytes))

      const written = await writeAia(original)
      const reparsed = await parseAia(new Uint8Array(await written.arrayBuffer()))

      // Screen names preserved
      expect(reparsed.screens.map(s => s.name).sort())
        .toEqual(original.screens.map(s => s.name).sort())

      // SCM and BKY content preserved for each screen
      for (const origScreen of original.screens) {
        const roundScreen = reparsed.screens.find(s => s.name === origScreen.name)
        expect(roundScreen, `Screen ${origScreen.name} missing after round-trip`).toBeDefined()
        expect(roundScreen!.scm).toBe(origScreen.scm)
        expect(roundScreen!.bky).toBe(origScreen.bky)
      }

      // Asset count preserved
      expect(reparsed.assets.length).toBe(original.assets.length)
    })
  }
})
```

- [ ] **Step 13.2: Run the test**

```bash
pnpm exec vitest run test/v2/round-trip.test.ts
```

Expected: PASS for all fixture files. If any fail, investigate — common issues:
- The `getPackagePath` function in `write.ts` must produce the same subdirectory that `parseAia` reads from. Log `entry.filename` in the reader to verify.
- Asset data encoded differently — check that `data()` returns the same bytes.

- [ ] **Step 13.3: Fix any round-trip failures before proceeding**

If `reparsed.screens` is empty, the write path doesn't match the read path. Debug by logging the entries in the re-read ZIP:

```typescript
// Temporary debug snippet to add in the test:
const zr = new ZipReader(new BlobReader(written))
const entries = await zr.getEntries()
console.log('Written entries:', entries.map(e => e.filename))
```

Cross-reference with `getPackagePath()` output and the `src/` path logic in `parseAia`.

- [ ] **Step 13.4: Commit**

```bash
git add test/v2/round-trip.test.ts
git commit -m "test(v2): add round-trip integration tests for all fixtures"
```

---

## Task 14: Update Public Exports

**Files:**
- Modify: `src/index.ts`
- Modify: `package.json`

- [ ] **Step 14.1: Write new `src/index.ts`**

All v1 files were deleted in Task 0. The stub `src/index.ts` created there is now replaced with the full v2 public API.

```typescript
// Raw layer types
export type {
  AiaProject, AiaScreen, AiaAsset, AiaExtension,
  AixManifest, AixAsset, AiaComponent, MutationResult,
} from './core/types.js'

// Descriptor types
export type {
  ComponentDescriptor, ComponentPropertyDescriptor,
  ComponentBlockPropertyDescriptor, ComponentEventDescriptor,
  ComponentMethodDescriptor, ComponentDescriptorParam,
} from './core/descriptors.js'

// Model layer types
export type { ModelProject, ModelScreen, ModelComponent, ComponentProperty } from './core/model.js'

// Diagnostics
export type { Diagnostic, DiagnosticSeverity, DiagnosticCode } from './core/diagnostics.js'
export { mergeReports } from './core/diagnostics.js'

// Errors
export { AiaKitError, AiaParseError, AiaZipError, AiaStructureError, AiaWriteError } from './core/errors.js'

// Environment
export { Environment } from './core/environment.js'

// Pipeline
export { parseAia, parseAix, parseAndResolve } from './parse.js'
export { resolve } from './resolve.js'
export { writeAia } from './write.js'

// Block lens (public API only — BkyParser is internal)
export {
  parseBlocks, serializeBlocks,
  queryBlocks, updateBlocks, updateAllScreenBlocks, updateScreenBky,
} from './blocks/lens.js'
export type { BlockAst, BlockNode } from './blocks/ast.js'

// Component tree utilities
export { findComponent, getComponentsByType, getParent, getComponentPath } from './components/tree.js'
```

- [ ] **Step 14.2: Update `package.json` exports**

```json
{
  "exports": {
    ".":            "./dist/src/index.js",
    "./parse":      "./dist/src/parse.js",
    "./resolve":    "./dist/src/resolve.js",
    "./write":      "./dist/src/write.js",
    "./mutations":  "./dist/src/mutations/index.js",
    "./analysis":   "./dist/src/analysis/index.js",
    "./migration":  "./dist/src/migration/index.js"
  }
}
```

> **Note:** `mutations`, `analysis`, and `migration` subpath entries point to files that don't exist yet (Milestones 2 & 3). They will resolve only when those are built. Add them now to lock in the public API shape.

- [ ] **Step 14.3: Build to verify TypeScript compiles**

```bash
pnpm build
```

Expected: Clean compile with no errors.

- [ ] **Step 14.4: Run the full test suite**

```bash
pnpm test
```

Expected: All v2 tests pass. No v1 tests remain — they were deleted in Task 0.

- [ ] **Step 14.5: Commit**

```bash
git add src/index.ts package.json
git commit -m "feat(v2): update public exports for v2 API"
```

---

## Self-Review Checklist

### 1. Spec Coverage

| Spec requirement | Task |
|---|---|
| `AiaProject`, `AiaScreen`, `AiaAsset`, `AiaExtension`, `AiaComponent` raw types | Task 1 |
| `ModelProject`, `ModelScreen`, `ModelComponent` model types | Task 2 |
| `Diagnostic[]` system + `DiagnosticCode` union + `mergeReports` | Task 3 |
| Error hierarchy (`AiaParseError`, `AiaZipError`, `AiaStructureError`, `AiaWriteError`) | Task 4 |
| `BkyParser`, `BlockAst` | Task 5 |
| Block lens: `queryBlocks`, `updateBlocks`, `updateAllScreenBlocks`, `parseBlocks`, `serializeBlocks`, `updateScreenBky` | Task 6 |
| `ScmParser` (internal) | Task 7 |
| Component tree: `getParent`, `getComponentPath`, `getComponentsByType`, `findComponent` | Task 8 |
| `Environment` class with lazy-loaded JSON, `withExtension`, `withExtensions` | Task 9 |
| `parseAia`, `parseAix`, `parseAndResolve` | Task 10 |
| `resolve` — sync, pure, never throws, partial failure → diagnostics | Task 11 |
| `writeAia` accepts `AiaProject | ModelProject` | Task 12 |
| Round-trip correctness tests | Task 13 |
| `MutationResult` type | Task 1 (in `types.ts`) |

All Milestone 1 spec items are covered.

### 2. Type Consistency Check

| Type | Defined in | Used consistently in |
|---|---|---|
| `AiaProject` | `src/core/types.ts` | `parse.ts`, `resolve.ts`, `write.ts`, `blocks/lens.ts` |
| `AiaScreen` | `src/core/types.ts` | `blocks/lens.ts`, `components/scm-parser.ts` |
| `AiaComponent` | `src/core/types.ts` | `components/scm-parser.ts`, `resolve.ts` |
| `ModelProject` | `src/core/model.ts` | `resolve.ts`, `write.ts`, `parse.ts` |
| `ModelComponent` | `src/core/model.ts` | `components/tree.ts`, `resolve.ts` |
| `ComponentDescriptor` | `src/core/descriptors.ts` | `core/types.ts` (via AiaExtension), `core/environment.ts`, `resolve.ts` |
| `Diagnostic` | `src/core/diagnostics.ts` | `core/types.ts` (MutationResult), `blocks/lens.ts`, `resolve.ts` |
| `BlockAst` | `src/blocks/ast.ts` | `blocks/bky-parser.ts`, `blocks/lens.ts` |
| `Environment` | `src/core/environment.ts` | `core/model.ts`, `resolve.ts`, `parse.ts` |

All cross-references are consistent.

---

## Notes for Milestone 2

The following items from the spec are **not** in this plan and belong in the Milestone 2 plan:
- All structural mutations (`addScreen`, `removeScreen`, `addComponent`, etc.)
- `diagnose`, `findUnusedExtensions`, `findUnusedAssets`, `diffProjects`
- Block analysis: `analyzeVariables`, `exportBlockSummary`
- Cross-cutting analysis: `analyzeComplexity`, `findDeadBlocks`, `buildNavGraph`
- `createYailGenerator`
