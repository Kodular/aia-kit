export interface ProjectProperties {
  /** Fully-qualified main screen class, e.g. "appinventor.ai_user.MyApp.Screen1" */
  main: string
  name: string
  versionCode: number
  versionName: string
  appName?: string
  sizing?: 'Fixed' | 'Responsive'
  theme?: string
  colorPrimary?: string
  colorPrimaryDark?: string
  colorAccent?: string
  showListsAsJsonArray?: boolean
  actionBar?: boolean
  /** All other key-value pairs not explicitly modelled above */
  unknown: Record<string, string>
}

export function parseProjectProperties(raw: Record<string, string>): ProjectProperties {
  const known = new Set([
    'main', 'name', 'versioncode', 'versionname', 'aname', 'sizing', 'theme',
    'color.primary', 'color.primary.dark', 'color.accent',
    'showlistsasjsonarray', 'actionbar',
  ])
  const unknown: Record<string, string> = {}
  for (const [k, v] of Object.entries(raw)) {
    if (!known.has(k.toLowerCase())) unknown[k] = v
  }
  return {
    main: raw['main'] ?? '',
    name: raw['name'] ?? raw['aname'] ?? '',
    versionCode: parseInt(raw['versioncode'] ?? '1', 10) || 1,
    versionName: raw['versionname'] ?? '1.0',
    appName: raw['aname'],
    sizing: raw['sizing'] === 'Fixed' || raw['sizing'] === 'Responsive'
      ? raw['sizing'] as 'Fixed' | 'Responsive'
      : undefined,
    theme: raw['theme'],
    colorPrimary: raw['color.primary'],
    colorPrimaryDark: raw['color.primary.dark'],
    colorAccent: raw['color.accent'],
    showListsAsJsonArray: raw['showlistsasjsonarray'] === 'true' ? true
      : raw['showlistsasjsonarray'] === 'false' ? false : undefined,
    actionBar: raw['actionbar'] === 'true' ? true
      : raw['actionbar'] === 'false' ? false : undefined,
    unknown,
  }
}

export function serializeProjectProperties(props: ProjectProperties): string {
  const entries: [string, string][] = [
    ['main', props.main],
    ['name', props.name],
    ['versioncode', String(props.versionCode)],
    ['versionname', props.versionName],
  ]
  if (props.appName !== undefined) entries.push(['aname', props.appName])
  if (props.sizing !== undefined) entries.push(['sizing', props.sizing])
  if (props.theme !== undefined) entries.push(['theme', props.theme])
  if (props.colorPrimary !== undefined) entries.push(['color.primary', props.colorPrimary])
  if (props.colorPrimaryDark !== undefined) entries.push(['color.primary.dark', props.colorPrimaryDark])
  if (props.colorAccent !== undefined) entries.push(['color.accent', props.colorAccent])
  if (props.showListsAsJsonArray !== undefined)
    entries.push(['showlistsasjsonarray', String(props.showListsAsJsonArray)])
  if (props.actionBar !== undefined) entries.push(['actionbar', String(props.actionBar)])
  for (const [k, v] of Object.entries(props.unknown)) entries.push([k, v])
  return entries.map(([k, v]) => `${k}=${v}`).join('\n') + '\n'
}
