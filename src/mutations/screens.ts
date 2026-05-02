import { parseScm } from '#/components/scm-parser.js'
import { serializeScm } from '#/components/scm-serializer.js'
import type { AiaProject, AiaScreen, MutationResult } from '#/core/types.js'

export function addScreen(project: AiaProject, screen: AiaScreen): MutationResult {
  if (project.screens.some(s => s.name === screen.name)) {
    return {
      project,
      diagnostics: [{
        code: 'DUPLICATE_COMPONENT_NAME',
        severity: 'error',
        path: ['screens', screen.name],
        message: `Screen "${screen.name}" already exists`,
      }],
    }
  }
  return {
    project: { ...project, screens: [...project.screens, screen] },
    diagnostics: [],
  }
}

export function removeScreen(project: AiaProject, screenName: string): MutationResult {
  const idx = project.screens.findIndex(s => s.name === screenName)
  if (idx === -1) {
    return {
      project,
      diagnostics: [{
        code: 'MISSING_SCREEN_FILE',
        severity: 'error',
        path: ['screens', screenName],
        message: `Screen "${screenName}" not found`,
      }],
    }
  }
  const screens = project.screens.filter(s => s.name !== screenName)
  return { project: { ...project, screens }, diagnostics: [] }
}

export function cloneScreen(project: AiaProject, screenName: string, newName: string): MutationResult {
  const screen = project.screens.find(s => s.name === screenName)
  if (!screen) {
    return {
      project,
      diagnostics: [{
        code: 'MISSING_SCREEN_FILE',
        severity: 'error',
        path: ['screens', screenName],
        message: `Screen "${screenName}" not found`,
      }],
    }
  }
  if (project.screens.some(s => s.name === newName)) {
    return {
      project,
      diagnostics: [{
        code: 'DUPLICATE_COMPONENT_NAME',
        severity: 'error',
        path: ['screens', newName],
        message: `Screen "${newName}" already exists`,
      }],
    }
  }
  const root = parseScm(screen.scm)
  const renamedRoot = { ...root, name: newName }
  const newScm = serializeScm(renamedRoot, screen.scm)
  const cloned: AiaScreen = { name: newName, scm: newScm, bky: screen.bky, yail: null } // YAIL is not cloned — regenerated in M2c
  return {
    project: { ...project, screens: [...project.screens, cloned] },
    diagnostics: [],
  }
}
