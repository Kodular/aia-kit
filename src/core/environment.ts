import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import type { ComponentDescriptor } from '#/core/descriptors.js'
import type { AiaExtension } from '#/core/types.js'
import type { ComponentRegistry, BlockRegistry } from '#/core/registries.js'
import { createComponentRegistry, defaultBlockRegistry } from '#/core/registries.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

export class Environment {
  readonly componentRegistry: ComponentRegistry
  readonly blockRegistry: BlockRegistry

  private constructor(componentRegistry: ComponentRegistry, blockRegistry: BlockRegistry) {
    this.componentRegistry = componentRegistry
    this.blockRegistry = blockRegistry
  }

  /** Convenience delegation to componentRegistry.lookup() */
  lookup(typeName: string): ComponentDescriptor | null {
    return this.componentRegistry.lookup(typeName)
  }

  withExtension(ext: AiaExtension): Environment {
    return new Environment(
      this.componentRegistry.extend(ext.components),
      this.blockRegistry,
    )
  }

  withExtensions(exts: AiaExtension[]): Environment {
    return new Environment(
      this.componentRegistry.extend(exts.flatMap(e => e.components)),
      this.blockRegistry,
    )
  }

  private static async loadJson(platform: string): Promise<ComponentDescriptor[]> {
    const path = join(__dirname, '../../environments', platform, 'simple_components.json')
    const text = await readFile(path, 'utf-8')
    return JSON.parse(text) as ComponentDescriptor[]
  }

  static async kodularCreator(): Promise<Environment> {
    const descriptors = await Environment.loadJson('kodular-creator')
    return new Environment(createComponentRegistry(descriptors), defaultBlockRegistry())
  }

  static async mitAppInventor(): Promise<Environment> {
    const descriptors = await Environment.loadJson('mit-app-inventor')
    return new Environment(createComponentRegistry(descriptors), defaultBlockRegistry())
  }
}
