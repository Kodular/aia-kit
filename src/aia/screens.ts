import { parseScm } from '#/scm/parse.js'
import { serializeScm } from '#/scm/serialize.js'
import type { AiaProject, AiaScreen, MutationResult } from '#/types.js'
import { duplicateName, missingScreen } from './mutation-diagnostics.js'

export function getScreen(project: AiaProject, name: string): AiaScreen | null {
  return project.screens.find(screen => screen.name === name) ?? null
}

export function addScreen(project: AiaProject, screen: AiaScreen): MutationResult {
  if (project.screens.some(existing => existing.name === screen.name)) {
    return {
      project,
      diagnostics: [duplicateName(['screens', screen.name], `Screen "${screen.name}" already exists`)],
    }
  }

  return {
    project: { ...project, screens: [...project.screens, screen] },
    diagnostics: [],
  }
}

export function removeScreen(project: AiaProject, screenName: string): MutationResult {
  if (!project.screens.some(screen => screen.name === screenName)) {
    return { project, diagnostics: [missingScreen(screenName)] }
  }

  return {
    project: {
      ...project,
      screens: project.screens.filter(screen => screen.name !== screenName),
    },
    diagnostics: [],
  }
}

export function cloneScreen(project: AiaProject, screenName: string, newName: string): MutationResult {
  const screen = project.screens.find(existing => existing.name === screenName)
  if (!screen) {
    return { project, diagnostics: [missingScreen(screenName)] }
  }
  if (project.screens.some(existing => existing.name === newName)) {
    return {
      project,
      diagnostics: [duplicateName(['screens', newName], `Screen "${newName}" already exists`)],
    }
  }

  const root = parseScm(screen.scm)
  const cloned: AiaScreen = {
    name: newName,
    scm: serializeScm({ ...root, name: newName }, screen.scm),
    bky: screen.bky,
    yail: null,
  }

  return {
    project: { ...project, screens: [...project.screens, cloned] },
    diagnostics: [],
  }
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
