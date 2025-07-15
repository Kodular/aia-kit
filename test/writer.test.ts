import fs from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { parseAia, writeAia } from "../src";
import { Environment } from "../src/Environment";

describe("AIA Writer", () => {
  it.each([
    ["Kodular Creator", Environment.kodularCreator],
    ["MIT App Inventor", Environment.mitAppInventor],
  ])("should write an AIA file that can be parsed back to the same project with %s environment", async (environmentName, environmentFactory) => {
    // Arrange
    const aiaFile = await fs.readFile("test/fixtures/Test.aia");
    const aiaFileBlob = new Blob([aiaFile]);
    const environment = await environmentFactory();

    // Act
    const project1 = await parseAia(aiaFileBlob, environment);
    const writtenAia = await writeAia(project1);
    const project2 = await parseAia(writtenAia, environment);

    // Assert
    expect(project1).toMatchObject(project2);
  });
});
