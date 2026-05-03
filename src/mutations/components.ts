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
    const { node: updated, changed } = applyPropertyUpdate(root, predicate, property, value)
    if (!changed) return screen
    return { ...screen, scm: serializeScm(updated, screen.scm), yail: null }
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
  for (const c of node.children) {
    const r = addToParent(c, parentUid, child)
    if (r) {
      return { ...node, children: node.children.map(ch => ch === c ? r : ch) }
    }
  }
  return null
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
): { node: AiaComponent; changed: boolean } {
  const shouldUpdate = predicate(node) && node.properties[property] !== value
  const properties = shouldUpdate ? { ...node.properties, [property]: value } : node.properties
  let childrenChanged = false
  const children = node.children.map(child => {
    const updated = applyPropertyUpdate(child, predicate, property, value)
    if (updated.changed) childrenChanged = true
    return updated.node
  })

  if (!shouldUpdate && !childrenChanged) {
    return { node, changed: false }
  }

  return {
    node: {
      ...node,
      properties,
      children: childrenChanged ? children : node.children,
    },
    changed: true,
  }
}

function replaceScreenScm(
  project: AiaProject,
  idx: number,
  screen: AiaScreen,
  newRoot: AiaComponent,
): MutationResult {
  // originalScm provides the top-level metadata wrapper (authURL, YaVersion, Source).
  const newScm = serializeScm(newRoot, screen.scm)
  const screens = [...project.screens]
  screens[idx] = { ...screen, scm: newScm, yail: null }
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
