import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { readAia, writeAia } from '#/aia/index.js'
import { FIXTURES_DIR } from '#/test-helpers.js'
const AIA_FILES = readdirSync(FIXTURES_DIR).filter(f => f.endsWith('.aia'))

describe('round-trip: readAia → writeAia → readAia', () => {
  it.each(AIA_FILES)('preserves %s', async filename => {
    const bytes = readFileSync(join(FIXTURES_DIR, filename))
    const original = await readAia(new Uint8Array(bytes))

    const written = await writeAia(original)
    const reparsed = await readAia(new Uint8Array(await written.arrayBuffer()))

    expect(reparsed.screens.map(s => s.name).sort())
      .toEqual(original.screens.map(s => s.name).sort())

    for (const origScreen of original.screens) {
      const roundScreen = reparsed.screens.find(s => s.name === origScreen.name)
      expect(roundScreen, `Screen ${origScreen.name} missing after round-trip`).toBeDefined()
      expect(roundScreen!.scm).toBe(origScreen.scm)
      expect(roundScreen!.bky).toBe(origScreen.bky)
    }

    expect(reparsed.assets.length).toBe(original.assets.length)
  })
})