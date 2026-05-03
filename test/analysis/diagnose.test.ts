import { describe, it, expect } from 'vitest'
import { diagnose } from '#/analysis/diagnose.js'
import type { AiaProject, AiaScreen } from '#/types.js'
import { Platform, getEnvironmentFor } from '#/environment/index.js'
import { makeProjectProperties } from '../helpers.js'

const EMPTY_SCM = `#|
$JSON
{"authURL":["aia-kit"],"YaVersion":"1","Source":"Form","Properties":{"$Name":"Screen1","$Type":"Form","Uuid":"root","Title":"Screen1","$Components":[]}}
`

const EMPTY_BKY = `<xml xmlns="https://developers.google.com/blockly/xml"></xml>`

function makeScreen(name: string, scm = EMPTY_SCM, bky = EMPTY_BKY): AiaScreen {
  return { name, scm, bky, yail: null }
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

describe('diagnose', () => {
  it('appends MALFORMED_BKY for invalid BKY XML and path includes screen name', async () => {
    const env = await getEnvironmentFor(Platform.MitAppInventor)
    const project = makeProject({
      screens: [makeScreen('Bad', EMPTY_SCM, '<<<')],
    })
    const d = diagnose(project, env)
    const malformed = d.filter(x => x.code === 'MALFORMED_BKY')
    expect(malformed.length).toBeGreaterThan(0)
    expect(malformed.some(x => x.path.includes('Bad'))).toBe(true)
  })

  it('does not add MALFORMED_BKY when BKY parses and SCM resolves', async () => {
    const env = await getEnvironmentFor(Platform.MitAppInventor)
    const project = makeProject({
      screens: [makeScreen('S1', EMPTY_SCM, EMPTY_BKY)],
    })
    const d = diagnose(project, env).filter(x => x.code === 'MALFORMED_BKY')
    expect(d).toEqual([])
  })
})
