# AIX — App Inventor Extension

An **AIX** file is a standard **ZIP** archive packaging a **compiled Android extension** (component descriptors + bytecode + manifest + optional assets).

**Relationship to AIA:** AIX is **not** embedded as ZIP-in-ZIP inside an AIA. When bundled, the same directory layout is unpacked to `assets/external_comps/<package-name>/` inside the project archive. **`parseAix(blob)`** reads a standalone AIX; **`parseAia`** reads each bundled subdirectory — both yield **`AiaExtension`**.

---

## ZIP directory structure (single component)

```
com.example.MyExtension/        (top-level directory = package name)
├── component.json              (descriptor — single component)
├── component_build_info.json   (build metadata)
├── classes.jar
├── AndroidRuntime.jar
├── AndroidManifest.xml
└── assets/                     (optional — icons, etc.)
    └── images/
        └── icon.png
```

**Extension packs** (multiple components in one AIX) use different filenames — see [Extension packs](#extension-packs).

---

## Component descriptor (`component.json`)

Describes properties, events, and methods exposed to the block editor and runtime. Packs use **`components.json`** — a JSON **array** of the same object shape.

```json
{
  "type": "com.example.MyExtension",
  "name": "MyExtension",
  "external": "true",
  "version": "1",
  "dateBuilt": "2024-01-01T00:00:00+0530",
  "categoryString": "EXTENSION",
  "helpString": "HTML description",
  "helpUrl": "https://example.com/docs",
  "showOnPalette": "true",
  "nonVisible": "false",
  "iconName": "images/icon.png",
  "androidMinSdk": 19,
  "properties": [
    {
      "name": "MyProp",
      "editorType": "string",
      "defaultValue": "",
      "editorArgs": [],
      "propertyType": "common"
    }
  ],
  "blockProperties": [
    {
      "name": "MyProp",
      "description": "...",
      "type": "text",
      "rw": "read-write",
      "deprecated": "false"
    }
  ],
  "events": [
    {
      "name": "MyEvent",
      "description": "...",
      "deprecated": "false",
      "params": [{ "name": "result", "type": "text" }]
    }
  ],
  "methods": [
    {
      "name": "DoSomething",
      "description": "...",
      "deprecated": "false",
      "params": [],
      "returnType": "text"
    }
  ]
}
```

**Quirks:**

- **`external`** is the string `"true"`, not a JSON boolean.
- **`deprecated`** flags are string booleans (`"true"` / `"false"`).
- **`propertyType`** (`"common"` \| `"advanced"`) appears on Kodular-style descriptors; MIT lists may omit it.
- Built-ins in environment JSON use the same schema with **`"external": "false"`**.

`blockProperties[].type` uses editor-oriented unions such as `"text"`, `"number"`, `"boolean"`, `"list"`, `"component"`, `"any"`, `"color"`, `"asset"`.

---

## Build info (`component_build_info.json`)

Used by the App Inventor build server. Not required for descriptor resolution inside **aia-kit**.

```json
{
  "type": "com.example.MyExtension",
  "metadata": []
}
```

`metadata` is opaque — not consumed by **aia-kit**.

---

## Binary files

| File | Role |
|------|------|
| `classes.jar` | Compiled bytecode — merged into app DEX at build |
| `AndroidRuntime.jar` | Runtime API stubs — compile-time |
| `AndroidManifest.xml` | Permissions / components — merged into host manifest |

**aia-kit** does not inspect these for **`resolve()`**. Large payloads are exposed lazily via **`AiaExtension.loadClasses()`** and **`AiaExtension.loadAssets()`**.

---

## Extension packs

Multiple components in one AIX share one ZIP root with array-shaped metadata.

### Layout

```
com.example.MyPack/
├── components.json              (array of descriptors)
├── component_build_infos.json   (array of build infos)
├── classes.jar
├── AndroidRuntime.jar
├── AndroidManifest.xml
└── assets/
```

### Detection

No explicit “pack” flag — **filenames** discriminate:

| Filename | Shape | Meaning |
|----------|-------|---------|
| `component.json` | object | Single component |
| `components.json` | array | Pack |
| `component_build_info.json` | object | Single build info |
| `component_build_infos.json` | array | Pack build infos |

Array entries in **`components.json`** and **`component_build_infos.json`** are paired **by index** — order must match.

---

## aia-kit APIs

| API | Role |
|-----|------|
| **`parseAix`** | Standalone `.aix` blob → **`AiaExtension`** |
| **`parseAia`** | Reads each `assets/external_comps/<pkg>/` tree |
| **`Environment.withExtension`** | Merge extension descriptors for **`resolve()`** |

---

## See also

| Topic | Document |
|-------|-----------|
| Full project archive | [AIA](aia.md) |
| Glossary | [Ubiquitous language — AIX](ubiquitous-language.md#file-formats) |
