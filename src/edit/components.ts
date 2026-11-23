import { ConflictError, InvalidOperationError, NotFoundError } from "../errors.ts";
import { findComponent, walkComponents } from "../query.ts";
import type { Component, Project, Screen } from "../types.ts";
import { mapBlocks, refersTo, renameReferences } from "./blocks.ts";
import { encodeProperty, updateScreen, updateTree } from "./internal.ts";

export type PropertyValue = string | number | boolean;

export interface CreateComponentOptions {
  /** Initial designer properties. Numbers and booleans are encoded the way App Inventor stores them. */
  readonly properties?: Readonly<Record<string, PropertyValue>>;
  /** Component version to record; see `lookupComponent(type, platform).version`. */
  readonly version?: string | number;
  readonly children?: readonly Component[];
}

/**
 * Creates a component value to pass to `addComponent`.
 * @param type Simple name for built-ins (`Button`), fully qualified for extension components.
 */
export function createComponent(
  type: string,
  name: string,
  options: CreateComponentOptions = {},
): Component {
  const properties: Record<string, string> = {};
  for (const [key, value] of Object.entries(options.properties ?? {})) {
    properties[key] = encodeProperty(value);
  }
  return {
    name,
    type,
    ...(options.version !== undefined && { version: String(options.version) }),
    uuid: String(crypto.getRandomValues(new Int32Array(1))[0]),
    properties,
    children: options.children ?? [],
  };
}

export interface Placement {
  /** Name of the container to put the component in. Defaults to the screen's form. */
  readonly parent?: string;
  /** Position among the parent's children. Defaults to the end. */
  readonly index?: number;
}

/**
 * Adds a component (and its children) to a screen.
 * @throws {NotFoundError} if the screen or parent does not exist.
 * @throws {ConflictError} if a component name is already used on the screen.
 */
export function addComponent(
  project: Project,
  screenName: string,
  component: Component,
  placement: Placement = {},
): Project {
  return updateScreen(project, screenName, (screen) => {
    const taken = new Set(Array.from(walkComponents(screen), (c) => c.name));
    for (const added of walkComponents(component)) {
      if (taken.has(added.name)) throw new ConflictError("component", added.name, screenName);
      taken.add(added.name);
    }
    return { ...screen, form: insert(screen, component, placement) };
  });
}

/**
 * Removes a component, its children, and every block that refers to them.
 * @throws {NotFoundError} if the screen or component does not exist.
 * @throws {InvalidOperationError} when asked to remove the form.
 */
export function removeComponent(project: Project, screenName: string, name: string): Project {
  return updateScreen(project, screenName, (screen) => {
    const target = requireComponent(screen, name);
    if (target === screen.form) {
      throw new InvalidOperationError(`"${name}" is the form of ${screenName}; use removeScreen`);
    }
    const removed = new Set(Array.from(walkComponents(target), (c) => c.name));
    return {
      ...screen,
      form: updateTree(screen.form, name, () => undefined) ?? screen.form,
      blocks: mapBlocks(screen.blocks, (block) => (refersTo(block, removed) ? null : block)),
    };
  });
}

/**
 * Renames a component and updates every block that refers to it.
 * @throws {NotFoundError} if the screen or component does not exist.
 * @throws {ConflictError} if the new name is already used on the screen.
 * @throws {InvalidOperationError} when asked to rename the form.
 */
export function renameComponent(
  project: Project,
  screenName: string,
  from: string,
  to: string,
): Project {
  return updateScreen(project, screenName, (screen) => {
    const target = requireComponent(screen, from);
    if (target === screen.form) {
      throw new InvalidOperationError(`"${from}" is the form of ${screenName}; use renameScreen`);
    }
    if (from === to) return screen;
    if (to === "") throw new InvalidOperationError("A component name cannot be empty");
    if (findComponent(screen, to)) throw new ConflictError("component", to, screenName);
    return {
      ...screen,
      form: updateTree(screen.form, from, (c) => ({ ...c, name: to })) ?? screen.form,
      blocks: renameReferences(screen.blocks, from, to),
    };
  });
}

/**
 * Moves a component to another container or position on the same screen.
 * @throws {NotFoundError} if the screen, component or parent does not exist.
 * @throws {InvalidOperationError} when moving the form, or a component into itself.
 */
export function moveComponent(
  project: Project,
  screenName: string,
  name: string,
  placement: Placement,
): Project {
  return updateScreen(project, screenName, (screen) => {
    const target = requireComponent(screen, name);
    if (target === screen.form) throw new InvalidOperationError("The form cannot be moved");
    const parent = placement.parent ?? screen.form.name;
    if (findComponent(target, parent)) {
      throw new InvalidOperationError(`Cannot move "${name}" into itself`);
    }
    const without = updateTree(screen.form, name, () => undefined) ?? screen.form;
    return { ...screen, form: insert({ ...screen, form: without }, target, placement) };
  });
}

/**
 * Sets one designer property.
 * @throws {NotFoundError} if the screen or component does not exist.
 */
export function setProperty(
  project: Project,
  screenName: string,
  componentName: string,
  property: string,
  value: PropertyValue,
): Project {
  const encoded = encodeProperty(value);
  return updateComponent(project, screenName, componentName, (component) =>
    component.properties[property] === encoded
      ? component
      : { ...component, properties: { ...component.properties, [property]: encoded } },
  );
}

/**
 * Removes one designer property, so the component falls back to its default.
 * @throws {NotFoundError} if the screen or component does not exist.
 */
export function removeProperty(
  project: Project,
  screenName: string,
  componentName: string,
  property: string,
): Project {
  return updateComponent(project, screenName, componentName, (component) => {
    if (!(property in component.properties)) return component;
    const { [property]: _, ...properties } = component.properties;
    return { ...component, properties };
  });
}

/**
 * Replaces a component with the result of `fn`. An escape hatch for edits the
 * other functions do not cover; it cannot rename (use `renameComponent`).
 * @throws {NotFoundError} if the screen or component does not exist.
 * @throws {InvalidOperationError} if `fn` changes the component's name.
 */
export function updateComponent(
  project: Project,
  screenName: string,
  componentName: string,
  fn: (component: Component) => Component,
): Project {
  return updateScreen(project, screenName, (screen) => {
    requireComponent(screen, componentName);
    const form = updateTree(screen.form, componentName, (component) => {
      const updated = fn(component);
      if (updated.name !== componentName) {
        throw new InvalidOperationError("updateComponent cannot rename; use renameComponent");
      }
      return updated;
    });
    return !form || form === screen.form ? screen : { ...screen, form };
  });
}

function requireComponent(screen: Screen, name: string): Component {
  const component = findComponent(screen, name);
  if (!component) throw new NotFoundError("component", name, screen.name);
  return component;
}

function insert(screen: Screen, component: Component, placement: Placement): Component {
  const parentName = placement.parent ?? screen.form.name;
  requireComponent(screen, parentName);
  const form = updateTree(screen.form, parentName, (parent) => ({
    ...parent,
    children: parent.children.toSpliced(placement.index ?? parent.children.length, 0, component),
  }));
  return form ?? screen.form;
}
