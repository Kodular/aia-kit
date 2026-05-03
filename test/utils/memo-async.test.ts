import { describe, expect, it } from 'vitest'
import { createAsyncMemoByKey } from '#/utils/memo-async.js'

describe('createAsyncMemoByKey', () => {
  it('returns the same resolved value for the same key', async () => {
    let loads = 0
    const load = createAsyncMemoByKey(async (k: string) => {
      loads++
      return `${k}-${loads}`
    })

    const a = await load('x')
    const b = await load('x')
    expect(a).toBe('x-1')
    expect(b).toBe('x-1')
    expect(loads).toBe(1)
  })

  it('coalesces concurrent loads for the same key', async () => {
    let loads = 0
    const load = createAsyncMemoByKey(async (k: string) => {
      loads++
      await new Promise((r) => setTimeout(r, 0))
      return k
    })

    const [a, b] = await Promise.all([load('a'), load('a')])
    expect(a).toBe('a')
    expect(b).toBe('a')
    expect(loads).toBe(1)
  })

  it('clears pending on failure so a later call retries', async () => {
    let loads = 0
    const load = createAsyncMemoByKey(async (_k: string) => {
      loads++
      if (loads === 1) throw new Error('first-fail')
      return loads
    })

    await expect(load('k')).rejects.toThrow('first-fail')
    await expect(load('k')).resolves.toBe(2)
    await expect(load('k')).resolves.toBe(2)
    expect(loads).toBe(2)
  })
})
