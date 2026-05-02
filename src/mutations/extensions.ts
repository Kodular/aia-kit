import type { AiaProject, AiaExtension, MutationResult } from '#/core/types.js'

export function addExtension(project: AiaProject, extension: AiaExtension): MutationResult {
  if (project.extensions.some(e => e.packageName === extension.packageName)) {
    return {
      project,
      diagnostics: [{
        code: 'VERSION_MISMATCH',
        severity: 'error',
        path: ['extensions', extension.packageName],
        message: `Extension "${extension.packageName}" is already registered — remove it first to replace`,
      }],
    }
  }
  return {
    project: { ...project, extensions: [...project.extensions, extension] },
    diagnostics: [],
  }
}

export function removeExtension(project: AiaProject, packageName: string): MutationResult {
  const idx = project.extensions.findIndex(e => e.packageName === packageName)
  if (idx === -1) {
    return {
      project,
      diagnostics: [{
        code: 'VERSION_MISMATCH',
        severity: 'error',
        path: ['extensions', packageName],
        message: `Extension "${packageName}" not found`,
      }],
    }
  }
  return {
    project: { ...project, extensions: project.extensions.filter(e => e.packageName !== packageName) },
    diagnostics: [],
  }
}
