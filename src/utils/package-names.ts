import type { ProjectProperties } from '#/project-properties/index.js'

const FALLBACK_PACKAGE_PREFIX = 'appinventor.ai_user.Project'

export function getDotPackagePrefix(properties: ProjectProperties): string {
  const parts = properties.main.split('.').filter(Boolean)
  return parts.length > 1 ? parts.slice(0, -1).join('.') : FALLBACK_PACKAGE_PREFIX
}

export function getPackagePath(properties: ProjectProperties): string {
  return getDotPackagePrefix(properties).replaceAll('.', '/')
}

export function extractPackageName(typeName: string): string {
  const parts = typeName.split('.').filter(Boolean)
  return parts.length > 1 ? parts.slice(0, -1).join('.') : ''
}

export function extractClassName(typeName: string): string {
  const parts = typeName.split('.').filter(Boolean)
  return parts.at(-1) ?? typeName
}
