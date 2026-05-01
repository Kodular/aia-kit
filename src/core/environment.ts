import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import type { ComponentDescriptor } from './descriptors.js'
import type { AiaExtension } from './types.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

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

  private static async loadJson(platform: string): Promise<ComponentDescriptor[]> {
    const path = join(__dirname, '../../environments', platform, 'simple_components.json')
    const text = await readFile(path, 'utf-8')
    return JSON.parse(text) as ComponentDescriptor[]
  }

  static async kodularCreator(): Promise<Environment> {
    return new Environment(await Environment.loadJson('kodular-creator'))
  }

  static async mitAppInventor(): Promise<Environment> {
    return new Environment(await Environment.loadJson('mit-app-inventor'))
  }
}
