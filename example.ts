import fs from "node:fs/promises";
import { AIAReader } from "./src/aia_reader";

async function main() {
  try {
    const aiaFile = await fs.readFile("test/fixtures/Test.aia");
    const aiaFileBlob = new Blob([aiaFile]);

    // Create an instance of AIAReader and read the AIA file
    const project = await AIAReader.parse(aiaFileBlob);

    // Pretty print the parsed information
    console.log("Project Information:");
    console.log("===================");
    console.log(`Name: ${project.name}`);

    // Print screens information
    console.log("\nScreens:");
    console.log("========");
    project.screens.forEach((screen) => {
      console.log(`\nScreen: ${screen.name}`);
    });

    // Print assets information
    console.log("\nAssets:");
    console.log("=======");
    project.assets.forEach((asset) => {
      console.log(`- ${asset.name}`);
    });
  } catch (error) {
    console.error("Error parsing AIA file:", error);
  }
}

main();
