import { parseBky } from '#/bky/parse.js'
import { buildModel } from '#/model/index.js'
import type { AiaProject } from '#/types.js'
import type { Environment } from '#/environment/index.js'
import type { Diagnostic } from '#/diagnostics.js'

export function diagnose(project: AiaProject, env: Environment): Diagnostic[] {
  const model = buildModel(project, env)
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
