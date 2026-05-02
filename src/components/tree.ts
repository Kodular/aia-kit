import type { ModelComponent } from '#/core/model.js'

export function findComponentByUid(root: ModelComponent, uid: string): ModelComponent | null {
  if (root.uid === uid) return root
  for (const child of root.children) {
    const found = findComponentByUid(child, uid)
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

export function getParentComponent(root: ModelComponent, target: ModelComponent): ModelComponent | null {
  if (root === target) return null
  for (const child of root.children) {
    if (child === target) return root
    const found = getParentComponent(child, target)
    if (found) return found
  }
  return null
}

export function getComponentPathByUid(root: ModelComponent, uid: string): ModelComponent[] {
  if (root.uid === uid) return [root]
  for (const child of root.children) {
    const subPath = getComponentPathByUid(child, uid)
    if (subPath.length > 0) return [root, ...subPath]
  }
  return []
}
