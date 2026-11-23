import { describe, expect, it } from "vitest";
import { readAia } from "./archive/read.ts";
import { check } from "./check.ts";
import { removeAsset } from "./edit/assets.ts";
import { addComponent, createComponent, setProperty, updateComponent } from "./edit/components.ts";
import { loadPlatform } from "./platforms/index.ts";
import { AIA_FIXTURES, demoProject, fixture } from "./test-helpers.ts";

const codes = (problems: readonly { code: string }[]) => problems.map((p) => p.code);

describe("check without a platform", () => {
  it("finds nothing wrong with a consistent project", () => {
    expect(check(demoProject())).toEqual([]);
  });

  it("reports structural problems", () => {
    const base = demoProject();
    const [screen1, screen2] = base.screens;
    const project = {
      ...base,
      properties: { ...base.properties, main: "appinventor.ai_test.Demo.Home" },
      screens: [
        { ...screen1!, form: { ...screen1!.form, children: screen1!.form.children.slice(1) } },
        {
          ...screen2!,
          form: { ...screen2!.form, name: "Other", children: [screen2!.form, screen2!.form] },
        },
        screen2!,
      ],
    };
    const problems = check(project);
    expect(codes(problems)).toEqual([
      "missing-main-screen",
      "dangling-block-reference",
      "dangling-block-reference",
      "screen-name-mismatch",
      "duplicate-component",
      "duplicate-screen",
    ]);
    expect(problems[1]).toEqual({
      code: "dangling-block-reference",
      severity: "error",
      screen: "Screen1",
      blockId: "e1",
      component: "Button1",
      message: 'A component_event block in Screen1 refers to missing component "Button1"',
    });
  });
});

describe("check with a platform", () => {
  it("reports unknown types, unknown properties and missing assets", async () => {
    const platform = await loadPlatform("app-inventor");
    let project = addComponent(demoProject(), "Screen1", createComponent("Hologram", "Holo1"));
    project = setProperty(project, "Screen1", "Label1", "Sparkle", true);
    project = setProperty(project, "Screen1", "Button1", "Image", "https://example.com/a.png");
    project = removeAsset(project, "logo.png");
    project = updateComponent(project, "Screen1", "Row", (row) => ({
      ...row,
      children: [
        ...row.children,
        createComponent("Image", "Image1", { properties: { Picture: "logo.png" } }),
      ],
    }));

    expect(check(project, platform).map((p) => [p.code, p.severity, p.message])).toEqual([
      ["unknown-property", "warning", 'Label has no property "Sparkle" (Screen1.Label1)'],
      ["missing-asset", "warning", 'Screen1.Image1.Picture refers to missing asset "logo.png"'],
      [
        "unknown-component-type",
        "warning",
        'Screen1.Holo1 has type "Hologram", which MIT App Inventor does not provide',
      ],
    ]);
  });

  it("resolves extension components through the project", async () => {
    const platform = await loadPlatform("app-inventor");
    expect(check(demoProject(), platform)).toEqual([]);
    expect(codes(check({ ...demoProject(), extensions: [] }, platform))).toEqual([
      "unknown-component-type",
    ]);
  });

  it.each(AIA_FIXTURES)("finds no errors in %s", async (path) => {
    const { project } = await readAia(await fixture(path));
    const platform = await loadPlatform("app-inventor");
    expect(check(project, platform).filter((p) => p.severity === "error")).toEqual([]);
  });

  it("tells platforms apart: a Kodular project is clean on Kodular only", async () => {
    const { project } = await readAia(await fixture("Test.aia"));
    expect(check(project, await loadPlatform("kodular"))).toEqual([]);
    expect(check(project, await loadPlatform("app-inventor")).map((p) => p.message)).toEqual([
      'Form has no property "AppId" (Screen1.Screen1)',
      'Form has no property "ReceiveSharedText" (Screen1.Screen1)',
    ]);
  });
});
