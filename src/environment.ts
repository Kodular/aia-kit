import {
  Platform as PlatformValue,
  createEnvironment,
  getEnvironmentFor,
} from '#/core/environment.js'
import type {
  CreateEnvironmentInput,
  Environment,
  EnvironmentMeta,
  Platform as PlatformType,
} from '#/core/environment.js'

export const Platform = PlatformValue
export { createEnvironment, getEnvironmentFor }
export type {
  CreateEnvironmentInput,
  Environment,
  EnvironmentMeta,
}
export type Platform = PlatformType
