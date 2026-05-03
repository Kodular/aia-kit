import type { Diagnostic } from '#/core/diagnostics.js'
import type {
  AiaProject,
  AiaScreen,
  MutationResult,
} from '#/core/types.js'

export { parseAia as readAia } from '#/parse.js'
export { writeAia } from '#/write.js'
export type {
  AiaProject,
  AiaScreen,
  AiaAsset,
  AiaExtension,
  AixManifest,
  AixAsset,
  AiaComponent,
  MutationResult,
  ProjectProperties,
} from '#/core/types.js'

export { addScreen, removeScreen } from '#/mutations/screens.js'
export { addAsset, removeAsset } from '#/mutations/assets.js'
export { addExtension, removeExtension } from '#/mutations/extensions.js'

export function getScreen(project: AiaProject, name: string): AiaScreen | null {
  return project.screens.find(screen => screen.name === name) ?? null
}

export function replaceScreen(project: AiaProject, screen: AiaScreen): MutationResult {
  const idx = project.screens.findIndex(existing => existing.name === screen.name)
  if (idx === -1) {
    return { project, diagnostics: [missingScreen(screen.name)] }
  }

  const screens = [...project.screens]
  screens[idx] = screen
  return { project: { ...project, screens }, diagnostics: [] }
}

export function replaceScreenScm(
  project: AiaProject,
  screenName: string,
  scm: string,
): MutationResult {
  return replaceScreenFile(project, screenName, screen => ({ ...screen, scm, yail: null }))
}

export function replaceScreenBky(
  project: AiaProject,
  screenName: string,
  bky: string,
): MutationResult {
  return replaceScreenFile(project, screenName, screen => ({ ...screen, bky, yail: null }))
}

function replaceScreenFile(
  project: AiaProject,
  screenName: string,
  update: (screen: AiaScreen) => AiaScreen,
): MutationResult {
  const idx = project.screens.findIndex(screen => screen.name === screenName)
  if (idx === -1) {
    return { project, diagnostics: [missingScreen(screenName)] }
  }

  const screens = [...project.screens]
  screens[idx] = update(screens[idx])
  return { project: { ...project, screens }, diagnostics: [] }
}

function missingScreen(screenName: string): Diagnostic {
  return {
    code: 'MISSING_SCREEN_FILE',
    severity: 'error',
    path: ['screens', screenName],
    message: `Screen "${screenName}" not found`,
  }
}
