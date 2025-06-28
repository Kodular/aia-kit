import fs from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { parseAia, writeAia } from "../src";
import { Environment } from "../src/Environment";

describe("AIA Writer", () => {
  it("should write an AIA file that can be parsed back to the same project", async () => {
    // Arrange
    const aiaFile = await fs.readFile("test/fixtures/Test.aia");
    const aiaFileBlob = new Blob([aiaFile]);
    const kodularEnvironment = await Environment.kodularCreator();

    // Act
    const project1 = await parseAia(aiaFileBlob, kodularEnvironment);
    const writtenAia = await writeAia(project1);
    const project2 = await parseAia(writtenAia, kodularEnvironment);

    // Assert
    expect(project1).toMatchObject(project2);
  });
});
