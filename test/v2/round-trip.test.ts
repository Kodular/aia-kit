import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { parseAia } from '../../src/parse.js'
import { writeAia } from '../../src/write.js'

const FIXTURES = join(import.meta.dirname, '../fixtures')
const AIA_FILES = readdirSync(FIXTURES).filter(f => f.endsWith('.aia'))

describe('round-trip: parseAia → writeAia → parseAia', () => {
  for (const filename of AIA_FILES) {
    it(`preserves ${filename}`, async () => {
      const bytes = readFileSync(join(FIXTURES, filename))
      const original = await parseAia(new Uint8Array(bytes))

      const written = await writeAia(original)
      const reparsed = await parseAia(new Uint8Array(await written.arrayBuffer()))

      // Screen names preserved
      expect(reparsed.screens.map(s => s.name).sort())
        .toEqual(original.screens.map(s => s.name).sort())

      // SCM and BKY content preserved for each screen
      for (const origScreen of original.screens) {
        const roundScreen = reparsed.screens.find(s => s.name === origScreen.name)
        expect(roundScreen, `Screen ${origScreen.name} missing after round-trip`).toBeDefined()
        expect(roundScreen!.scm).toBe(origScreen.scm)
        expect(roundScreen!.bky).toBe(origScreen.bky)
      }

      // Asset count preserved
      expect(reparsed.assets.length).toBe(original.assets.length)
    })
  }
})
