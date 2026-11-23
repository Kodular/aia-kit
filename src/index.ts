/**
 * Read, inspect, edit, check and write App Inventor / Kodular projects.
 *
 * A {@link Project} is plain immutable data. Every edit function returns a
 * new project and throws an {@link AiaKitError} subclass if it cannot be done.
 * @module
 */
export type {
  ArchiveFile,
  Asset,
  Block,
  BlockComment,
  BlockPropertyDescriptor,
  BlocksMeta,
  Component,
  ComponentDescriptor,
  EventDescriptor,
  Extension,
  JsonValue,
  MethodDescriptor,
  ParamDescriptor,
  Project,
  ProjectProperties,
  PropertyDescriptor,
  Screen,
  ScreenMeta,
  XmlElement,
} from "./types.ts";

// Archives
export { readAia, readAix, type ReadResult } from "./archive/read.ts";
export { writeAia, writeAix } from "./archive/write.ts";
export type { ArchiveInput } from "./archive/zip.ts";

// Queries
export {
  componentReference,
  findComponent,
  findParent,
  findScreen,
  getScreen,
  mainScreenName,
  packageName,
  walkBlocks,
  walkComponents,
  type ComponentReference,
} from "./query.ts";

// Edits
export { addScreen, copyScreen, removeScreen, renameScreen } from "./edit/screens.ts";
export {
  addComponent,
  createComponent,
  moveComponent,
  removeComponent,
  removeProperty,
  renameComponent,
  setProperty,
  updateComponent,
  type CreateComponentOptions,
  type Placement,
  type PropertyValue,
} from "./edit/components.ts";
export { mapBlocks, updateBlocks } from "./edit/blocks.ts";
export { addAsset, removeAsset, renameAsset, type AddOptions } from "./edit/assets.ts";
export { addExtension, removeExtension } from "./edit/extensions.ts";
export { setProjectProperties } from "./edit/properties.ts";
export { mergeProjects, type MergeOptions } from "./edit/merge.ts";

// Checks
export { check } from "./check.ts";
export type { Problem, ProblemCode } from "./problems.ts";

// Errors
export {
  AiaKitError,
  ArchiveError,
  ConflictError,
  InvalidOperationError,
  NotFoundError,
  ParseError,
  type EntityKind,
} from "./errors.ts";
