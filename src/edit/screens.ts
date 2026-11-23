import { ConflictError, InvalidOperationError } from "../errors.ts";
import { packageOf } from "../internal/names.ts";
import { findScreen, getScreen, mainScreenName } from "../query.ts";
import type { Project, Screen } from "../types.ts";
import { mapBlocks, renameReferences } from "./blocks.ts";

/**
 * Adds a screen. Pass a name to create an empty screen that inherits its
 * format versions from the main screen, or a `Screen` value (for example one
 * taken from another project).
 * @throws {ConflictError} if a screen with that name exists.
 * @throws {InvalidOperationError} if the name is not a valid screen name.
 */
export function addScreen(project: Project, screen: string | Screen): Project {
  const added = typeof screen === "string" ? emptyScreen(project, screen) : screen;
  assertScreenName(added.name);
  if (added.form.name !== added.name) {
    throw new InvalidOperationError(
      `Screen "${added.name}" has a form named "${added.form.name}"; they must match`,
    );
  }
  if (findScreen(project, added.name)) throw new ConflictError("screen", added.name);
  return { ...project, screens: [...project.screens, added] };
}

/**
 * Removes a screen.
 * @throws {NotFoundError} if the screen does not exist.
 * @throws {InvalidOperationError} when asked to remove the main screen.
 */
export function removeScreen(project: Project, name: string): Project {
  getScreen(project, name);
  if (name === mainScreenName(project)) {
    throw new InvalidOperationError(`"${name}" is the main screen and cannot be removed`);
  }
  return { ...project, screens: project.screens.filter((screen) => screen.name !== name) };
}

/**
 * Renames a screen everywhere: its form, the blocks that refer to the form,
 * `properties.main`, and blocks in any screen that open it by name.
 * @throws {NotFoundError} if the screen does not exist.
 * @throws {ConflictError} if the new name is taken.
 */
export function renameScreen(project: Project, from: string, to: string): Project {
  const screen = getScreen(project, from);
  if (from === to) return project;
  assertScreenName(to);
  if (findScreen(project, to)) throw new ConflictError("screen", to);

  const renamed = withName(screen, to);
  const screens = project.screens.map((other) => {
    const current = other === screen ? renamed : other;
    const blocks = retargetNavigation(current.blocks, from, to);
    return blocks === current.blocks ? current : { ...current, blocks };
  });

  const { properties } = project;
  const isMain = mainScreenName(project) === from;
  return {
    ...project,
    screens,
    ...(isMain && {
      properties: {
        ...properties,
        main: [packageOf(properties.main), to].filter(Boolean).join("."),
      },
    }),
  };
}

/**
 * Duplicates a screen under a new name.
 * @throws {NotFoundError} if the screen does not exist.
 * @throws {ConflictError} if the new name is taken.
 */
export function copyScreen(project: Project, from: string, to: string): Project {
  return addScreen(project, withName(getScreen(project, from), to));
}

/** The same screen under another name, with its form and form blocks renamed to match. */
export function withName(screen: Screen, name: string): Screen {
  return {
    ...screen,
    name,
    form: { ...screen.form, name },
    blocks: renameReferences(screen.blocks, screen.name, name),
  };
}

function emptyScreen(project: Project, name: string): Screen {
  const main = findScreen(project, mainScreenName(project)) ?? project.screens[0];
  return {
    name,
    form: {
      name,
      type: "Form",
      ...(main?.form.version !== undefined && { version: main.form.version }),
      uuid: "0",
      properties: { Title: name },
      children: [],
    },
    blocks: [],
    meta: main?.meta ?? { form: { authURL: [], YaVersion: "0", Source: "Form" }, blocks: {} },
  };
}

function assertScreenName(name: string): void {
  if (!/^[A-Za-z][A-Za-z0-9_]*$/.test(name)) {
    throw new InvalidOperationError(
      `"${name}" is not a valid screen name: use letters, digits and underscores, starting with a letter`,
    );
  }
}

const OPEN_SCREEN_BLOCKS = new Set([
  "controls_openAnotherScreen",
  "controls_openAnotherScreenWithStartValue",
]);

/** Updates blocks that name a screen: the screen-name dropdown, and literal text plugged into "open another screen". */
function retargetNavigation(blocks: Screen["blocks"], from: string, to: string): Screen["blocks"] {
  return mapBlocks(blocks, (block) => {
    if (block.type === "helpers_screen_names" && block.fields["SCREEN"] === from) {
      return { ...block, fields: { ...block.fields, SCREEN: to } };
    }
    if (!OPEN_SCREEN_BLOCKS.has(block.type)) return block;
    const [input, target] =
      Object.entries(block.values).find(([name]) => name.startsWith("SCREEN")) ?? [];
    if (input === undefined || target?.type !== "text" || target.fields["TEXT"] !== from) {
      return block;
    }
    return {
      ...block,
      values: { ...block.values, [input]: { ...target, fields: { ...target.fields, TEXT: to } } },
    };
  });
}
