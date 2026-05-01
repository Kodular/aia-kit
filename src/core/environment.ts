import type { ComponentDescriptor } from './descriptors.js'
import type { AiaExtension } from './types.js'

// Stub — replaced by full implementation in Task 9
export class Environment {
  lookup(_typeName: string): ComponentDescriptor | null {
    return null
  }

  withExtension(_ext: AiaExtension): Environment {
    return this
  }

  withExtensions(_exts: AiaExtension[]): Environment {
    return this
  }

  static async kodularCreator(): Promise<Environment> {
    return new Environment()
  }

  static async mitAppInventor(): Promise<Environment> {
    return new Environment()
  }
}
