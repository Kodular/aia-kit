# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is `aia-kit`, a TypeScript library for reading, parsing, editing, and writing AIA/AIX/AIS files (App Inventor project files). The library is designed to work with App Inventor-based platforms, particularly Kodular Creator.

## Common Commands

### Build and Development
- `npm run build` - Compiles TypeScript to JavaScript in the `dist/` directory
- `npm run test` - Runs the test suite using Vitest
- `npm run test:w` - Runs tests in watch mode for development

### Testing
- Tests are located in `test/` directory
- Test files use the `.test.ts` extension
- Uses Vitest as the testing framework
- Test fixtures are in `test/fixtures/`

## Architecture

### Core Components

The library is structured around several key concepts:

1. **Environment** (`src/Environment.ts`): Represents the target App Inventor platform (e.g., Kodular Creator) and contains component descriptors that define what components are available.

2. **Project** (`src/project.ts`): The main container representing an AIA project with screens, assets, and extensions.

3. **Reader** (`src/reader.ts`): Contains the `parseAia()` function that extracts and parses AIA files using the ZIP format.

4. **Writer** (`src/writer.ts`): Contains the `writeAia()` function that packages project data back into AIA format.

5. **Core Data Types**:
   - **Screen** (`src/screen.ts`): Represents a single screen with its components and blocks
   - **Component** (`src/component.ts`): Represents UI components and their properties
   - **Asset** (`src/asset.ts`): Represents media files and other assets
   - **Extension** (`src/extension.ts`): Represents external extensions/components

### Key Files

- `src/index.ts` - Main entry point with public API exports
- `src/types.ts` - TypeScript type definitions
- `src/types.zod.ts` - Zod validation schemas
- `src/file_structures.ts` - Defines AIA file structure constants
- `src/property_processor.ts` - Handles component property processing
- `src/utils/` - Utility functions for ZIP handling and general operations
- `src/environments/kodular/simple_components.json` - Kodular component definitions

### Environment System

The library uses an Environment system to handle different App Inventor platforms:

```typescript
const environment = await Environment.kodularCreator();
const project = await parseAia(aiaFileBlob, environment);
```

This allows accurate parsing of components based on the target platform's capabilities.

### File Processing Flow

1. **Reading**: AIA files are ZIP archives containing project metadata, screens, assets, and extensions
2. **Parsing**: The reader extracts files and creates structured objects using the Environment for component validation
3. **Writing**: The writer packages the structured data back into the AIA ZIP format

## Development Notes

- Uses ES modules (`"type": "module"` in package.json)
- TypeScript compiled output goes to `dist/`
- Uses Biome for linting and formatting
- Dependencies: `@zip.js/zip.js` for ZIP handling, `properties-file` for Java properties, `zod` for validation
- The library works with Blob objects for file handling, supporting both local files and URLs