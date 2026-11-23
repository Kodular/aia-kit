import { RUNTIME_PACKAGE } from "../internal/names.ts";
import type { ComponentDescriptor, Project } from "../types.ts";

/** The built-in components of one App Inventor distribution. */
export interface Platform {
  readonly id: string;
  readonly name: string;
  /** Built-in components by fully qualified type. */
  readonly components: ReadonlyMap<string, ComponentDescriptor>;
}

/** Creates a platform from component descriptors (see `parseComponentDescriptors`). */
export function definePlatform(input: {
  readonly id: string;
  readonly name: string;
  readonly components: Iterable<ComponentDescriptor>;
}): Platform {
  const components = new Map<string, ComponentDescriptor>();
  for (const descriptor of input.components) components.set(descriptor.type, descriptor);
  return Object.freeze({ id: input.id, name: input.name, components });
}

const bySimpleName = new WeakMap<Platform, Map<string, ComponentDescriptor>>();
const byProject = new WeakMap<Project, Map<string, ComponentDescriptor>>();

/**
 * Finds the descriptor for a component type, as written in a screen
 * (`Button`, `com.example.MyExtension`) or in a block (`MyExtension`).
 * Pass the project to also resolve components of its extensions.
 */
export function lookupComponent(
  type: string,
  platform: Platform,
  project?: Project,
): ComponentDescriptor | undefined {
  return (
    platform.components.get(type) ??
    platform.components.get(`${RUNTIME_PACKAGE}.${type}`) ??
    (project && extensionIndex(project).get(type)) ??
    simpleNameIndex(platform).get(type)
  );
}

function extensionIndex(project: Project): Map<string, ComponentDescriptor> {
  let index = byProject.get(project);
  if (!index) {
    index = new Map();
    for (const extension of project.extensions) {
      for (const descriptor of extension.components) {
        index.set(descriptor.type, descriptor);
        if (!index.has(descriptor.name)) index.set(descriptor.name, descriptor);
      }
    }
    byProject.set(project, index);
  }
  return index;
}

function simpleNameIndex(platform: Platform): Map<string, ComponentDescriptor> {
  let index = bySimpleName.get(platform);
  if (!index) {
    index = new Map();
    for (const descriptor of platform.components.values()) {
      if (!index.has(descriptor.name)) index.set(descriptor.name, descriptor);
    }
    bySimpleName.set(platform, index);
  }
  return index;
}
