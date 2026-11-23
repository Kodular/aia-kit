import { describe, expect, it } from "vitest";
import { readAia } from "../archive/read.ts";
import { writeAia } from "../archive/write.ts";
import { check } from "../check.ts";
import { ConflictError, InvalidOperationError, NotFoundError } from "../errors.ts";
import { componentReference, findComponent, findParent, getScreen, walkBlocks } from "../query.ts";
import { EMPTY_SCM, demoProject, extension, screen } from "../test-helpers.ts";
import type { Project } from "../types.ts";
import { addAsset, removeAsset, renameAsset } from "./assets.ts";
import { mapBlocks, updateBlocks } from "./blocks.ts";
import {
  addComponent,
  createComponent,
  moveComponent,
  removeComponent,
  removeProperty,
  renameComponent,
  setProperty,
  updateComponent,
} from "./components.ts";
import { addExtension, removeExtension } from "./extensions.ts";
import { mergeProjects } from "./merge.ts";
import { setProjectProperties } from "./properties.ts";
import { addScreen, copyScreen, removeScreen, renameScreen } from "./screens.ts";

const blockTypes = (project: Project, name = "Screen1") =>
  Array.from(walkBlocks(getScreen(project, name)), (block) => block.type);
const instances = (project: Project, name = "Screen1") =>
  Array.from(
    walkBlocks(getScreen(project, name)),
    (block) => componentReference(block)?.instance,
  ).filter((instance) => instance !== undefined);

/** Edits must survive a write/read cycle. */
async function reread(project: Project): Promise<Project> {
  const { project: again, problems } = await readAia(await writeAia(project));
  expect(problems).toEqual([]);
  return again;
}

describe("immutability", () => {
  it("never changes the input project and shares what it did not touch", () => {
    const before = demoProject();
    const snapshot = structuredClone({ ...before, assets: [], extensions: [] });
    const after = setProperty(before, "Screen1", "Button1", "Text", "Stop");

    expect({ ...before, assets: [], extensions: [] }).toEqual(snapshot);
    expect(after).not.toBe(before);
    expect(after.screens[1]).toBe(before.screens[1]);
    expect(after.screens[0]?.blocks).toBe(before.screens[0]?.blocks);
    expect(after.assets).toBe(before.assets);
  });

  it("returns the same project when an edit changes nothing", () => {
    const project = demoProject();
    expect(setProperty(project, "Screen1", "Button1", "Text", "Go")).toBe(project);
    expect(removeProperty(project, "Screen1", "Button1", "Nope")).toBe(project);
    expect(renameComponent(project, "Screen1", "Button1", "Button1")).toBe(project);
    expect(updateBlocks(project, "Screen1", (blocks) => blocks)).toBe(project);
  });
});

describe("components", () => {
  it("setProperty encodes values the way App Inventor stores them", () => {
    let project = setProperty(demoProject(), "Screen1", "Button1", "FontSize", 18.5);
    project = setProperty(project, "Screen1", "Button1", "Enabled", false);
    project = setProperty(project, "Screen1", "Screen1", "Title", "Home");
    expect(findComponent(getScreen(project, "Screen1"), "Button1")?.properties).toEqual({
      Image: "logo.png",
      Text: "Go",
      FontSize: "18.5",
      Enabled: "False",
    });
    expect(getScreen(project, "Screen1").form.properties["Title"]).toBe("Home");
  });

  it("removeProperty drops the property", () => {
    const project = removeProperty(demoProject(), "Screen1", "Button1", "Image");
    expect(findComponent(getScreen(project, "Screen1"), "Button1")?.properties).toEqual({
      Text: "Go",
    });
  });

  it("renameComponent updates every block that refers to the component", async () => {
    const project = await reread(renameComponent(demoProject(), "Screen1", "Label1", "Status"));
    const screen1 = getScreen(project, "Screen1");
    expect(findComponent(screen1, "Label1")).toBeUndefined();
    expect(findComponent(screen1, "Status")?.uuid).toBe("102");
    expect(instances(project)).toEqual(["Button1", "Status", "Ext1"]);
    const setter = Array.from(walkBlocks(screen1)).find((b) => b.id === "s1");
    expect(setter?.fields["COMPONENT_SELECTOR"]).toBe("Status");
    expect(check(project)).toEqual([]);
  });

  it("renameComponent rejects conflicts, unknown names and the form", () => {
    const project = demoProject();
    expect(() => renameComponent(project, "Screen1", "Label1", "Button1")).toThrow(ConflictError);
    expect(() => renameComponent(project, "Screen1", "Nope", "X")).toThrow(NotFoundError);
    expect(() => renameComponent(project, "Screen1", "Screen1", "Home")).toThrow(
      InvalidOperationError,
    );
    expect(() => renameComponent(project, "Nope", "Label1", "X")).toThrow(NotFoundError);
  });

  it("removeComponent removes the subtree and its blocks, reconnecting stacks", async () => {
    const project = await reread(removeComponent(demoProject(), "Screen1", "Label1"));
    expect(findComponent(getScreen(project, "Screen1"), "Label1")).toBeUndefined();
    // The setter (and the text block plugged into it) is gone; the blocks below it moved up.
    expect(blockTypes(project)).toEqual([
      "global_declaration",
      "math_number",
      "component_event",
      "component_method",
      "controls_openAnotherScreen",
      "text",
      "procedures_defnoreturn",
      "math_number",
    ]);
    expect(check(project)).toEqual([]);
  });

  it("removeComponent on a container removes its children too", () => {
    const project = removeComponent(demoProject(), "Screen1", "Row");
    expect(getScreen(project, "Screen1").form.children.map((c) => c.name)).toEqual(["Ext1"]);
    expect(blockTypes(project)).not.toContain("component_event");
    expect(() => removeComponent(project, "Screen1", "Screen1")).toThrow(InvalidOperationError);
  });

  it("addComponent places components and rejects duplicate names", () => {
    const image = createComponent("Image", "Image1", {
      properties: { Picture: "logo.png", Visible: true },
      version: 6,
    });
    expect(image).toMatchObject({
      type: "Image",
      version: "6",
      properties: { Picture: "logo.png", Visible: "True" },
    });
    expect(image.uuid).toMatch(/^-?\d+$/);

    let project = addComponent(demoProject(), "Screen1", image);
    expect(getScreen(project, "Screen1").form.children.map((c) => c.name)).toEqual([
      "Row",
      "Ext1",
      "Image1",
    ]);

    project = addComponent(project, "Screen1", createComponent("Label", "First"), {
      parent: "Row",
      index: 0,
    });
    expect(
      findComponent(getScreen(project, "Screen1"), "Row")?.children.map((c) => c.name),
    ).toEqual(["First", "Button1", "Label1"]);

    expect(() => addComponent(project, "Screen1", createComponent("Label", "Button1"))).toThrow(
      ConflictError,
    );
    expect(() =>
      addComponent(project, "Screen1", createComponent("Label", "L"), { parent: "Nope" }),
    ).toThrow(NotFoundError);
    const nested = createComponent("VerticalArrangement", "Box", {
      children: [createComponent("Label", "Label1")],
    });
    expect(() => addComponent(project, "Screen1", nested)).toThrow(ConflictError);
  });

  it("moveComponent re-parents within the screen", () => {
    const project = moveComponent(demoProject(), "Screen1", "Label1", { index: 0 });
    const screen1 = getScreen(project, "Screen1");
    expect(screen1.form.children.map((c) => c.name)).toEqual(["Label1", "Row", "Ext1"]);
    expect(findParent(screen1, "Label1")?.name).toBe("Screen1");
    expect(() => moveComponent(project, "Screen1", "Row", { parent: "Button1" })).toThrow(
      InvalidOperationError,
    );
    expect(() => moveComponent(project, "Screen1", "Screen1", {})).toThrow(InvalidOperationError);
  });

  it("updateComponent applies arbitrary changes but refuses to rename", () => {
    const project = updateComponent(demoProject(), "Screen1", "Button1", (c) => ({
      ...c,
      version: "9",
    }));
    expect(findComponent(getScreen(project, "Screen1"), "Button1")?.version).toBe("9");
    expect(() =>
      updateComponent(project, "Screen1", "Button1", (c) => ({ ...c, name: "B" })),
    ).toThrow(InvalidOperationError);
  });
});

describe("screens", () => {
  it("addScreen creates an empty screen that inherits versions from the main screen", async () => {
    const project = await reread(addScreen(demoProject(), "Settings"));
    const settings = getScreen(project, "Settings");
    expect(settings.form).toMatchObject({
      name: "Settings",
      type: "Form",
      version: "31",
      uuid: "0",
    });
    expect(settings.meta.form["YaVersion"]).toBe("232");
    expect(settings.blocks).toEqual([]);
  });

  it("addScreen validates names", () => {
    const project = demoProject();
    expect(() => addScreen(project, "Screen2")).toThrow(ConflictError);
    expect(() => addScreen(project, "2nd")).toThrow(InvalidOperationError);
    expect(() => addScreen(project, { ...screen("A", EMPTY_SCM, ""), name: "B" })).toThrow(
      InvalidOperationError,
    );
  });

  it("removeScreen refuses to remove the main screen", () => {
    const project = removeScreen(demoProject(), "Screen2");
    expect(project.screens.map((s) => s.name)).toEqual(["Screen1"]);
    expect(() => removeScreen(project, "Screen1")).toThrow(InvalidOperationError);
    expect(() => removeScreen(project, "Screen2")).toThrow(NotFoundError);
  });

  it("renameScreen updates the form, main, and blocks that open the screen", async () => {
    let project = renameScreen(demoProject(), "Screen2", "Details");
    const open = Array.from(walkBlocks(getScreen(project, "Screen1"))).find((b) => b.id === "o1");
    expect(open?.values["SCREEN"]?.fields["TEXT"]).toBe("Details");
    expect(getScreen(project, "Details").form.name).toBe("Details");

    project = await reread(renameScreen(project, "Screen1", "Home"));
    expect(project.properties.main).toBe("appinventor.ai_test.Demo.Home");
    expect(project.screens.map((s) => s.name)).toEqual(["Home", "Details"]);
    expect(check(project)).toEqual([]);
    expect(() => renameScreen(project, "Home", "Details")).toThrow(ConflictError);
  });

  it("renameScreen updates blocks that refer to the form", () => {
    const formEvent =
      '<xml><block type="component_event" id="1"><mutation component_type="Form" is_generic="false" instance_name="Screen2" event_name="Initialize"></mutation><field name="COMPONENT_SELECTOR">Screen2</field></block></xml>';
    const project = {
      ...demoProject(),
      screens: [screen("Screen1"), screen("Screen2", EMPTY_SCM, formEvent)],
    };
    const renamed = renameScreen(project, "Screen2", "Details");
    expect(instances(renamed, "Details")).toEqual(["Details"]);
  });

  it("copyScreen duplicates a screen under a new name", () => {
    const project = copyScreen(demoProject(), "Screen1", "Copy");
    const copy = getScreen(project, "Copy");
    expect(copy.form.name).toBe("Copy");
    expect(copy.form.children).toBe(getScreen(project, "Screen1").form.children);
    expect(check(project)).toEqual([]);
  });
});

describe("assets", () => {
  it("addAsset accepts blobs, bytes and text", async () => {
    let project = addAsset(demoProject(), "a.txt", "hello");
    project = addAsset(project, "b.bin", new Uint8Array([1, 2]));
    expect(await project.assets.find((a) => a.name === "a.txt")?.blob.text()).toBe("hello");
    expect(project.assets.find((a) => a.name === "b.bin")?.blob.size).toBe(2);
    expect(() => addAsset(project, "a.txt", "again")).toThrow(ConflictError);

    project = addAsset(project, "a.txt", "again", { replace: true });
    expect(project.assets.map((a) => a.name)).toEqual(["logo.png", "unused.mp3", "a.txt", "b.bin"]);
    expect(await project.assets[2]?.blob.text()).toBe("again");
  });

  it("removeAsset removes by name", () => {
    expect(removeAsset(demoProject(), "unused.mp3").assets.map((a) => a.name)).toEqual([
      "logo.png",
    ]);
    expect(() => removeAsset(demoProject(), "nope")).toThrow(NotFoundError);
  });

  it("renameAsset updates properties and the app icon that name it", () => {
    const project = renameAsset(demoProject(), "logo.png", "brand.png");
    expect(project.assets[0]?.name).toBe("brand.png");
    expect(project.properties.icon).toBe("brand.png");
    expect(findComponent(getScreen(project, "Screen1"), "Button1")?.properties["Image"]).toBe(
      "brand.png",
    );
    expect(() => renameAsset(project, "brand.png", "unused.mp3")).toThrow(ConflictError);
  });
});

describe("extensions", () => {
  it("addExtension adds or replaces", () => {
    const other = extension("com.other", "Other");
    const project = addExtension(demoProject(), other);
    expect(project.extensions.map((e) => e.packageName)).toEqual(["com.example.ext", "com.other"]);
    expect(() => addExtension(project, other)).toThrow(ConflictError);
    expect(addExtension(project, other, { replace: true }).extensions).toHaveLength(2);
  });

  it("removeExtension refuses while components still use it", () => {
    const project = demoProject();
    expect(() => removeExtension(project, "com.example.ext")).toThrow(/Screen1\.Ext1/);
    expect(() => removeExtension(project, "com.nope")).toThrow(NotFoundError);
    expect(
      removeExtension(removeComponent(project, "Screen1", "Ext1"), "com.example.ext").extensions,
    ).toEqual([]);
  });
});

describe("blocks", () => {
  it("mapBlocks keeps identity when nothing changes", () => {
    const { blocks } = getScreen(demoProject(), "Screen1");
    expect(mapBlocks(blocks, (block) => block)).toBe(blocks);
  });

  it("mapBlocks rewrites and deletes blocks at any depth", () => {
    const base = demoProject();
    const project = updateBlocks(base, "Screen1", (blocks) =>
      mapBlocks(blocks, (block) => {
        if (block.type === "math_number") return { ...block, fields: { NUM: "7" } };
        if (block.type === "component_method") return null;
        return block;
      }),
    );
    const blocks = Array.from(walkBlocks(getScreen(project, "Screen1")));
    expect(blocks.filter((b) => b.type === "math_number").map((b) => b.fields["NUM"])).toEqual([
      "7",
      "7",
    ]);
    expect(blocks.find((b) => b.id === "s1")?.next?.type).toBe("controls_openAnotherScreen");
    // The untouched procedure is the very same object.
    expect(getScreen(project, "Screen1").blocks[2]).toBe(getScreen(base, "Screen1").blocks[2]);
  });
});

describe("project", () => {
  it("setProjectProperties merges fields and `extra`", () => {
    const project = setProjectProperties(demoProject(), { versionCode: 9, extra: { custom: "1" } });
    expect(project.properties).toMatchObject({ versionCode: 9, name: "Demo" });
    expect(project.properties.extra).toEqual({
      assets: "../assets",
      source: "../src",
      build: "../build",
      custom: "1",
    });
  });

  it("mergeProjects renames conflicting screens by default and keeps the target's assets", async () => {
    const target = demoProject();
    const source = addAsset(
      addExtension(demoProject(), extension("com.other", "Other")),
      "new.png",
      "n",
    );
    const merged = await reread(mergeProjects(target, source));

    expect(merged.screens.map((s) => s.name)).toEqual([
      "Screen1",
      "Screen2",
      "Screen1_2",
      "Screen2_2",
    ]);
    expect(getScreen(merged, "Screen1_2").form.name).toBe("Screen1_2");
    expect(merged.assets.map((a) => a.name)).toEqual(["logo.png", "unused.mp3", "new.png"]);
    expect(merged.extensions.map((e) => e.packageName)).toEqual(["com.example.ext", "com.other"]);
    expect(check(merged)).toEqual([]);
  });

  it("mergeProjects honours the conflict policies", () => {
    const target = demoProject();
    const source = setProperty(
      addAsset(demoProject(), "logo.png", "new", { replace: true }),
      "Screen1",
      "Button1",
      "Text",
      "S",
    );
    const skipped = mergeProjects(target, source, { screens: "skip" });
    expect(skipped.screens).toEqual(target.screens);
    expect(skipped.assets[0]).toBe(target.assets[0]);

    const replaced = mergeProjects(target, source, { screens: "replace", assets: "replace" });
    expect(replaced.screens[0]).toBe(source.screens[0]);
    expect(replaced.assets[0]).toBe(source.assets[0]);
  });
});
