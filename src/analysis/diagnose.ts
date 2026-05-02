import { parseBky } from '#/blocks/bky-parser.js'
import { resolve } from '#/resolve.js'
import type { AiaProject } from '#/core/types.js'
import type { Environment } from '#/core/environment.js'
import type { Diagnostic } from '#/core/diagnostics.js'

export function diagnose(project: AiaProject, env: Environment): Diagnostic[] {
  const model = resolve(project, env)
  const out: Diagnostic[] = [...model.diagnostics]
  for (const screen of project.screens) {
    try {
      parseBky(screen.bky)
    } catch (e) {
      out.push({
        code: 'MALFORMED_BKY',
        severity: 'error',
        path: ['screens', screen.name],
        message: `Invalid BKY for screen "${screen.name}": ${e}`,
      })
    }
  }
  return out
}
