import { walkBlocks, walkComponents, type Project } from "aia-kit";
import type { Selection, Tab } from "../state.ts";
import { labelOf } from "./blocks.ts";
import { simpleName } from "./format.ts";

export type ResultKind = "screen" | "component" | "property" | "block" | "asset" | "extension";

export interface SearchEntry {
  readonly kind: ResultKind;
  /** The text that is matched first and shown as the result. */
  readonly title: string;
  /** Where it is, shown muted. Also matched, with lower rank. */
  readonly context: string;
  readonly target: Selection;
  readonly tab?: Tab;
  /** For blocks: the block to scroll to and mark. */
  readonly blockId?: string;
  /** Component type, to pick an icon. */
  readonly componentType?: string;
}

export const KIND_LABEL: Readonly<Record<ResultKind, string>> = {
  screen: "Screens",
  component: "Components",
  property: "Properties",
  block: "Blocks",
  asset: "Assets",
  extension: "Extensions",
};

const KIND_ORDER: readonly ResultKind[] = [
  "screen",
  "component",
  "asset",
  "extension",
  "property",
  "block",
];

/** Everything in a project that search can find. */
export function buildIndex(project: Project): SearchEntry[] {
  const entries: SearchEntry[] = [];

  for (const screen of project.screens) {
    const onScreen = { kind: "screen", screen: screen.name } as const;
    entries.push({ kind: "screen", title: screen.name, context: "Screen", target: onScreen });

    for (const component of walkComponents(screen)) {
      const target = { ...onScreen, component: component.name };
      const isForm = component === screen.form;
      if (!isForm) {
        entries.push({
          kind: "component",
          title: component.name,
          context: `${simpleName(component.type)} · ${screen.name}`,
          target,
          tab: "designer",
          componentType: component.type,
        });
      }
      for (const [property, value] of Object.entries(component.properties)) {
        entries.push({
          kind: "property",
          title: `${property} = ${value}`,
          context: isForm ? screen.name : `${component.name} · ${screen.name}`,
          target,
          tab: "designer",
        });
      }
    }

    for (const block of walkBlocks(screen)) {
      entries.push({
        kind: "block",
        title: labelOf(block),
        context: screen.name,
        target: onScreen,
        tab: "blocks",
        ...(block.id !== "" && { blockId: block.id }),
      });
    }
  }

  for (const asset of project.assets) {
    entries.push({
      kind: "asset",
      title: asset.name,
      context: "Asset",
      target: { kind: "asset", name: asset.name },
    });
  }
  for (const extension of project.extensions) {
    entries.push({
      kind: "extension",
      title:
        extension.components.map((component) => component.name).join(", ") || extension.packageName,
      context: extension.packageName,
      target: { kind: "extension", packageName: extension.packageName },
    });
  }
  return entries;
}

export interface SearchGroup {
  readonly kind: ResultKind;
  readonly results: readonly SearchEntry[];
  /** How many matched in total; may exceed `results.length`. */
  readonly total: number;
}

const PER_GROUP = 6;

/**
 * Case-insensitive substring search. Within a kind, titles that start with
 * the query come first, then titles that contain it, then matches in the context.
 */
export function search(index: readonly SearchEntry[], query: string): SearchGroup[] {
  const needle = query.trim().toLowerCase();
  if (needle === "") return [];

  const ranked = new Map<ResultKind, { entry: SearchEntry; rank: number }[]>();
  for (const entry of index) {
    const title = entry.title.toLowerCase();
    const at = title.indexOf(needle);
    const rank = at === 0 ? 0 : at > 0 ? 1 : entry.context.toLowerCase().includes(needle) ? 2 : -1;
    if (rank === -1) continue;
    const list = ranked.get(entry.kind) ?? [];
    list.push({ entry, rank });
    ranked.set(entry.kind, list);
  }

  return KIND_ORDER.flatMap((kind) => {
    const matches = ranked.get(kind);
    if (!matches) return [];
    matches.sort((a, b) => a.rank - b.rank || a.entry.title.length - b.entry.title.length);
    return [
      { kind, results: matches.slice(0, PER_GROUP).map((m) => m.entry), total: matches.length },
    ];
  });
}

/** Splits `text` around the first occurrence of `query`, for emphasis. */
export function splitMatch(
  text: string,
  query: string,
): readonly [before: string, match: string, after: string] {
  const needle = query.trim();
  const at = needle === "" ? -1 : text.toLowerCase().indexOf(needle.toLowerCase());
  if (at === -1) return [text, "", ""];
  return [text.slice(0, at), text.slice(at, at + needle.length), text.slice(at + needle.length)];
}
