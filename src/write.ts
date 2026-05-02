import { BlobWriter, ZipWriter, TextReader, BlobReader } from '@zip.js/zip.js'
import type { AiaProject, ProjectProperties } from '#/core/types.js'
import type { ModelProject } from '#/core/model.js'
import { AiaWriteError } from '#/core/errors.js'
import { createYailGenerator } from '#/yail/index.js'

export async function writeAia(project: AiaProject | ModelProject): Promise<Blob> {
  const isModel = '_tag' in project && project._tag === 'ModelProject'
  const raw: AiaProject = isModel
    ? (project as ModelProject).source
    : project as AiaProject
  const yailGen = isModel ? createYailGenerator(project as ModelProject) : null
  const modelScreens = isModel ? (project as ModelProject).screens : null

  try {
    const zw = new ZipWriter(new BlobWriter('application/zip'))

    await zw.add(
      'youngandroidproject/project.properties',
      new TextReader(serializeProperties(raw.properties))
    )

    const packagePath = getPackagePath(raw.properties)

    for (const screen of raw.screens) {
      const dir = `src/${packagePath}`
      await zw.add(`${dir}/${screen.name}.scm`, new TextReader(screen.scm))
      await zw.add(`${dir}/${screen.name}.bky`, new TextReader(screen.bky))
      let yailOut = screen.yail
      if (yailOut == null && yailGen && modelScreens) {
        const ms = modelScreens.find(s => s.name === screen.name)
        if (ms) yailOut = yailGen(ms)
      }
      if (yailOut) {
        await zw.add(`${dir}/${screen.name}.yail`, new TextReader(yailOut))
      }
    }

    for (const asset of raw.assets) {
      const data = await asset.data()
      await zw.add(`assets/${asset.name}`, new BlobReader(new Blob([data instanceof Uint8Array ? data.buffer as ArrayBuffer : data])))
    }

    for (const ext of raw.extensions) {
      const descriptor = JSON.stringify(
        ext.components.length === 1 ? ext.components[0] : ext.components
      )
      await zw.add(
        `assets/external_comps/${ext.packageName}/component${ext.components.length > 1 ? 's' : ''}.json`,
        new TextReader(descriptor)
      )
    }

    return zw.close()
  } catch (e) {
    if (e instanceof AiaWriteError) throw e
    throw new AiaWriteError(`Failed to write AIA: ${e}`)
  }
}

export function serializeProperties(props: ProjectProperties): string {
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

function getPackagePath(properties: ProjectProperties): string {
  const parts = properties.main.split('.')
  // main = "appinventor.ai_user.ProjectName.ScreenName"
  // we want "appinventor/ai_user/ProjectName" (everything except last part)
  if (parts.length > 1) {
    return parts.slice(0, -1).join('/')
  }
  return 'appinventor/ai_user/Project'
}
