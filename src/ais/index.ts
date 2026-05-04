import type { AiaProject } from '#/types.js'

/** AIS uses the same ZIP conventions as AIA; use `readAia` until AIS-specific rules are needed. */
export async function readAis(_input: Uint8Array | ArrayBuffer | Blob): Promise<AiaProject> {
  throw new Error('readAis is not implemented yet')
}

/** Export one screen as an AIS-shaped archive (AIA-compatible ZIP with a single screen entry). */
export async function exportScreenAsAis(_project: AiaProject, _screenName: string): Promise<Blob> {
  throw new Error('exportScreenAsAis is not implemented yet')
}
