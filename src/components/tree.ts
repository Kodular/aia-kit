import type { ModelComponent } from '#/core/model.js'

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
