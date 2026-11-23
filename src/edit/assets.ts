import { ConflictError, NotFoundError } from "../errors.ts";
import { walkComponents } from "../query.ts";
import type { Project } from "../types.ts";
import { toBlob, updateTree } from "./internal.ts";

export interface AddOptions {
  /** Replace an existing entry with the same name instead of throwing. */
  readonly replace?: boolean;
}

/**
 * Adds an asset.
 * @throws {ConflictError} if the name is taken and `replace` is not set.
 */
export function addAsset(
  project: Project,
  name: string,
  data: Blob | ArrayBuffer | Uint8Array | string,
  options: AddOptions = {},
): Project {
  const exists = project.assets.some((asset) => asset.name === name);
  if (exists && !options.replace) throw new ConflictError("asset", name);
  const asset = { name, blob: toBlob(data) };
  return {
    ...project,
    assets: exists
      ? project.assets.map((other) => (other.name === name ? asset : other))
      : [...project.assets, asset],
  };
}

/**
 * Removes an asset. Component properties that still name it are left alone;
 * `check` reports them.
 * @throws {NotFoundError} if the asset does not exist.
 */
export function removeAsset(project: Project, name: string): Project {
  if (!project.assets.some((asset) => asset.name === name)) throw new NotFoundError("asset", name);
  return { ...project, assets: project.assets.filter((asset) => asset.name !== name) };
}

/**
 * Renames an asset and every component property (and the app icon) that names it.
 * Text blocks containing the old name are not changed.
 * @throws {NotFoundError} if the asset does not exist.
 * @throws {ConflictError} if the new name is taken.
 */
export function renameAsset(project: Project, from: string, to: string): Project {
  if (!project.assets.some((asset) => asset.name === from)) throw new NotFoundError("asset", from);
  if (from === to) return project;
  if (project.assets.some((asset) => asset.name === to)) throw new ConflictError("asset", to);

  const screens = project.screens.map((screen) => {
    let form = screen.form;
    for (const component of walkComponents(screen)) {
      const hits = Object.entries(component.properties).filter(([, value]) => value === from);
      if (hits.length === 0) continue;
      const renamed = Object.fromEntries(hits.map(([key]) => [key, to]));
      form =
        updateTree(form, component.name, (c) => ({
          ...c,
          properties: { ...c.properties, ...renamed },
        })) ?? form;
    }
    return form === screen.form ? screen : { ...screen, form };
  });

  return {
    ...project,
    screens,
    assets: project.assets.map((asset) => (asset.name === from ? { ...asset, name: to } : asset)),
    ...(project.properties.icon === from && { properties: { ...project.properties, icon: to } }),
  };
}
