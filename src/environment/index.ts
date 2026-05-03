import type { ComponentDescriptor } from '#/component-descriptor/descriptors.js'
import {
  ComponentRegistry,
  MutableComponentRegistry,
} from '#/component-descriptor/registries.js'
import { EnvironmentConstructionError } from '#/errors.js'
import { createAsyncMemoByKey } from '#/utils/memo-async.js'
import {
  BuiltinBlockRegistry,
  defaultBlockRegistry,
  type BuiltinBlockDescriptor,
} from './builtin-blocks.js'

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

async function importBundledSimpleComponents(
  platform: Platform,
): Promise<ComponentDescriptor[]> {
  switch (platform) {
    case Platform.MitAppInventor: {
      const m = await import('../../environments/mit-app-inventor/simple_components.json', {
        with: { type: 'json' },
      })
      return m.default as unknown as ComponentDescriptor[]
    }
    case Platform.KodularCreator: {
      const m = await import('../../environments/kodular-creator/simple_components.json', {
        with: { type: 'json' },
      })
      return m.default as unknown as ComponentDescriptor[]
    }
  }
}

export const getEnvironmentFor = createAsyncMemoByKey(async (platform: Platform) => {
  const components = await importBundledSimpleComponents(platform)

  return createEnvironment({
    meta: {
      id: platform,
      name: platformNames[platform],
    },
    components,
    builtinBlocks: defaultBlockRegistry(),
  })
})

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
