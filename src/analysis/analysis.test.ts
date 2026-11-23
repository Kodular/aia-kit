import { describe, expect, it } from "vitest";
import { readAia } from "../archive/read.ts";
import { writeAia } from "../archive/write.ts";
import { addAsset, removeAsset } from "../edit/assets.ts";
import { removeComponent, setProperty } from "../edit/components.ts";
import { addExtension } from "../edit/extensions.ts";
import { setProjectProperties } from "../edit/properties.ts";
import { addScreen, removeScreen } from "../edit/screens.ts";
import { demoProject, extension, fixture } from "../test-helpers.ts";
import {
  diffProjects,
  findAssetReferences,
  findOrphanBlocks,
  findUnusedAssets,
  findUnusedExtensions,
  listDeclarations,
  navigationGraph,
  summarizeBlocks,
} from "./index.ts";

describe("diffProjects", () => {
  it("reports no changes for the same content, even when re-read", async () => {
    const project = demoProject();
    const { project: again } = await readAia(await writeAia(project));
    const empty = { added: [], removed: [], changed: [] };
    expect(await diffProjects(project, again)).toEqual({
      screens: empty,
      assets: empty,
      extensions: empty,
      propertiesChanged: false,
    });
  });

  it("reports added, removed and changed parts", async () => {
    const before = demoProject();
    let after = setProperty(before, "Screen1", "Button1", "Text", "Stop");
    after = addScreen(removeScreen(after, "Screen2"), "Settings");
    after = addAsset(removeAsset(after, "unused.mp3"), "logo.png", new Uint8Array([9, 8, 6]), {
      replace: true,
    });
    after = addExtension(addAsset(after, "new.txt", ""), extension("com.other", "Other"));
    after = setProjectProperties(after, { versionCode: 4 });

    expect(await diffProjects(before, after)).toEqual({
      screens: { added: ["Settings"], removed: ["Screen2"], changed: ["Screen1"] },
      assets: { added: ["new.txt"], removed: ["unused.mp3"], changed: ["logo.png"] },
      extensions: { added: ["com.other"], removed: [], changed: [] },
      propertiesChanged: true,
    });
  });
});

describe("asset and extension usage", () => {
  it("finds references from the icon, properties and text blocks", () => {
    expect(findAssetReferences(demoProject())).toEqual([
      { asset: "logo.png", kind: "icon" },
      {
        asset: "logo.png",
        kind: "property",
        screen: "Screen1",
        component: "Button1",
        property: "Image",
      },
      { asset: "logo.png", kind: "block", screen: "Screen1", blockId: "t1" },
    ]);
  });

  it("lists unused assets and extensions", () => {
    const project = demoProject();
    expect(findUnusedAssets(project).map((a) => a.name)).toEqual(["unused.mp3"]);
    expect(findUnusedExtensions(project)).toEqual([]);
    expect(
      findUnusedExtensions(removeComponent(project, "Screen1", "Ext1")).map((e) => e.packageName),
    ).toEqual(["com.example.ext"]);
  });
});

describe("block reports", () => {
  it("summarizeBlocks counts blocks and nesting", () => {
    const [screen1, screen2] = demoProject().screens;
    expect(summarizeBlocks(screen1!)).toEqual({
      topLevel: 4,
      total: 10,
      maxDepth: 3,
      byType: {
        global_declaration: 1,
        math_number: 2,
        component_event: 1,
        component_set_get: 1,
        text: 2,
        component_method: 1,
        controls_openAnotherScreen: 1,
        procedures_defnoreturn: 1,
      },
    });
    expect(summarizeBlocks(screen2!.blocks)).toEqual({
      topLevel: 0,
      total: 0,
      maxDepth: 0,
      byType: {},
    });
  });

  it("listDeclarations names globals and procedures", () => {
    expect(listDeclarations(demoProject().screens[0]!)).toEqual({
      globals: ["count"],
      procedures: ["doIt"],
    });
  });

  it("findOrphanBlocks returns loose top-level blocks", () => {
    const orphans = findOrphanBlocks(demoProject());
    expect(orphans.map((o) => [o.screen, o.block.id])).toEqual([["Screen1", "orphan"]]);
  });

  it("navigationGraph follows literal screen names", async () => {
    expect(navigationGraph(demoProject())).toEqual({
      screens: ["Screen1", "Screen2"],
      edges: [{ from: "Screen1", to: "Screen2" }],
    });
    const { project } = await readAia(await fixture("MoodRing.aia"));
    expect(navigationGraph(project).edges).toEqual([{ from: "LogScreen", to: "Screen1" }]);
  });
});
