import { ConflictError, InvalidOperationError, NotFoundError } from "../errors.ts";
import { walkComponents } from "../query.ts";
import type { Extension, Project } from "../types.ts";
import type { AddOptions } from "./assets.ts";

/**
 * Adds an extension (see `readAix`).
 * @throws {ConflictError} if the extension is present and `replace` is not set.
 */
export function addExtension(
  project: Project,
  extension: Extension,
  options: AddOptions = {},
): Project {
  const exists = project.extensions.some((e) => e.packageName === extension.packageName);
  if (exists && !options.replace) throw new ConflictError("extension", extension.packageName);
  return {
    ...project,
    extensions: exists
      ? project.extensions.map((e) => (e.packageName === extension.packageName ? extension : e))
      : [...project.extensions, extension],
  };
}

/**
 * Removes an extension.
 * @throws {NotFoundError} if the extension does not exist.
 * @throws {InvalidOperationError} if a screen still uses one of its components; remove those first.
 */
export function removeExtension(project: Project, packageName: string): Project {
  const extension = project.extensions.find((e) => e.packageName === packageName);
  if (!extension) throw new NotFoundError("extension", packageName);

  const users = componentsUsing(project, extension);
  if (users.length > 0) {
    throw new InvalidOperationError(
      `Extension "${packageName}" is still used by ${users.slice(0, 3).join(", ")}${users.length > 3 ? ", …" : ""}`,
    );
  }
  return { ...project, extensions: project.extensions.filter((e) => e !== extension) };
}

/** `Screen.Component` for every component whose type the extension provides. */
export function componentsUsing(project: Project, extension: Extension): string[] {
  const types = new Set(extension.components.map((descriptor) => descriptor.type));
  return project.screens.flatMap((screen) =>
    Array.from(walkComponents(screen))
      .filter((component) => types.has(component.type))
      .map((component) => `${screen.name}.${component.name}`),
  );
}
