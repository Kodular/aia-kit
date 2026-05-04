import { describe, expect, it } from 'vitest'
import { exportScreenAsAis, readAis } from '#/ais/index.js'
import { makeMinimalProject } from '#/test-helpers.js'

describe('aia-kit/ais', () => {
  it('readAis is not implemented yet', async () => {
    await expect(readAis(new Uint8Array())).rejects.toThrow(Error)
    await expect(readAis(new Uint8Array())).rejects.toThrow(/readAis is not implemented/)
  })

  it('exportScreenAsAis is not implemented yet', async () => {
    const project = makeMinimalProject()
    await expect(exportScreenAsAis(project, 'Screen1')).rejects.toThrow(Error)
    await expect(exportScreenAsAis(project, 'Screen1')).rejects.toThrow(/exportScreenAsAis is not implemented/)
  })
})
