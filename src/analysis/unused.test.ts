import { describe, it, expect } from 'vitest'
import type { AiaProject, AiaScreen, AiaAsset, AiaExtension } from '#/types.js'
import type { ComponentDescriptor } from '#/component-descriptor/descriptors.js'
import { Platform, getEnvironmentFor } from '#/environment/index.js'
import { buildModel } from '#/model/index.js'
import { findUnusedExtensions, findUnusedAssets, findAssetReferences } from '#/analysis/unused.js'
import { makeProjectProperties } from '#/test-helpers.js'

const EMPTY_SCM = `#|
$JSON
{"authURL":["aia-kit"],"YaVersion":"1","Source":"Form","Properties":{"$Name":"Screen1","$Type":"Form","Uuid":"root","Title":"Screen1","$Components":[]}}
|#`

const EMPTY_BKY = `<xml xmlns="https://developers.google.com/blockly/xml"></xml>`

function makeScreen(name: string, scm = EMPTY_SCM, bky = EMPTY_BKY): AiaScreen {
  return { name, scm, bky, yail: null }
}

function makeAsset(name: string): AiaAsset {
  return { name, type: 'png', sizeBytes: 1, data: async () => new Uint8Array() }
}

function fakeDescriptor(type: string): ComponentDescriptor {
  return {
    type,
    name: type.split('.').pop() ?? type,
    external: true,
    version: 1,
    categoryString: 'EXTENSION',
    helpString: '',
    showOnPalette: true,
    nonVisible: false,
    iconName: '',
    properties: [],
    blockProperties: [],
    events: [],
    methods: [],
  }
}

function makeExtension(components: ComponentDescriptor[]): AiaExtension {
  return {
    packageName: 'com.fake.ext',
    version: 1,
    minSdk: 7,
    components,
    manifest: {
      packageName: 'com.fake.ext',
      version: 1,
      minSdk: 7,
      buildVersion: '1',
      permissions: [],
    },
    loadClassesJar: async () => new Uint8Array(),
    loadAssets: async () => [],
  }
}

function makeProject(overrides: Partial<AiaProject> = {}): AiaProject {
  return {
    _tag: 'AiaProject',
    name: 'Test',
    properties: makeProjectProperties(),
    screens: [makeScreen('Screen1')],
    assets: [],
    extensions: [],
    ...overrides,
  }
}

describe('findUnusedExtensions', () => {
  it('lists extension as unused when no SCM node uses any extension component type', async () => {
    const env = await getEnvironmentFor(Platform.MitAppInventor)
    const ext = makeExtension([fakeDescriptor('com.fake.Widget')])
    const project = makeProject({ extensions: [ext] })
    const model = buildModel(project, env)
    const unused = findUnusedExtensions(model)
    expect(unused.map(e => e.packageName)).toEqual(['com.fake.ext'])
  })

  it('does not list extension when SCM includes a component of that type', async () => {
    const env = await getEnvironmentFor(Platform.MitAppInventor)
    const ext = makeExtension([fakeDescriptor('com.fake.Widget')])
    const scmWithWidget = `#|
$JSON
{"authURL":["aia-kit"],"YaVersion":"1","Source":"Form","Properties":{"$Name":"Screen1","$Type":"Form","Uuid":"root","Title":"Screen1","$Components":[
  {"$Name":"W1","$Type":"com.fake.Widget","Uuid":"w1","$Components":[]}
]}}
|#`
    const project = makeProject({
      extensions: [ext],
      screens: [makeScreen('Screen1', scmWithWidget)],
    })
    const model = buildModel(project, env)
    expect(findUnusedExtensions(model)).toEqual([])
  })
})

describe('findUnusedAssets', () => {
  it('treats asset as unused when absent from scm, bky, and project.properties', async () => {
    const env = await getEnvironmentFor(Platform.MitAppInventor)
    const project = makeProject({ assets: [makeAsset('x.png')] })
    const model = buildModel(project, env)
    expect(findUnusedAssets(model).map(a => a.name)).toEqual(['x.png'])
  })

  it('does not treat asset as unused when filename appears in a Label Picture property', async () => {
    const env = await getEnvironmentFor(Platform.MitAppInventor)
    const scmLabelPicture = `#|
$JSON
{"authURL":["aia-kit"],"YaVersion":"1","Source":"Form","Properties":{"$Name":"Screen1","$Type":"Form","Uuid":"root","Title":"Screen1","$Components":[
  {"$Name":"Label1","$Type":"Label","Uuid":"l1","Picture":"x.png","$Components":[]}
]}}
|#`
    const project = makeProject({
      assets: [makeAsset('x.png')],
      screens: [makeScreen('Screen1', scmLabelPicture)],
    })
    const model = buildModel(project, env)
    expect(findUnusedAssets(model)).toEqual([])
  })
})

describe('findAssetReferences', () => {
  it('emits property reference when a component property value contains the asset name', async () => {
    const env = await getEnvironmentFor(Platform.MitAppInventor)
    const scm = `#|
$JSON
{"authURL":["aia-kit"],"YaVersion":"1","Source":"Form","Properties":{"$Name":"Screen1","$Type":"Form","Uuid":"root","BackgroundImage":"pic.png","$Components":[]}}
|#`
    const project = makeProject({
      assets: [makeAsset('pic.png')],
      screens: [makeScreen('Screen1', scm)],
    })
    const model = buildModel(project, env)
    expect(findAssetReferences(model)).toContainEqual({
      assetName: 'pic.png',
      kind: 'property',
      path: ['screens', 'Screen1', 'Screen1', 'BackgroundImage'],
    })
  })

  it('emits block_xml when BKY text contains the asset name', async () => {
    const env = await getEnvironmentFor(Platform.MitAppInventor)
    const bky = `${EMPTY_BKY.slice(0, -6)}<field name="TEXT">pic.png</field></xml>`
    const project = makeProject({
      assets: [makeAsset('pic.png')],
      screens: [makeScreen('Screen1', EMPTY_SCM, bky)],
    })
    const model = buildModel(project, env)
    expect(findAssetReferences(model)).toContainEqual({
      assetName: 'pic.png',
      kind: 'block_xml',
      path: ['screens', 'Screen1'],
    })
  })
})
