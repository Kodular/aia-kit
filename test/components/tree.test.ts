import { describe, it, expect } from 'vitest'
import {
  findComponentByUid,
  getComponentsByType,
  getParentComponent,
  getComponentPathByUid,
} from '#/components/tree.js'
import type { ModelComponent } from '#/core/model.js'

function makeModel(name: string, type: string, uid: string, children: ModelComponent[] = []): ModelComponent {
  return { name, type, uid, descriptor: {} as any, properties: [], children }
}

const leaf1 = makeModel('Button1', 'Button', 'uid-1')
const leaf2 = makeModel('Label1', 'Label', 'uid-2')
const inner = makeModel('HArrangement1', 'HorizontalArrangement', 'uid-3', [leaf1, leaf2])
const root = makeModel('Screen1', 'Form', 'uid-root', [inner])

describe('findComponentByUid', () => {
  it('finds a direct child', () => {
    expect(findComponentByUid(root, 'uid-3')).toBe(inner)
  })

  it('finds a deeply nested component', () => {
    expect(findComponentByUid(root, 'uid-1')).toBe(leaf1)
  })

  it('returns null for unknown uid', () => {
    expect(findComponentByUid(root, 'missing')).toBeNull()
  })

  it('finds root itself', () => {
    expect(findComponentByUid(root, 'uid-root')).toBe(root)
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

describe('getParentComponent', () => {
  it('returns parent of a direct child', () => {
    expect(getParentComponent(root, inner)).toBe(root)
  })

  it('returns parent of a deeply nested component', () => {
    expect(getParentComponent(root, leaf1)).toBe(inner)
  })

  it('returns null for root', () => {
    expect(getParentComponent(root, root)).toBeNull()
  })

  it('returns null for unknown component', () => {
    const stranger = makeModel('X', 'Button', 'uid-x')
    expect(getParentComponent(root, stranger)).toBeNull()
  })
})

describe('getComponentPathByUid', () => {
  it('returns path from root to leaf', () => {
    const path = getComponentPathByUid(root, 'uid-1')
    expect(path.map(c => c.uid)).toEqual(['uid-root', 'uid-3', 'uid-1'])
  })

  it('returns [root] for root uid', () => {
    const path = getComponentPathByUid(root, 'uid-root')
    expect(path.map(c => c.uid)).toEqual(['uid-root'])
  })

  it('returns empty array when uid not found', () => {
    expect(getComponentPathByUid(root, 'missing')).toEqual([])
  })
})