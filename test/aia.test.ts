import fs from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { parseAia } from "../src/index.js";

describe("AIAReader", () => {
  it("should read the AIA file", async () => {
    const aiaFile = await fs.readFile("test/fixtures/Test.aia");
    const aiaFileBlob = new Blob([aiaFile]);

    const project = await parseAia(aiaFileBlob);

    expect(project).toBeDefined();

    expect(project.name).toBe("Test");

    expect(project.screens.length).toBe(1);
    expect(project.screens[0].name).toBe("Screen1");
  });
});
