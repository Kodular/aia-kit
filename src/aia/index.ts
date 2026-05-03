export { readAia } from './read-archive.js'
export { writeAia } from './write-archive.js'
export type { WriteAiaOptions } from './write-archive.js'
export type {
  AiaProject,
  AiaScreen,
  AiaAsset,
  AiaExtension,
  AixManifest,
  AixAsset,
  AiaComponent,
  MutationResult,
} from '#/types.js'
export type { ProjectProperties } from '#/project-properties/index.js'
export type { MergeOptions } from './merge.js'
export {
  getScreen,
  addScreen,
  removeScreen,
  cloneScreen,
  replaceScreen,
  replaceScreenScm,
  replaceScreenBky,
} from './screens.js'
export { addAsset, removeAsset } from './assets.js'
export { addExtension, removeExtension } from './extensions.js'
export { mergeProjects } from './merge.js'
