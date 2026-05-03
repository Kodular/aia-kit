import { parseScm } from '#/components/scm-parser.js'
import { serializeScm } from '#/components/scm-serializer.js'
import type { Diagnostic } from '#/core/diagnostics.js'
import type { AiaComponent } from '#/core/types.js'
import {
  addRawComponentToParent,
  findRawComponentByUid,
  getRawComponentsByType,
  removeRawComponentByUid,
} from '#/utils/component-tree.js'

export class ScmDocument {
  readonly diagnostics: Diagnostic[] = []

  private constructor(
    private rootComponent: AiaComponent,
    private readonly originalScm: string,
  ) {}

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
    const root = addRawComponentToParent(this.rootComponent, parentUid, component)
    if (!root) {
      return this.recordDiagnostics([unresolvedComponent(parentUid)])
    }
    this.rootComponent = root
    return []
  }

  removeComponent(uid: string): Diagnostic[] {
    if (this.rootComponent.uid === uid) {
      return this.recordDiagnostics([cannotRemoveRoot(uid)])
    }

    const { root, removed } = removeRawComponentByUid(this.rootComponent, uid)
    if (!removed || !root) {
      return this.recordDiagnostics([unresolvedComponent(uid)])
    }

    this.rootComponent = root
    return []
  }

  serialize(): string {
    return serializeScm(this.rootComponent, this.originalScm)
  }

  private recordDiagnostics(diagnostics: Diagnostic[]): Diagnostic[] {
    this.diagnostics.push(...diagnostics)
    return diagnostics
  }
}

function unresolvedComponent(uid: string): Diagnostic {
  return {
    code: 'UNRESOLVABLE_COMPONENT',
    severity: 'error',
    path: ['components', uid],
    message: `Component with uid "${uid}" not found`,
  }
}

function cannotRemoveRoot(uid: string): Diagnostic {
  return {
    code: 'UNRESOLVABLE_COMPONENT',
    severity: 'error',
    path: ['components', uid],
    message: `Cannot remove the root form component (uid "${uid}")`,
  }
}
