import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  Platform,
  createEnvironment,
  getEnvironmentFor,
} from '#/environment.js'
import type { Environment } from '#/environment.js'
import { ComponentRegistry } from '#/component-descriptor.js'

describe('public environment API', () => {
  it('exports platform constants and environment helpers', async () => {
    const loaded = await getEnvironmentFor(Platform.MitAppInventor)
    const env: Environment = createEnvironment({
      meta: { id: 'public-api', name: 'Public API' },
      components: loaded.componentRegistry,
      builtinBlocks: loaded.builtinBlockRegistry,
    })

    expect(Platform.MitAppInventor).toBe('mit-app-inventor')
    expect(env.componentRegistry).toBeInstanceOf(ComponentRegistry)
    expect(env.componentRegistry.lookup('Button')?.name).toBe('Button')
    expect(env.builtinBlockRegistry.lookup('logic_boolean')?.category).toBe('logic')
  })

  it('is published as a package subpath export', () => {
    const packageJson = JSON.parse(
      readFileSync(join(import.meta.dirname, '../package.json'), 'utf-8'),
    ) as { exports: Record<string, string> }

    expect(packageJson.exports['./environment']).toBe('./dist/src/environment.js')
  })
})
