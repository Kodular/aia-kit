# Usage guide

## Reading

```typescript
import { readAia } from "aia-kit";

const { project, problems } = await readAia(input); // Blob | ArrayBuffer | Uint8Array
```

`readAia` throws `ArchiveError` only when the input is hopeless: not a ZIP, or no usable `project.properties`. Anything smaller — a screen with a corrupt `.scm`, an extension without `components.json` — is reported in `problems`, and the affected files are kept in `project.otherFiles` so they are still written back.

In Node, pass the result of `fs.readFile` directly.

## The data model

```typescript
interface Project {
  properties: ProjectProperties; // project.properties, typed
  screens: Screen[];             // main screen first
  assets: Asset[];               // { name, blob }
  extensions: Extension[];       // { packageName, components, files }
  otherFiles: ArchiveFile[];     // anything else in the archive
}

interface Screen {
  name: string;
  form: Component;  // designer tree
  blocks: Block[];  // top-level blocks
  meta: ScreenMeta; // file-format versions
}

interface Component {
  name: string;
  type: string; // "Button", or a qualified name for extension components
  version?: string;
  uuid: string;
  properties: Record<string, string>; // exactly as App Inventor encodes them
  children: Component[];
}

interface Block {
  type: string;
  id: string;
  fields: Record<string, string>;
  mutation: Record<string, string>; // instance_name, event_name, …
  values: Record<string, Block>;     // expression inputs
  statements: Record<string, Block>; // first block of each nested stack
  next?: Block;                      // block attached below
}
```

Everything is `readonly`. These are ordinary objects: you can build them by hand, spread them, and compare them with `===`.

## Looking around

```typescript
import { getScreen, findComponent, walkComponents, walkBlocks, componentReference } from "aia-kit";

const screen = getScreen(project, "Screen1"); // throws NotFoundError; findScreen returns undefined
const button = findComponent(screen, "Button1");

for (const component of walkComponents(screen)) {
  console.log(component.type, component.name);
}

// Every event handler on the screen
for (const block of walkBlocks(screen)) {
  const ref = componentReference(block);
  if (ref?.kind === "event") console.log(`when ${ref.instance}.${ref.member}`);
}
```

## Editing

Every edit takes a project and returns a new one.

```typescript
import {
  addComponent, createComponent, moveComponent, removeComponent, renameComponent,
  setProperty, removeProperty, addScreen, copyScreen, renameScreen, removeScreen,
  addAsset, renameAsset, removeAsset, addExtension, removeExtension, readAix,
  setProjectProperties, mergeProjects,
} from "aia-kit";

let p = project;

// Components
p = addComponent(p, "Screen1", createComponent("Label", "Status", { properties: { Text: "Ready" } }));
p = addComponent(p, "Screen1", createComponent("Button", "Ok"), { parent: "Row1", index: 0 });
p = setProperty(p, "Screen1", "Status", "FontSize", 18);   // stored as "18"
p = setProperty(p, "Screen1", "Status", "Visible", false);  // stored as "False"
p = renameComponent(p, "Screen1", "Status", "StatusLabel"); // blocks are updated
p = moveComponent(p, "Screen1", "Ok", { parent: "Screen1" });
p = removeComponent(p, "Screen1", "Ok");                    // its blocks are removed

// Screens
p = addScreen(p, "Settings");                // empty; inherits versions from the main screen
p = copyScreen(p, "Settings", "About");
p = renameScreen(p, "About", "AboutApp");    // updates main and "open another screen" blocks
p = removeScreen(p, "AboutApp");

// Assets and extensions
p = addAsset(p, "logo.png", pngBlob);        // Blob | ArrayBuffer | Uint8Array | string
p = renameAsset(p, "logo.png", "brand.png"); // properties naming it are updated
p = addExtension(p, await readAix(aixBlob));

// Project settings
p = setProjectProperties(p, { versionCode: 2, versionName: "1.1" });

// Combining projects
p = mergeProjects(p, otherProject, { screens: "rename" });
```

### When an edit fails

Edits throw instead of returning a half-applied project:

| Error | Meaning |
|-------|---------|
| `NotFoundError` | The screen, component, asset or extension does not exist (`error.kind`, `error.entity`) |
| `ConflictError` | The name is already taken |
| `InvalidOperationError` | The result could not be opened by App Inventor: removing the main screen, moving a component into itself, removing an extension that is still in use, … |

All extend `AiaKitError`.

### Anything else

Two escape hatches cover edits without a dedicated function:

```typescript
import { updateComponent, updateBlocks, mapBlocks } from "aia-kit";

p = updateComponent(p, "Screen1", "Button1", (c) => ({ ...c, version: "8" }));

// Delete every disabled block. Returning null removes a block and reconnects the stack around it.
p = updateBlocks(p, "Screen1", (blocks) => mapBlocks(blocks, (b) => (b.disabled ? null : b)));
```

## Checking

```typescript
import { check } from "aia-kit";
import { loadPlatform } from "aia-kit/platforms";

check(project);                               // structural checks only
check(project, await loadPlatform("kodular")); // plus component types, properties, assets
```

`check` returns `Problem[]`. Each problem has a `code` to switch on, a `severity` (`"error"` or `"warning"`), a `message`, and fields specific to its code:

| Code | Fields |
|------|--------|
| `missing-main-screen`, `duplicate-screen` | `screen` |
| `screen-name-mismatch` | `screen`, `formName` |
| `duplicate-component` | `screen`, `component` |
| `dangling-block-reference` | `screen`, `blockId`, `component` |
| `unknown-component-type` | `screen`, `component`, `type` |
| `unknown-property` | `screen`, `component`, `property` |
| `missing-asset` | `screen`, `component`, `property`, `asset` |
| `unreadable-screen` (from `readAia`) | `screen`, `reason` |
| `unreadable-extension` (from `readAia`) | `extension` |

## Platforms

```typescript
import { loadPlatform, lookupComponent, definePlatform, parseComponentDescriptors } from "aia-kit/platforms";

const platform = await loadPlatform("app-inventor");
const button = lookupComponent("Button", platform);
button?.events.map((e) => e.name);

// Extension components resolve when you pass the project.
lookupComponent(component.type, platform, project);

// Another distribution
const mine = definePlatform({ id: "mine", name: "Mine", components: parseComponentDescriptors(json) });
```

The descriptor data is large, so it lives in its own entry point and is loaded on first use.

## Analysis

```typescript
import {
  diffProjects, findUnusedAssets, findUnusedExtensions, findAssetReferences,
  summarizeBlocks, listDeclarations, findOrphanBlocks, navigationGraph,
} from "aia-kit/analysis";

await diffProjects(before, after); // { screens, assets, extensions: { added, removed, changed }, propertiesChanged }
findUnusedAssets(project);         // Asset[]
summarizeBlocks(screen);           // { topLevel, total, byType, maxDepth }
navigationGraph(project);          // { screens, edges: [{ from, to }] }
```

## Writing

```typescript
import { writeAia, writeAix } from "aia-kit";

const blob = await writeAia(project);
await fs.writeFile("out.aia", await blob.bytes()); // Node
```

Parts that were read and not changed are written back as their original bytes.

## Extensions

```typescript
import { readAix, writeAix } from "aia-kit";

const extension = await readAix(aixBlob);
extension.packageName;                 // "com.example.myext"
extension.components[0].methods;       // descriptors
extension.files.map((f) => f.path);    // classes.jar, assets/…, files/AndroidRuntime.jar, …
```

## Loose files

```typescript
import { parseScm, serializeScm, parseBky, serializeBky, parseProperties, serializeProperties } from "aia-kit/formats";

const { form, meta } = parseScm(scmText); // throws ParseError
const { blocks } = parseBky(bkyText);
```
