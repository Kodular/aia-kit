import type { AiaComponent } from '#/types.js'

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
