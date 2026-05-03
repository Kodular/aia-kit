import { describe, expect, it } from 'vitest'
import {
  addRawComponentToParent,
  findRawComponentByUid,
  getRawComponentsByType,
  removeRawComponentByUid,
} from '#/utils/component-tree.js'
import { makeComponent } from '../test-helpers.js'

function makeTree() {
  const nestedLabel = makeComponent({
    name: 'NestedLabel',
    type: 'Label',
    uid: 'nested-label',
  })
  const button = makeComponent({
    name: 'Button1',
    type: 'Button',
    uid: 'button-1',
  })
  const arrangement = makeComponent({
    name: 'Arrangement1',
    type: 'HorizontalArrangement',
    uid: 'arrangement-1',
    children: [nestedLabel, button],
  })
  return makeComponent({
    name: 'Screen1',
    type: 'Form',
    uid: 'root',
    children: [arrangement],
  })
}

describe('raw component-tree utilities', () => {
  it('finds root and nested components by uid', () => {
    const tree = makeTree()
    expect(findRawComponentByUid(tree, 'root')).toBe(tree)
    expect(findRawComponentByUid(tree, 'nested-label')?.name).toBe('NestedLabel')
    expect(findRawComponentByUid(tree, 'missing')).toBeNull()
  })

  it('collects all components matching a type', () => {
    const root = makeComponent({
      type: 'Button',
      uid: 'root-button',
      children: [
        makeComponent({ type: 'Label', uid: 'label-1' }),
        makeComponent({ type: 'Button', uid: 'button-2' }),
      ],
    })

    expect(getRawComponentsByType(root, 'Button').map(component => component.uid)).toEqual([
      'root-button',
      'button-2',
    ])
  })

  it('adds a component to the requested parent without mutating the input tree', () => {
    const tree = makeTree()
    const image = makeComponent({ name: 'Image1', type: 'Image', uid: 'image-1' })

    const updated = addRawComponentToParent(tree, 'arrangement-1', image)

    expect(updated).not.toBeNull()
    expect(findRawComponentByUid(updated!, 'image-1')).toBe(image)
    expect(findRawComponentByUid(tree, 'image-1')).toBeNull()
    expect(addRawComponentToParent(tree, 'missing', image)).toBeNull()
  })

  it('removes nested components by uid without mutating the input tree', () => {
    const tree = makeTree()
    const result = removeRawComponentByUid(tree, 'nested-label')

    expect(result.removed).toBe(true)
    expect(result.root).not.toBeNull()
    expect(findRawComponentByUid(result.root!, 'nested-label')).toBeNull()
    expect(findRawComponentByUid(tree, 'nested-label')).not.toBeNull()
  })

  it('can remove the root component', () => {
    expect(removeRawComponentByUid(makeTree(), 'root')).toEqual({ root: null, removed: true })
  })

  it('reports no removal when the uid is absent', () => {
    const tree = makeTree()
    const result = removeRawComponentByUid(tree, 'missing')
    expect(result.removed).toBe(false)
    expect(result.root).toEqual(tree)
  })
})
