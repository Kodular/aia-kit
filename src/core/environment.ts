import type { ComponentDescriptor } from './descriptors.js'
import type { AiaExtension } from './types.js'

export class Environment {
  private readonly descriptors: ReadonlyArray<ComponentDescriptor>

  private constructor(descriptors: ComponentDescriptor[]) {
    this.descriptors = descriptors
  }

  lookup(typeName: string): ComponentDescriptor | null {
    return this.descriptors.find(d => d.type === typeName) ?? null
  }

  withExtension(ext: AiaExtension): Environment {
    return new Environment([...this.descriptors, ...ext.components])
  }

  withExtensions(exts: AiaExtension[]): Environment {
    return new Environment([...this.descriptors, ...exts.flatMap(e => e.components)])
  }

  static async kodularCreator(): Promise<Environment> {
    const json = (await import('../environments/kodular-creator/simple_components.json', {
      with: { type: 'json' }
    })).default
    return new Environment(json as ComponentDescriptor[])
  }

  static async mitAppInventor(): Promise<Environment> {
    const json = (await import('../environments/mit-app-inventor/simple_components.json', {
      with: { type: 'json' }
    })).default
    return new Environment(json as ComponentDescriptor[])
  }
}
