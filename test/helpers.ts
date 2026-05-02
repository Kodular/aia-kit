import type { ProjectProperties } from '#/core/types.js'

/** Returns a minimal valid {@link ProjectProperties} merged with any overrides. */
export function makeProjectProperties(overrides: Partial<ProjectProperties> = {}): ProjectProperties {
  return {
    main: '',
    name: '',
    versionCode: 1,
    versionName: '1.0',
    unknown: {},
    ...overrides,
  }
}
