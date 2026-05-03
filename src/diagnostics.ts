export type DiagnosticSeverity = 'error' | 'warning' | 'info'

export type DiagnosticCode =
  | 'MISSING_SCREEN_FILE'
  | 'UNRESOLVABLE_COMPONENT'
  | 'INVALID_PROPERTY'
  | 'DUPLICATE_COMPONENT_NAME'
  | 'ORPHANED_BLOCK'
  | 'VERSION_MISMATCH'
  | 'MISSING_ASSET_REF'
  | 'MALFORMED_SCM'
  | 'MALFORMED_BKY'
  | 'PLATFORM_INCOMPATIBLE_COMPONENT'
  | 'PLATFORM_INCOMPATIBLE_PROPERTY'
  | 'EXTENSION_BREAKING_CHANGE'

export interface Diagnostic {
  code: DiagnosticCode
  severity: DiagnosticSeverity
  path: string[]
  message: string
}

export const mergeReports = (...reports: Diagnostic[][]): Diagnostic[] => reports.flat()
