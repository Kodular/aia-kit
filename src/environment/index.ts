import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { ComponentDescriptor } from '#/component-descriptor/descriptors.js'
import {
  ComponentRegistry,
  MutableComponentRegistry,
} from '#/component-descriptor/registries.js'
import { EnvironmentConstructionError } from '#/errors.js'
import {
  BuiltinBlockRegistry,
  defaultBlockRegistry,
  type BuiltinBlockDescriptor,
} from './builtin-blocks.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

export const Platform = {
  MitAppInventor: 'mit-app-inventor',
  KodularCreator: 'kodular-creator',
} as const

export type Platform = typeof Platform[keyof typeof Platform]

export interface EnvironmentMeta {
  id: string
  name: string
  version?: string
  website?: string
  source?: string
}

export interface Environment {
  readonly componentRegistry: ComponentRegistry
  readonly builtinBlockRegistry: BuiltinBlockRegistry
  readonly meta: EnvironmentMeta
}

export interface CreateEnvironmentInput {
  meta: EnvironmentMeta
  components: ComponentRegistry | Iterable<ComponentDescriptor>
  builtinBlocks?: BuiltinBlockRegistry | Iterable<BuiltinBlockDescriptor>
}

const platformNames: Record<Platform, string> = {
  [Platform.MitAppInventor]: 'MIT App Inventor',
  [Platform.KodularCreator]: 'Kodular Creator',
}

const environmentCache = new Map<Platform, Promise<Environment>>()

export function createEnvironment(input: CreateEnvironmentInput): Environment {
  const meta = validateMeta(input.meta)
  const componentRegistry = input.components instanceof MutableComponentRegistry
    ? input.components.snapshot()
    : input.components instanceof ComponentRegistry
      ? input.components
      : ComponentRegistry.of(input.components)
  const builtinBlockRegistry = input.builtinBlocks === undefined
    ? defaultBlockRegistry()
    : input.builtinBlocks instanceof BuiltinBlockRegistry
      ? input.builtinBlocks
      : BuiltinBlockRegistry.of(input.builtinBlocks)

  return Object.freeze({
    meta,
    componentRegistry,
    builtinBlockRegistry,
  })
}

export function getEnvironmentFor(platform: Platform): Promise<Environment> {
  const cached = environmentCache.get(platform)
  if (cached) return cached

  const promise = loadEnvironment(platform).catch((error: unknown) => {
    environmentCache.delete(platform)
    throw error
  })
  environmentCache.set(platform, promise)
  return promise
}

async function loadEnvironment(platform: Platform): Promise<Environment> {
  const source = `environments/${platform}/simple_components.json`
  const path = join(__dirname, '../..', source)
  const text = await readFile(path, 'utf-8')
  const components = JSON.parse(text) as ComponentDescriptor[]

  return createEnvironment({
    meta: {
      id: platform,
      name: platformNames[platform],
      source,
    },
    components,
    builtinBlocks: defaultBlockRegistry(),
  })
}

function validateMeta(meta: EnvironmentMeta): EnvironmentMeta {
  if (!hasNonBlankString(meta, 'id')) {
    throw new EnvironmentConstructionError('Environment meta.id is required')
  }
  if (!hasNonBlankString(meta, 'name')) {
    throw new EnvironmentConstructionError('Environment meta.name is required')
  }
  return Object.freeze({ ...meta })
}

function hasNonBlankString(
  meta: EnvironmentMeta,
  key: 'id' | 'name',
): boolean {
  const value = key === 'id' ? meta.id : meta.name
  return typeof value === 'string' && value.trim() !== ''
}
