import { readAia } from '#/aia/read-archive.js'
import { getScreen } from '#/aia/screens.js'
import type { AiaProject } from '#/types.js'
import { writeAia } from '#/aia/write-archive.js'

/** AIS uses the same ZIP conventions as AIA; use `readAia` until AIS-specific rules are needed. */
export async function readAis(input: Uint8Array | ArrayBuffer | Blob): Promise<AiaProject> {
  return readAia(input)
}

/** Export one screen as an AIS-shaped archive (AIA-compatible ZIP with a single screen entry). */
export async function exportScreenAsAis(project: AiaProject, screenName: string): Promise<Blob> {
  const screen = getScreen(project, screenName)
  if (!screen) {
    throw new Error(`Screen "${screenName}" not found`)
  }
  const aisProject: AiaProject = {
    ...project,
    screens: [screen],
  }
  return writeAia(aisProject)
}
