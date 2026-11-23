import {
  walkBlocks,
  walkComponents,
  type Asset,
  type Block,
  type Extension,
  type Problem,
  type Project,
} from "aia-kit";
import {
  findOrphanBlocks,
  findUnusedAssets,
  findUnusedExtensions,
  listDeclarations,
  summarizeBlocks,
} from "aia-kit/analysis";
import { serializeBky, serializeScm } from "aia-kit/formats";
import { simpleName } from "./format.ts";

export interface Count {
  readonly label: string;
  readonly value: number;
}

export interface ScreenRow {
  readonly name: string;
  readonly components: number;
  readonly blocks: number;
  readonly handlers: number;
  readonly procedures: number;
  readonly globals: number;
  /** Deepest nesting of blocks inside one another. */
  readonly depth: number;
  readonly problems: number;
}

export interface Insights {
  readonly totals: {
    readonly screens: number;
    readonly components: number;
    readonly blocks: number;
    readonly assets: number;
    readonly extensions: number;
    /** Uncompressed size of everything in the archive. */
    readonly bytes: number;
  };
  readonly screens: readonly ScreenRow[];
  /** Where the bytes are: assets, extensions, screen files, other files. */
  readonly size: readonly Count[];
  readonly largestAssets: readonly Asset[];
  readonly unusedAssets: readonly Asset[];
  readonly unusedExtensions: readonly Extension[];
  readonly componentTypes: readonly Count[];
  readonly blockTypes: readonly Count[];
  readonly looseBlocks: readonly { readonly screen: string; readonly block: Block }[];
  readonly disabledBlocks: number;
  readonly problemKinds: readonly (Count & { readonly severity: Problem["severity"] })[];
}

const bytesOf = (text: string) => new Blob([text]).size;

/** Largest first, then alphabetical so equal counts keep a stable order. */
function ranked(counts: ReadonlyMap<string, number>, limit: number): Count[] {
  return [...counts]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label))
    .slice(0, limit);
}

function tally<T>(items: Iterable<T>, key: (item: T) => string): Map<string, number> {
  const counts = new Map<string, number>();
  for (const item of items) counts.set(key(item), (counts.get(key(item)) ?? 0) + 1);
  return counts;
}

/** Everything the Insights page shows, derived from the project and its problems. */
export function computeInsights(project: Project, problems: readonly Problem[]): Insights {
  const components = project.screens.flatMap((screen) => Array.from(walkComponents(screen)));
  const blocks = project.screens.flatMap((screen) => Array.from(walkBlocks(screen)));

  const screens = project.screens.map((screen): ScreenRow => {
    const summary = summarizeBlocks(screen);
    const declarations = listDeclarations(screen);
    return {
      name: screen.name,
      components: Array.from(walkComponents(screen)).length,
      blocks: summary.total,
      handlers: summary.byType["component_event"] ?? 0,
      procedures: declarations.procedures.length,
      globals: declarations.globals.length,
      depth: summary.maxDepth,
      problems: problems.filter((problem) => "screen" in problem && problem.screen === screen.name)
        .length,
    };
  });

  const assetBytes = project.assets.reduce((sum, asset) => sum + asset.blob.size, 0);
  const extensionBytes = project.extensions.reduce(
    (sum, extension) => sum + extension.files.reduce((inner, file) => inner + file.blob.size, 0),
    0,
  );
  const screenBytes = project.screens.reduce(
    (sum, screen) =>
      sum +
      bytesOf(serializeScm({ form: screen.form, meta: screen.meta.form })) +
      bytesOf(serializeBky({ blocks: screen.blocks, meta: screen.meta.blocks })),
    0,
  );
  const otherBytes = project.otherFiles.reduce((sum, file) => sum + file.blob.size, 0);

  const severityOf = new Map(problems.map((problem) => [problem.code, problem.severity]));

  return {
    totals: {
      screens: project.screens.length,
      components: components.length,
      blocks: blocks.length,
      assets: project.assets.length,
      extensions: project.extensions.length,
      bytes: assetBytes + extensionBytes + screenBytes + otherBytes,
    },
    screens,
    size: [
      { label: "Assets", value: assetBytes },
      { label: "Extensions", value: extensionBytes },
      { label: "Screens", value: screenBytes },
      { label: "Other files", value: otherBytes },
    ].filter((part) => part.value > 0),
    largestAssets: project.assets.toSorted((a, b) => b.blob.size - a.blob.size).slice(0, 8),
    unusedAssets: findUnusedAssets(project),
    unusedExtensions: findUnusedExtensions(project),
    componentTypes: ranked(
      tally(components, (component) => simpleName(component.type)),
      10,
    ),
    blockTypes: ranked(
      tally(blocks, (block) => block.type),
      10,
    ),
    looseBlocks: findOrphanBlocks(project),
    disabledBlocks: blocks.filter((block) => block.disabled === true).length,
    problemKinds: ranked(
      tally(problems, (problem) => problem.code),
      20,
    ).map((count) => ({
      ...count,
      severity: severityOf.get(count.label as Problem["code"]) ?? "warning",
    })),
  };
}
