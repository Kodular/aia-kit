# aia-kit

![npm](https://img.shields.io/npm/v/aia-kit)

Read, Parse, Edit, Write AIA/AIX/AIS files.

## Installation

```bash
npm install aia-kit
```

## Usage

```typescript
import fs from "node:fs/promises";
import { parseAia } from "./src/reader.js";
import { Environment } from "./src/Environment.js";

async function main() {
  try {
    const aiaFile = await fs.readFile("test/fixtures/Test.aia");
    const aiaFileBlob = new Blob([aiaFile]);

    // Get the Kodular environment
    const kodularEnvironment = await Environment.kodularCreator();

    // Parse the AIA file
    const project = await parseAia(aiaFileBlob, kodularEnvironment);

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
```

## Environment

The `Environment` class provides a way to specify the target App Inventor platform. This is important because different platforms may have different sets of built-in components. By providing an environment, `aia-kit` can accurately parse the project's components.

Currently, the only available environment is `Kodular`. You can get an instance of the Kodular environment by calling the static `kodularCreator` method:

```typescript
import { Environment } from 'aia-kit';

const kodularEnvironment = await Environment.kodularCreator();
```



---

Copyright (c) 2023 Junnovate, LLC
