import type { AiaComponent } from '#/core/types.js'

interface RawComponentJson {
  $Name: string
  $Type: string
  Uuid: string
  $Components?: RawComponentJson[]
  [key: string]: unknown
}

interface ScmJson {
  YaVersion: string
  Source: string
  Properties: RawComponentJson
}

export function parseScm(scm: string): AiaComponent {
  const match = scm.match(/#\|\s*\$JSON\s*([\s\S]*?)\s*\|#/)
  if (!match || !match[1]) {
    throw new Error('Invalid SCM format: no $JSON block found')
  }
  let data: ScmJson
  try {
    data = JSON.parse(match[1].trim())
  } catch (e) {
    throw new Error(`Invalid SCM format: JSON parse failed — ${e}`)
  }
  return parseComponent(data.Properties)
}

function parseComponent(raw: RawComponentJson): AiaComponent {
  const properties: Record<string, string> = {}
  for (const [key, value] of Object.entries(raw)) {
    if (!key.startsWith('$') && key !== 'Uuid') {
      properties[key] = String(value)
    }
  }
  const children = (raw.$Components ?? []).map(parseComponent)
  return {
    name: raw.$Name,
    type: raw.$Type,
    uid: raw.Uuid,
    properties,
    children,
  }
}
