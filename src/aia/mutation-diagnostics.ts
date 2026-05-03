import type { Diagnostic } from '#/diagnostics.js'

export function duplicateName(path: string[], message: string): Diagnostic {
  return {
    code: 'DUPLICATE_COMPONENT_NAME',
    severity: 'error',
    path,
    message,
  }
}

export function missingScreen(screenName: string): Diagnostic {
  return {
    code: 'MISSING_SCREEN_FILE',
    severity: 'error',
    path: ['screens', screenName],
    message: `Screen "${screenName}" not found`,
  }
}

export function missingAssetRef(assetName: string): Diagnostic {
  return {
    code: 'MISSING_ASSET_REF',
    severity: 'error',
    path: ['assets', assetName],
    message: `Asset "${assetName}" not found`,
  }
}

export function extensionVersionDiagnostic(packageName: string, message: string): Diagnostic {
  return {
    code: 'VERSION_MISMATCH',
    severity: 'error',
    path: ['extensions', packageName],
    message,
  }
}
