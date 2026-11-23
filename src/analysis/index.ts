/**
 * Read-only reports about a project.
 * @module
 */
import { componentsUsing } from "../edit/extensions.ts";
import { serializeBky } from "../formats/bky.ts";
import { serializeScm } from "../formats/scm.ts";
import { walkBlocks, walkComponents } from "../query.ts";
import type { Asset, Block, Extension, Project, Screen } from "../types.ts";

export interface Changes {
  readonly added: readonly string[];
  readonly removed: readonly string[];
  readonly changed: readonly string[];
}

export interface ProjectDiff {
  readonly screens: Changes;
  readonly assets: Changes;
  readonly extensions: Changes;
  readonly propertiesChanged: boolean;
}

/** Compares two versions of a project by content. */
export async function diffProjects(before: Project, after: Project): Promise<ProjectDiff> {
  const screenText = (screen: Screen) =>
    serializeScm({ form: screen.form, meta: screen.meta.form }) +
    serializeBky({ blocks: screen.blocks, meta: screen.meta.blocks });
  const sameScreen = (a: Screen, b: Screen) =>
    (a.form === b.form && a.blocks === b.blocks) || screenText(a) === screenText(b);
  const sameExtension = async (a: Extension, b: Extension) => {
    if (a.files.length !== b.files.length) return false;
    const other = new Map(b.files.map((file) => [file.path, file.blob]));
    for (const file of a.files) {
      const blob = other.get(file.path);
      if (!blob || !(await sameBlob(file.blob, blob))) return false;
    }
    return true;
  };

  return {
    screens: await diff(before.screens, after.screens, (s) => s.name, sameScreen),
    assets: await diff(
      before.assets,
      after.assets,
      (a) => a.name,
      (a, b) => sameBlob(a.blob, b.blob),
    ),
    extensions: await diff(
      before.extensions,
      after.extensions,
      (e) => e.packageName,
      sameExtension,
    ),
    propertiesChanged:
      before.properties !== after.properties &&
      JSON.stringify(sortKeys(before.properties)) !== JSON.stringify(sortKeys(after.properties)),
  };
}

async function diff<T>(
  before: readonly T[],
  after: readonly T[],
  key: (item: T) => string,
  same: (a: T, b: T) => boolean | Promise<boolean>,
): Promise<Changes> {
  const old = new Map(before.map((item) => [key(item), item]));
  const added: string[] = [];
  const changed: string[] = [];
  for (const item of after) {
    const previous = old.get(key(item));
    old.delete(key(item));
    if (previous === undefined) added.push(key(item));
    else if (previous !== item && !(await same(previous, item))) changed.push(key(item));
  }
  return { added, removed: [...old.keys()], changed };
}

async function sameBlob(a: Blob, b: Blob): Promise<boolean> {
  if (a === b) return true;
  if (a.size !== b.size) return false;
  const [x, y] = await Promise.all([a.bytes(), b.bytes()]);
  return x.every((byte, i) => byte === y[i]);
}

function sortKeys(value: object): unknown {
  return Object.fromEntries(
    Object.entries(value)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => [k, typeof v === "object" && v !== null ? sortKeys(v as object) : v]),
  );
}

/** Where an asset is used. */
export type AssetReference =
  | { readonly asset: string; readonly kind: "icon" }
  | {
      readonly asset: string;
      readonly kind: "property";
      readonly screen: string;
      readonly component: string;
      readonly property: string;
    }
  | {
      readonly asset: string;
      readonly kind: "block";
      readonly screen: string;
      readonly blockId: string;
    };

/**
 * Finds uses of the project's assets: the app icon, component properties whose
 * value is an asset name, and text blocks whose text is an asset name.
 */
export function findAssetReferences(project: Project): AssetReference[] {
  const names = new Set(project.assets.map((asset) => asset.name));
  const references: AssetReference[] = [];

  const { icon } = project.properties;
  if (icon !== undefined && names.has(icon)) references.push({ asset: icon, kind: "icon" });

  for (const screen of project.screens) {
    for (const component of walkComponents(screen)) {
      for (const [property, value] of Object.entries(component.properties)) {
        if (!names.has(value)) continue;
        references.push({
          asset: value,
          kind: "property",
          screen: screen.name,
          component: component.name,
          property,
        });
      }
    }
    for (const block of walkBlocks(screen)) {
      const text = block.type === "text" ? block.fields["TEXT"] : undefined;
      if (text === undefined || !names.has(text)) continue;
      references.push({ asset: text, kind: "block", screen: screen.name, blockId: block.id });
    }
  }
  return references;
}

/** Assets nothing refers to. Names built at runtime (e.g. by joining text) cannot be detected. */
export function findUnusedAssets(project: Project): Asset[] {
  const used = new Set(findAssetReferences(project).map((reference) => reference.asset));
  return project.assets.filter((asset) => !used.has(asset.name));
}

/** Extensions none of whose components are placed on a screen. */
export function findUnusedExtensions(project: Project): Extension[] {
  return project.extensions.filter((extension) => componentsUsing(project, extension).length === 0);
}

export interface BlockSummary {
  /** Number of top-level blocks. */
  readonly topLevel: number;
  readonly total: number;
  readonly byType: Readonly<Record<string, number>>;
  /** Deepest nesting of inputs; a stack of blocks does not add depth. */
  readonly maxDepth: number;
}

/** Counts the blocks of a screen or block list. */
export function summarizeBlocks(root: Screen | readonly Block[]): BlockSummary {
  const blocks = "form" in root ? root.blocks : root;
  const byType: Record<string, number> = {};
  let total = 0;
  for (const block of walkBlocks(blocks)) {
    total += 1;
    byType[block.type] = (byType[block.type] ?? 0) + 1;
  }
  return { topLevel: blocks.length, total, byType, maxDepth: Math.max(0, ...blocks.map(depth)) };
}

function depth(block: Block): number {
  const inner = [...Object.values(block.values), ...Object.values(block.statements)];
  const here = 1 + Math.max(0, ...inner.map(depth));
  return block.next ? Math.max(here, depth(block.next)) : here;
}

export interface Declarations {
  readonly globals: readonly string[];
  readonly procedures: readonly string[];
}

/** Global variables and procedures defined on a screen. */
export function listDeclarations(root: Screen | readonly Block[]): Declarations {
  const blocks = "form" in root ? root.blocks : root;
  const named = (types: readonly string[]) =>
    blocks.filter((block) => types.includes(block.type)).map((block) => block.fields["NAME"] ?? "");
  return {
    globals: named(["global_declaration"]),
    procedures: named(["procedures_defnoreturn", "procedures_defreturn"]),
  };
}

const ENTRY_POINTS = new Set([
  "component_event",
  "global_declaration",
  "procedures_defnoreturn",
  "procedures_defreturn",
]);

export interface OrphanBlock {
  readonly screen: string;
  readonly block: Block;
}

/** Top-level blocks that never run: loose blocks that are not an event handler, procedure or global. */
export function findOrphanBlocks(project: Project): OrphanBlock[] {
  return project.screens.flatMap((screen) =>
    screen.blocks
      .filter((block) => !ENTRY_POINTS.has(block.type))
      .map((block) => ({ screen: screen.name, block })),
  );
}

export interface NavigationGraph {
  readonly screens: readonly string[];
  readonly edges: readonly { readonly from: string; readonly to: string }[];
}

/** Which screens open which, from "open another screen" blocks whose target is a literal name. */
export function navigationGraph(project: Project): NavigationGraph {
  const edges = new Map<string, { from: string; to: string }>();
  for (const screen of project.screens) {
    for (const block of walkBlocks(screen)) {
      if (!block.type.startsWith("controls_openAnotherScreen")) continue;
      const target = Object.entries(block.values).find(([name]) => name.startsWith("SCREEN"))?.[1];
      const to = target?.fields["TEXT"] ?? target?.fields["SCREEN"];
      if (to !== undefined) edges.set(`${screen.name}\0${to}`, { from: screen.name, to });
    }
  }
  return { screens: project.screens.map((screen) => screen.name), edges: [...edges.values()] };
}
