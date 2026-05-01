# AIA and AIX File Formats

Reference documentation for the file formats that aia-kit reads and writes. Derived from the existing codebase and fixture files.

---

## AIA — App Inventor Archive

An AIA file is a standard ZIP archive. It is the primary project format for MIT App Inventor and Kodular Creator.

### ZIP Directory Structure

```
youngandroidproject/
└── project.properties

src/
└── <package/path/>              e.g. io/kodular/username/MyApp/
    ├── Screen1.scm
    ├── Screen1.bky
    ├── Screen1.yail              (optional)
    ├── Screen2.scm
    ├── Screen2.bky
    └── ...

assets/
├── image.png                    (flat — no subdirectories)
├── audio.mp3
└── external_comps/
    └── com.example.MyExtension/
        ├── component.json        (single-component extension)
        ├── component_build_info.json
        │   — or —
        ├── components.json       (extension pack)
        ├── component_build_infos.json
        ├── classes.jar
        ├── AndroidRuntime.jar
        ├── AndroidManifest.xml
        └── <other assets>
```

**Key structural rules:**
- `youngandroidproject/project.properties` is the canonical metadata location.
- Screen files live under `src/` with the package name as a directory path (dots → slashes).
- Assets are always flat under `assets/` — no subdirectories except `external_comps/`.
- Extension contents are unpacked (not ZIP-in-ZIP) into `assets/external_comps/<package-name>/`.

---

### `project.properties`

A standard Java `.properties` file (UTF-8, `key=value` lines).

| Key | Example | Notes |
|---|---|---|
| `name` | `Test` | Short project name |
| `aname` | `Test` | App display name shown on device |
| `main` | `io.kodular.username.Test.Screen1` | Fully-qualified first screen class name |
| `minSdk` | `21` | Minimum Android SDK version |
| `versioncode` | `1` | Integer build number |
| `versionname` | `1.0` | Human-readable version string |

The package name is derived from `main` by dropping the last segment (e.g. `io.kodular.username.Test`). This package name also determines the path under `src/`.

---

### SCM Files (`*.scm`)

One SCM file per screen. Contains the component tree as JSON wrapped in a Scheme-style block comment.

**File structure:**
```
#|
$JSON
{"authURL":["aia-kit"],"YaVersion":"1","Source":"Form","Properties":{...}}
|#
```

The JSON is extracted via the regex `/#\|\s*\$JSON\s*(.*?)\s*\|#/s`.

**JSON wrapper fields:**

| Field | Type | Notes |
|---|---|---|
| `YaVersion` | string (numeric) | Young Android schema version |
| `Source` | string | Always `"Form"` for screen SCM |
| `Properties` | RawComponent | Root Form component and all children |
| `authURL` | string[] | Platform/creator tag — stored and round-tripped as-is |

**RawComponent structure (recursive):**
```json
{
  "$Name": "Screen1",
  "$Type": "Form",
  "$Version": 1,
  "Uuid": "",
  "Title": "Screen1",
  "BackgroundColor": "&HFFFFFFFF",
  "$Components": [
    {
      "$Name": "Button1",
      "$Type": "Button",
      "$Version": 1,
      "Uuid": "abc123",
      "Text": "Click Me",
      "$Components": []
    }
  ]
}
```

**RawComponent fields:**

| Field | Notes |
|---|---|
| `$Name` | Instance name |
| `$Type` | Short component class name (`Button`, `Label`, `Form`, etc.) |
| `$Version` | Component schema version integer |
| `Uuid` | Unique identifier — absent on the root Form/Screen |
| `$Components` | Array of child RawComponent objects |
| All other keys | Property values as raw strings (e.g. `"BackgroundColor": "&HFFFFFFFF"`) |

---

### BKY Files (`*.bky`)

One BKY file per screen. Standard Blockly XML format with App Inventor-specific block types.

**File structure:**
```xml
<xml>
  <block type="component_event" id="abc" x="10" y="20">
    <mutation instance_name="Button1" event_name="Click" component_type="Button"/>
    <statement name="DO">
      <block type="component_set_property">
        <field name="COMPONENT_SELECTOR">Button1</field>
        <field name="PROPERTY_NAME">Text</field>
        <value name="VALUE">
          <block type="text">
            <field name="TEXT">Hello</field>
          </block>
        </value>
      </block>
    </statement>
  </block>
</xml>
```

An empty screen has an empty `<xml/>` tag — valid and common.

**App Inventor-specific block types:**

| Block type | Role | Key fields |
|---|---|---|
| `component_event` | Event handler | `<mutation instance_name event_name component_type/>` |
| `component_method` | Method call | `<mutation instance_name method_name component_type/>` |
| `component_get_property` | Property getter | `<field name="COMPONENT_SELECTOR">`, `<field name="PROPERTY_NAME">` |
| `component_set_property` | Property setter | Same as getter plus `<value name="VALUE">` |
| `component_set_get` | Combined set/get | — |
| `component_block` | Component reference | — |
| `global_declaration` | Global variable | `<field name="NAME">` |
| `lexical_variable_get` / `_set` | Local variable | — |
| `procedures_defnoreturn` / `defreturn` | Procedure definition | — |
| `procedures_callnoreturn` / `callreturn` | Procedure call | — |

Standard Blockly primitives (`math_number`, `text`, `logic_boolean`, `math_arithmetic`, `logic_compare`, `controls_if`, etc.) are also present.

---

### YAIL Files (`*.yail`)

Optional. One YAIL file per screen. A Kawa/Scheme dialect compiled from SCM + BKY.

**File structure:**
```scheme
#|
$Source $Yail
|#
(define-repl-form io.kodular.username.Test.Screen1 Screen1)
(require <com.google.youngandroid.runtime>)

;;; Screen1
(do-after-form-creation
  (set-and-coerce-property! 'Screen1 'Title "Screen1" 'text))

;;; Button1
(add-component Screen1 com.google.appinventor.components.runtime.Button Button1
  (set-and-coerce-property! 'Button1 'Text "Click Me" 'text))

(define-event Button1 Click ()
  (set-this-form)
  ...)

(init-runtime)
```

YAIL is treated as optional during parsing — if absent, it is regenerated from SCM + BKY by the YAIL generator. When writing, it is always produced.

---

## AIX — App Inventor Extension

An AIX file is a standard ZIP archive containing a compiled Android extension for App Inventor platforms.

**Important:** AIX files are not stored as ZIP-in-ZIP inside AIA files. When an extension is imported into a project, its contents are unpacked into `assets/external_comps/<package-name>/` within the AIA.

### ZIP Directory Structure

```
com.example.MyExtension/        (top-level directory = package name)
├── component.json               (single-component) — or —
├── components.json              (extension pack, array)
├── component_build_info.json    (single-component) — or —
├── component_build_infos.json   (extension pack, array)
├── classes.jar
├── AndroidRuntime.jar           (not always present in newer AIX)
├── AndroidManifest.xml
└── assets/                      (optional — extension's own assets, icons, etc.)
    └── images/
        └── icon.png
```

---

### Component Descriptor (`component.json` / `components.json`)

The component descriptor defines all properties, events, and methods the extension exposes to the block editor and runtime.

**Single component:** `component.json` — a JSON object.
**Extension pack:** `components.json` — a JSON array of objects.

**Full descriptor shape:**
```json
{
  "type": "com.example.MyExtension",
  "name": "MyExtension",
  "external": "true",
  "version": "1",
  "dateBuilt": "2024-01-01T00:00:00+0000",
  "categoryString": "EXTENSION",
  "helpString": "HTML description of the extension",
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
      "propertyType": "common"       (Kodular only — "common" | "advanced"; absent in MIT)
    }
  ],
  "blockProperties": [
    {
      "name": "MyProp",
      "description": "...",
      "type": "text",                 ("text" | "number" | "boolean" | "list" | "component" | "any")
      "rw": "read-write",             ("read-only" | "write-only" | "read-write" | "invisible")
      "deprecated": "false"           (string boolean, not JSON boolean)
    }
  ],
  "events": [
    {
      "name": "MyEvent",
      "description": "...",
      "deprecated": "false",
      "params": [
        { "name": "result", "type": "text" }
      ]
    }
  ],
  "methods": [
    {
      "name": "DoSomething",
      "description": "...",
      "deprecated": "false",
      "params": [],
      "returnType": "text"            (absent for void methods)
    }
  ]
}
```

**Quirks:**
- `external` is always the string `"true"` for extension components — not a JSON boolean.
- `deprecated` fields throughout are string booleans (`"true"` / `"false"`).
- `propertyType` is Kodular Creator-specific and absent in MIT App Inventor descriptors.
- Built-in platform components (from `simple_components.json`) use the same schema with `"external": "false"`.

---

### Build Info (`component_build_info.json` / `component_build_infos.json`)

Used internally by the App Inventor build server. Not required for descriptor resolution.

```json
{
  "type": "com.example.MyExtension",
  "metadata": []
}
```

- Single component: `component_build_info.json` — JSON object.
- Extension pack: `component_build_infos.json` — JSON array.
- Array index in `component_build_infos.json` corresponds to array index in `components.json`.

The `metadata` field shape is unspecified and treated as opaque.

---

### Binary Files

| File | Role |
|---|---|
| `classes.jar` | Compiled Dalvik/ART bytecode — merged into APK DEX during build |
| `AndroidRuntime.jar` | App Inventor runtime API stubs used at compile time — not bundled into APK; not always present in newer AIX |
| `AndroidManifest.xml` | Android permissions, activities, services, receivers declared by the extension — merged into the host app manifest during APK build |

These files are not read by aia-kit for descriptor resolution. They are preserved during AIA round-trip via lazy loading.

---

### Extension Packs

An extension pack bundles multiple components into a single AIX. Detection is by filename — there is no versioning header:

| Filename | Meaning |
|---|---|
| `component.json` | Single component |
| `components.json` | Multiple components (pack) |
| `component_build_info.json` | Single build info |
| `component_build_infos.json` | Multiple build infos (pack) |

Array entries in `components.json` and `component_build_infos.json` are correlated by index position — they must stay in the same order.

---

## Known Gaps in v1 Writer

The v1 writer only writes the component descriptor JSON back into the AIA. Binary files (`classes.jar`, `AndroidRuntime.jar`, `AndroidManifest.xml`) and extension assets are not re-written — they must be present in the original AIA to survive a read/write round-trip. v2 addresses this via lazy-loaded `loadClasses()` and `loadAssets()` on `AiaExtension`.

---

## Uncertainty Flags

The following are inferred from the codebase but not exhaustively verified against official specs:

- The full set of valid `project.properties` keys beyond the six documented above — additional keys (`icon`, `useslocation`, etc.) may exist.
- The `authURL` field in SCM files — stored and round-tripped as-is; exact semantics not documented.
- Whether YAIL is present in AIA files exported from current MIT App Inventor — treated as optional.
- Whether `AndroidRuntime.jar` is always present in AIX files or only in older formats.
- The exact `AndroidManifest.xml` element structure inside AIX files.
- The exact shape of `component_build_info.json`'s `metadata` array.
