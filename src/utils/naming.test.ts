import { describe, expect, it } from 'vitest'
import { findUniqueName } from '#/utils/naming.js'

describe('findUniqueName', () => {
  it('starts unique names at the _2 suffix', () => {
    expect(findUniqueName('Screen1', [])).toBe('Screen1_2')
  })

  it('increments the suffix until it finds a free name', () => {
    expect(findUniqueName('Screen1', ['Screen1', 'Screen1_2', 'Screen1_3'])).toBe('Screen1_4')
  })

  it('accepts readonly existing-name lists', () => {
    const existing = Object.freeze(['Button_2'])
    expect(findUniqueName('Button', existing)).toBe('Button_3')
  })
})
