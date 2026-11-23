# API reference

Types are described in the [usage guide](usage.md#the-data-model) and defined in [`src/types.ts`](../src/types.ts).

## `aia-kit`

### Archives

| Function | Signature | Throws |
|----------|-----------|--------|
| `readAia` | `(input: Blob \| ArrayBuffer \| Uint8Array) => Promise<{ project: Project; problems: Problem[] }>` | `ArchiveError` |
| `writeAia` | `(project: Project) => Promise<Blob>` | |
| `readAix` | `(input) => Promise<Extension>` | `ArchiveError` |
| `writeAix` | `(extension: Extension) => Promise<Blob>` | |

### Queries

| Function | Returns |
|----------|---------|
| `findScreen(project, name)` | `Screen \| undefined` |
| `getScreen(project, name)` | `Screen`; throws `NotFoundError` |
| `findComponent(screenOrComponent, name)` | `Component \| undefined` |
| `findParent(screenOrComponent, name)` | `Component \| undefined` |
| `walkComponents(screenOrComponent)` | generator of `Component`, parents first |
| `walkBlocks(screenOrBlocksOrBlock)` | generator of every `Block`, nested and following included |
| `componentReference(block)` | `{ kind, componentType, instance?, member?, access? } \| undefined` |
| `mainScreenName(project)` | `string` |
| `packageName(project)` | `string`, e.g. `appinventor.ai_user.MyApp` |

`componentReference` decodes `component_event`, `component_method`, `component_set_get` and `component_component_block` blocks. `instance` is absent for generic ("any Button") blocks.

### Edits

All return a new `Project`. `screen` and `name` arguments are names.

| Function | Notes |
|----------|-------|
| `addScreen(project, nameOrScreen)` | A name creates an empty screen inheriting versions from the main screen |
| `removeScreen(project, name)` | Refuses the main screen |
| `renameScreen(project, from, to)` | Updates the form, `properties.main`, blocks that refer to the form, and blocks that open the screen by literal name |
| `copyScreen(project, from, to)` | |
| `createComponent(type, name, { properties?, version?, children? })` | Returns a `Component` with a fresh `uuid` |
| `addComponent(project, screen, component, { parent?, index? })` | Names must be unique on the screen |
| `removeComponent(project, screen, name)` | Removes children and every block that refers to them |
| `renameComponent(project, screen, from, to)` | Updates blocks |
| `moveComponent(project, screen, name, { parent?, index? })` | |
| `setProperty(project, screen, component, property, value)` | `value: string \| number \| boolean` |
| `removeProperty(project, screen, component, property)` | |
| `updateComponent(project, screen, name, fn)` | `fn: (Component) => Component`; cannot rename |
| `updateBlocks(project, screen, fn)` | `fn: (Block[]) => Block[]` |
| `mapBlocks(blocks, fn)` | `fn: (Block) => Block \| null`; bottom-up, `null` deletes |
| `addAsset(project, name, data, { replace? })` | `data: Blob \| ArrayBuffer \| Uint8Array \| string` |
| `removeAsset(project, name)` | |
| `renameAsset(project, from, to)` | Updates component properties and the app icon |
| `addExtension(project, extension, { replace? })` | |
| `removeExtension(project, packageName)` | Refuses while its components are in use |
| `setProjectProperties(project, changes)` | Shallow merge; `extra` is merged key by key |
| `mergeProjects(target, source, { screens?, assets?, extensions? })` | Defaults: `"rename"`, `"skip"`, `"skip"` |

An edit that changes nothing returns the same project object.

### Checks

`check(project, platform?) => Problem[]` — see [Checking](usage.md#checking) for the codes.

### Errors

```
AiaKitError
├── ArchiveError            not a ZIP, or required entries missing
├── ParseError              .format: "scm" | "bky" | "properties" | "descriptor"
├── NotFoundError           .kind, .entity
├── ConflictError           .kind, .entity
└── InvalidOperationError
```

`kind` is `"screen" | "component" | "asset" | "extension"`.

## `aia-kit/platforms`

| Export | Signature |
|--------|-----------|
| `loadPlatform` | `(id: "app-inventor" \| "kodular") => Promise<Platform>` |
| `definePlatform` | `({ id, name, components: Iterable<ComponentDescriptor> }) => Platform` |
| `lookupComponent` | `(type: string, platform: Platform, project?: Project) => ComponentDescriptor \| undefined` |
| `parseComponentDescriptors` | `(json: unknown) => ComponentDescriptor[]`; throws `ParseError` |

`Platform` is `{ id, name, components: ReadonlyMap<string, ComponentDescriptor> }`, keyed by fully qualified type.

## `aia-kit/analysis`

| Function | Returns |
|----------|---------|
| `diffProjects(before, after)` | `Promise<{ screens, assets, extensions: { added, removed, changed }, propertiesChanged }>` |
| `findAssetReferences(project)` | `AssetReference[]` — `kind: "icon" \| "property" \| "block"` |
| `findUnusedAssets(project)` | `Asset[]` |
| `findUnusedExtensions(project)` | `Extension[]` |
| `summarizeBlocks(screenOrBlocks)` | `{ topLevel, total, byType, maxDepth }` |
| `listDeclarations(screenOrBlocks)` | `{ globals: string[]; procedures: string[] }` |
| `findOrphanBlocks(project)` | `{ screen, block }[]` — loose top-level blocks that never run |
| `navigationGraph(project)` | `{ screens: string[]; edges: { from, to }[] }` |

Asset references are exact matches of an asset name; names assembled at runtime cannot be detected.

## `aia-kit/formats`

| Function | Signature |
|----------|-----------|
| `parseScm` / `serializeScm` | `string ⇄ { form: Component; meta }` |
| `parseBky` / `serializeBky` | `string ⇄ { blocks: Block[]; meta: BlocksMeta }` |
| `parseProperties` / `serializeProperties` | `string ⇄ ProjectProperties` |
| `parseComponentDescriptors` | `unknown => ComponentDescriptor[]` |

Parsers throw `ParseError`. Serializing a parsed, unchanged document returns its original text.
