import type { AiaExtension, AiaProject, MutationResult } from '#/types.js'
import { extensionVersionDiagnostic } from './mutation-diagnostics.js'

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
