import { NotFoundError } from "../errors.ts";
import type { Component, Project, Screen } from "../types.ts";

/** Replaces one screen. Returns the same project if `fn` returns the same screen. */
export function updateScreen(
  project: Project,
  screenName: string,
  fn: (screen: Screen) => Screen,
): Project {
  const index = project.screens.findIndex((screen) => screen.name === screenName);
  const current = project.screens[index];
  if (!current) throw new NotFoundError("screen", screenName);
  const updated = fn(current);
  return updated === current
    ? project
    : { ...project, screens: project.screens.with(index, updated) };
}

/**
 * Replaces the named component in a tree; `fn` may return `undefined` to
 * remove it. Returns the same root if the name is not found.
 */
export function updateTree(
  root: Component,
  name: string,
  fn: (component: Component) => Component | undefined,
): Component | undefined {
  if (root.name === name) return fn(root);
  let changed = false;
  const children: Component[] = [];
  for (const child of root.children) {
    const updated = updateTree(child, name, fn);
    if (updated !== child) changed = true;
    if (updated) children.push(updated);
  }
  return changed ? { ...root, children } : root;
}

/** App Inventor encodes every designer property as a string. */
export function encodeProperty(value: string | number | boolean): string {
  if (typeof value === "boolean") return value ? "True" : "False";
  return String(value);
}

export function toBlob(data: Blob | ArrayBuffer | Uint8Array | string): Blob {
  return data instanceof Blob
    ? data
    : new Blob([data as string | ArrayBuffer | Uint8Array<ArrayBuffer>]);
}
