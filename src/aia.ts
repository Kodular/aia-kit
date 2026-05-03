import { parseScm } from '#/components/scm-parser.js'
import { serializeScm } from '#/components/scm-serializer.js'
import type { Diagnostic } from '#/core/diagnostics.js'
import type {
  AiaAsset,
  AiaExtension,
  AiaProject,
  AiaScreen,
  MutationResult,
} from '#/core/types.js'
import { findUniqueName } from '#/utils/naming.js'

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

export interface MergeOptions {
  screenConflict: 'skip' | 'overwrite' | 'rename'
  assetConflict: 'skip' | 'overwrite'
  includeExtensions: boolean
}

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

export function addAsset(project: AiaProject, asset: AiaAsset): MutationResult {
  if (project.assets.some(existing => existing.name === asset.name)) {
    return {
      project,
      diagnostics: [duplicateName(['assets', asset.name], `Asset "${asset.name}" already exists`)],
    }
  }

  return {
    project: { ...project, assets: [...project.assets, asset] },
    diagnostics: [],
  }
}

export function removeAsset(project: AiaProject, assetName: string): MutationResult {
  if (!project.assets.some(asset => asset.name === assetName)) {
    return {
      project,
      diagnostics: [{
        code: 'MISSING_ASSET_REF',
        severity: 'error',
        path: ['assets', assetName],
        message: `Asset "${assetName}" not found`,
      }],
    }
  }

  return {
    project: {
      ...project,
      assets: project.assets.filter(asset => asset.name !== assetName),
    },
    diagnostics: [],
  }
}

export function addExtension(project: AiaProject, extension: AiaExtension): MutationResult {
  if (project.extensions.some(existing => existing.packageName === extension.packageName)) {
    return {
      project,
      diagnostics: [extensionVersionDiagnostic(
        extension.packageName,
        `Extension "${extension.packageName}" is already registered - remove it first to replace`,
      )],
    }
  }

  return {
    project: { ...project, extensions: [...project.extensions, extension] },
    diagnostics: [],
  }
}

export function removeExtension(project: AiaProject, packageName: string): MutationResult {
  if (!project.extensions.some(extension => extension.packageName === packageName)) {
    return {
      project,
      diagnostics: [extensionVersionDiagnostic(packageName, `Extension "${packageName}" not found`)],
    }
  }

  return {
    project: {
      ...project,
      extensions: project.extensions.filter(extension => extension.packageName !== packageName),
    },
    diagnostics: [],
  }
}

export function mergeProjects(
  target: AiaProject,
  source: AiaProject,
  options: MergeOptions,
): MutationResult {
  const screens = [...target.screens]
  const assets = [...target.assets]
  const extensions = [...target.extensions]

  for (const screen of source.screens) {
    const existingIdx = screens.findIndex(existing => existing.name === screen.name)
    if (existingIdx === -1) {
      screens.push(screen)
      continue
    }

    if (options.screenConflict === 'overwrite') {
      screens[existingIdx] = screen
    } else if (options.screenConflict === 'rename') {
      const uniqueName = findUniqueName(screen.name, screens.map(existing => existing.name))
      const root = parseScm(screen.scm)
      screens.push({
        ...screen,
        name: uniqueName,
        scm: serializeScm({ ...root, name: uniqueName }, screen.scm),
        yail: null,
      })
    }
  }

  for (const asset of source.assets) {
    const existingIdx = assets.findIndex(existing => existing.name === asset.name)
    if (existingIdx === -1) {
      assets.push(asset)
      continue
    }

    if (options.assetConflict === 'overwrite') {
      assets[existingIdx] = asset
    }
  }

  if (options.includeExtensions) {
    for (const extension of source.extensions) {
      if (!extensions.some(existing => existing.packageName === extension.packageName)) {
        extensions.push(extension)
      }
    }
  }

  return {
    project: { ...target, screens, assets, extensions },
    diagnostics: [],
  }
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

function duplicateName(path: string[], message: string): Diagnostic {
  return {
    code: 'DUPLICATE_COMPONENT_NAME',
    severity: 'error',
    path,
    message,
  }
}

function extensionVersionDiagnostic(packageName: string, message: string): Diagnostic {
  return {
    code: 'VERSION_MISMATCH',
    severity: 'error',
    path: ['extensions', packageName],
    message,
  }
}
