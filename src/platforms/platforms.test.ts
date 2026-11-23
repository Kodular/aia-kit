import { describe, expect, it } from "vitest";
import { ParseError } from "../errors.ts";
import { demoProject } from "../test-helpers.ts";
import {
  definePlatform,
  loadPlatform,
  lookupComponent,
  parseComponentDescriptors,
} from "./index.ts";

describe("loadPlatform", () => {
  it.each([
    ["app-inventor", "MIT App Inventor"],
    ["kodular", "Kodular Creator"],
  ] as const)("loads %s", async (id, name) => {
    const platform = await loadPlatform(id);
    expect(platform).toMatchObject({ id, name });
    expect(platform.components.size).toBeGreaterThan(100);
    expect(await loadPlatform(id)).toBe(platform);

    const button = lookupComponent("Button", platform);
    expect(button).toMatchObject({
      type: "com.google.appinventor.components.runtime.Button",
      name: "Button",
      external: false,
      showOnPalette: true,
      nonVisible: false,
    });
    expect(button?.version).toBeGreaterThan(0);
    expect(button?.properties.find((p) => p.name === "Text")?.editorType).toBeDefined();
    expect(button?.events.map((e) => e.name)).toContain("Click");
    expect(button?.blockProperties.find((p) => p.name === "Text")?.access).toBe("read-write");
  });
});

describe("lookupComponent", () => {
  it("resolves simple and qualified names, and extension components via the project", async () => {
    const platform = await loadPlatform("app-inventor");
    const project = demoProject();
    expect(lookupComponent("com.google.appinventor.components.runtime.Label", platform)?.name).toBe(
      "Label",
    );
    expect(lookupComponent("com.example.ext.Thing", platform)).toBeUndefined();
    expect(lookupComponent("com.example.ext.Thing", platform, project)?.external).toBe(true);
    expect(lookupComponent("Thing", platform, project)?.type).toBe("com.example.ext.Thing");
    expect(lookupComponent("Nope", platform, project)).toBeUndefined();
  });
});

describe("definePlatform / parseComponentDescriptors", () => {
  it("builds a custom platform from descriptor JSON", () => {
    const platform = definePlatform({
      id: "mine",
      name: "Mine",
      components: parseComponentDescriptors({
        type: "a.b.Widget",
        version: "3",
        androidMinSdk: "21",
      }),
    });
    expect(lookupComponent("Widget", platform)).toEqual({
      type: "a.b.Widget",
      name: "Widget",
      external: false,
      version: 3,
      category: "",
      helpString: "",
      showOnPalette: true,
      nonVisible: false,
      iconName: "",
      androidMinSdk: 21,
      properties: [],
      blockProperties: [],
      events: [],
      methods: [],
    });
  });

  it("throws ParseError for entries without a type", () => {
    expect(() => parseComponentDescriptors([{ name: "x" }])).toThrow(ParseError);
    expect(() => parseComponentDescriptors("nope")).toThrow(ParseError);
  });
});
