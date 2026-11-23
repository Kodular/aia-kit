import { NotFoundError } from "./errors.ts";
import { projectPackage, simpleName } from "./internal/names.ts";
import type { Block, Component, Project, Screen } from "./types.ts";

/** The screen with this name, or `undefined`. */
export function findScreen(project: Project, name: string): Screen | undefined {
  return project.screens.find((screen) => screen.name === name);
}

/**
 * The screen with this name.
 * @throws {NotFoundError} if there is none.
 */
export function getScreen(project: Project, name: string): Screen {
  const screen = findScreen(project, name);
  if (!screen) throw new NotFoundError("screen", name);
  return screen;
}

/** The component with this name on a screen (or below a component), or `undefined`. */
export function findComponent(root: Screen | Component, name: string): Component | undefined {
  for (const component of walkComponents(root)) {
    if (component.name === name) return component;
  }
  return undefined;
}

/** The component that directly contains the named one; `undefined` for the form or an unknown name. */
export function findParent(root: Screen | Component, name: string): Component | undefined {
  for (const component of walkComponents(root)) {
    if (component.children.some((child) => child.name === name)) return component;
  }
  return undefined;
}

/** Every component of a screen (or subtree), parents before children. */
export function* walkComponents(root: Screen | Component): Generator<Component, void, undefined> {
  const component = "form" in root ? root.form : root;
  yield component;
  for (const child of component.children) yield* walkComponents(child);
}

/** Every block of a screen, a list of blocks, or one block's subtree — including nested and following blocks. */
export function* walkBlocks(
  root: Screen | readonly Block[] | Block,
): Generator<Block, void, undefined> {
  if ("form" in root) return yield* walkBlocks(root.blocks);
  if (isBlockList(root)) {
    for (const block of root) yield* walkBlocks(block);
    return;
  }
  yield root;
  for (const inner of Object.values(root.values)) yield* walkBlocks(inner);
  for (const inner of Object.values(root.statements)) yield* walkBlocks(inner);
  if (root.next) yield* walkBlocks(root.next);
}

function isBlockList(value: readonly Block[] | Block): value is readonly Block[] {
  return Array.isArray(value);
}

/** What a component block (event handler, method call, property getter/setter, component value) refers to. */
export interface ComponentReference {
  readonly kind: "event" | "method" | "property" | "component";
  /** Simple component type name, e.g. `Button`. */
  readonly componentType: string;
  /** Component name; absent for generic ("any Button") blocks. */
  readonly instance?: string;
  /** Event, method or property name. */
  readonly member?: string;
  /** For `property` blocks. */
  readonly access?: "get" | "set";
}

const REFERENCE_KINDS: Readonly<Record<string, ComponentReference["kind"]>> = {
  component_event: "event",
  component_method: "method",
  component_set_get: "property",
  component_component_block: "component",
};

/** Decodes a component block; `undefined` for every other block. */
export function componentReference(block: Block): ComponentReference | undefined {
  const kind = REFERENCE_KINDS[block.type];
  if (!kind) return undefined;
  const m = block.mutation;
  const instance = m["is_generic"] === "true" ? undefined : m["instance_name"];
  const member = m["event_name"] ?? m["method_name"] ?? m["property_name"];
  const access = m["set_or_get"];
  return {
    kind,
    componentType: m["component_type"] ?? "",
    ...(instance !== undefined && { instance }),
    ...(member !== undefined && { member }),
    ...((access === "get" || access === "set") && { access }),
  };
}

/** Name of the screen the app starts on. */
export function mainScreenName(project: Project): string {
  return simpleName(project.properties.main);
}

/** Java package of the project, e.g. `appinventor.ai_user.MyApp`. */
export function packageName(project: Project): string {
  return projectPackage(project.properties);
}
