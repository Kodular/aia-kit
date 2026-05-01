import { describe, it, expect } from 'vitest'
import { mergeReports } from '../../../src/core/diagnostics.js'
import type { Diagnostic } from '../../../src/core/diagnostics.js'

describe('mergeReports', () => {
  it('merges empty arrays', () => {
    expect(mergeReports()).toEqual([])
  })

  it('merges multiple arrays into a flat array', () => {
    const a: Diagnostic[] = [
      { code: 'MISSING_SCREEN_FILE', severity: 'error', path: ['screens', 'Screen1'], message: 'missing' }
    ]
    const b: Diagnostic[] = [
      { code: 'ORPHANED_BLOCK', severity: 'warning', path: ['screens', 'Screen2'], message: 'orphaned' }
    ]
    expect(mergeReports(a, b)).toEqual([...a, ...b])
  })

  it('preserves order', () => {
    const d1: Diagnostic = { code: 'MALFORMED_SCM', severity: 'error', path: [], message: 'bad scm' }
    const d2: Diagnostic = { code: 'MALFORMED_BKY', severity: 'error', path: [], message: 'bad bky' }
    expect(mergeReports([d1], [d2])).toEqual([d1, d2])
  })
})
