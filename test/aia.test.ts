import fs from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { Environment } from "../src/Environment.js";
import { parseAia } from "../src/index.js";

describe("AIAReader", () => {
  it("should read the AIA file", async () => {
    const aiaFile = await fs.readFile("test/fixtures/Test.aia");
    const aiaFileBlob = new Blob([aiaFile]);

    const environment = await Environment.kodularCreator();

    const project = await parseAia(aiaFileBlob, environment);

    expect(project).toBeDefined();

    expect(project.name).toBe("Test");
    expect(project.properties).toBeDefined();
    expect(project.properties).toMatchObject({
      aname: "Test",
      main: "io.kodular.diego_barreiro_perez.Test.Screen1",
      minSdk: "21",
      name: "Test",
      versioncode: "1",
      versionname: "1.0",
    });

    expect(project.screens.length).toBe(1);
    expect(project.screens[0].name).toBe("Screen1");

    expect(project.screens[0].form.name).toBe("Screen1");
    expect(project.screens[0].form.type).toBe("Form");

    expect(project.assets.length).toBe(0);

    expect(project.extensions.length).toBe(0);
  });
});
