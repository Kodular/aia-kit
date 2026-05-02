# `simple_components.json` — Platform component registry

`simple_components.json` is a **JSON array** of component descriptors. It is the authoritative registry of every component type that a platform (MIT App Inventor, Kodular Creator, etc.) makes available in the designer and block editor.

---

## Who provides it

| Platform | Path |
|----------|------|
| Kodular Creator | [`environments/kodular-creator/simple_components.json`](../environments/kodular-creator/simple_components.json) |
| MIT App Inventor | [`environments/mit-app-inventor/simple_components.json`](../environments/mit-app-inventor/simple_components.json) |

Extensions contribute their own descriptors using the same schema. An AIX package includes either a `component.json` (single object) or `components.json` (array). aia-kit normalises both to an array when loading — see [`src/parse.ts`](../src/parse.ts).

---

## How aia-kit loads it

```typescript
// Built-in platform registry
const env = await Environment.kodularCreator()   // or Environment.mitAppInventor()

// Extend with an AIX
const ext = await parseAix(aixBlob)
const envWithExt = env.withExtension(ext)
```

Internally the JSON array is consumed by `ComponentRegistry`, which is held on the `Environment` object. Lookups by short name or fully-qualified type resolve to `ComponentDescriptor` objects at resolve time.

---

## Top-level schema — component descriptor object

| Field | JSON type | TypeScript type | Description |
|-------|-----------|-----------------|-------------|
| `type` | string | `string` | Fully-qualified Java class name, e.g. `com.google.appinventor.components.runtime.Button` |
| `name` | string | `string` | Short name used in SCM/YAIL, e.g. `Button` |
| `external` | string | `boolean` (parsed) | `"true"` or `"false"` — whether it is an external extension |
| `version` | number | `number` | Component schema version |
| `categoryString` | string | `string` | Designer palette category (e.g. `USERINTERFACE`, `SENSORS`) |
| `helpString` | string | `string` | HTML help text shown in the designer |
| `showOnPalette` | string | `boolean` (parsed) | `"true"` or `"false"` — whether the component appears in the palette |
| `nonVisible` | string | `boolean` (parsed) | `"true"` for non-visual (invisible) components |
| `iconName` | string | `string` | Relative path to the palette icon image |
| `properties` | array | `ComponentPropertyDescriptor[]` | Design-time properties shown in the designer panel |
| `blockProperties` | array | `ComponentBlockPropertyDescriptor[]` | Block-editor properties with type and read/write hints |
| `events` | array | `ComponentEventDescriptor[]` | Event descriptors with parameter info |
| `methods` | array | `ComponentMethodDescriptor[]` | Method descriptors with parameter and return-type info |

Additional fields (e.g. `helpUrl`, `dateBuilt`, `androidMinSdk`) may appear in platform-specific files and are stored on the raw JSON but are not part of the `ComponentDescriptor` TypeScript interface.

---

## Nested schemas

### `properties[]` — design-time properties

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Property name (matches SCM key) |
| `editorType` | string | Editor widget type (e.g. `boolean`, `string`, `color`, `non_negative_integer`) |
| `defaultValue` | string | Default value as a string |
| `propertyType` | string (optional) | Category hint (`"common"`, `"advanced"`, …) |
| `editorArgs` | array (optional) | Extra arguments for the editor widget |

### `blockProperties[]` — block editor properties

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Property name |
| `description` | string | Human-readable description |
| `type` | string | Value type hint (e.g. `boolean`, `number`, `text`) |
| `rw` | string | Access mode: `"read-write"`, `"read-only"`, `"write-only"`, or `"invisible"` |
| `deprecated` | string | `"true"` or `"false"` |

### `events[]` — event descriptors

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Event name |
| `description` | string | Human-readable description |
| `deprecated` | string | `"true"` or `"false"` |
| `params` | array | Parameter list — each item: `{ name: string, type: string }` |

### `methods[]` — method descriptors

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Method name |
| `description` | string | Human-readable description |
| `deprecated` | string | `"true"` or `"false"` |
| `params` | array | Parameter list — each item: `{ name: string, type: string }` |
| `returnType` | string (optional) | Return value type; absent for void methods |

---

## Abbreviated JSON example

```json
[
  {
    "type": "com.google.appinventor.components.runtime.Button",
    "name": "Button",
    "external": "false",
    "version": 7,
    "categoryString": "USERINTERFACE",
    "helpString": "A button component...",
    "showOnPalette": "true",
    "nonVisible": "false",
    "iconName": "images/button.png",
    "properties": [
      {
        "name": "Text",
        "editorType": "string",
        "defaultValue": "",
        "propertyType": "common",
        "editorArgs": []
      },
      {
        "name": "Enabled",
        "editorType": "boolean",
        "defaultValue": "True",
        "propertyType": "common",
        "editorArgs": []
      }
    ],
    "blockProperties": [
      {
        "name": "Text",
        "description": "The text displayed on the button.",
        "type": "text",
        "rw": "read-write",
        "deprecated": "false"
      }
    ],
    "events": [
      {
        "name": "Click",
        "description": "User tapped and released the button.",
        "deprecated": "false",
        "params": []
      },
      {
        "name": "LongClick",
        "description": "User held the button down.",
        "deprecated": "false",
        "params": []
      }
    ],
    "methods": [
      {
        "name": "RequestFocus",
        "description": "Request focus for this component.",
        "deprecated": "false",
        "params": []
      }
    ]
  }
]
```

---

## Extension `component.json` vs `components.json`

An extension AIX may ship either:

- **`component.json`** — a single JSON object (one component).
- **`components.json`** — a JSON array (multiple components from the same extension package).

aia-kit normalises both to an array in `parseAix` and `buildExtensions` (see [`src/parse.ts`](../src/parse.ts)):

```typescript
const components: ComponentDescriptor[] = Array.isArray(parsed) ? parsed : [parsed]
```

---

## TypeScript interfaces

Defined in [`src/core/descriptors.ts`](../src/core/descriptors.ts):

```typescript
interface ComponentDescriptor {
  type: string
  name: string
  external: boolean
  version: number
  categoryString: string
  helpString: string
  showOnPalette: boolean
  nonVisible: boolean
  iconName: string
  properties: ComponentPropertyDescriptor[]
  blockProperties: ComponentBlockPropertyDescriptor[]
  events: ComponentEventDescriptor[]
  methods: ComponentMethodDescriptor[]
}
```

---

## See also

| Topic | Document |
|-------|---------|
| AIA project metadata | [project-properties.md](project-properties.md) |
| Extension package format | [AIX](aix.md) |
| Glossary | [Ubiquitous language](ubiquitous-language.md) |
