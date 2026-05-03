# AIA — App Inventor Archive

An **AIA** file is a standard **ZIP** archive. It is the primary **multi-screen project** format for MIT App Inventor, Kodular Creator, and related tools.

**Related:** screen-level files — [SCM](scm.md), [BKY](bky.md), [YAIL](yail.md). Bundled extensions follow [AIX](aix.md) layout under `external_comps/`.

---

## ZIP directory structure

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
    └── com.example.MyExtension/ (→ see [AIX](aix.md))
        └── ...
```

**Structural rules:**

- `youngandroidproject/project.properties` is the canonical metadata location.
- Screen files live under `src/` with the package name as a directory path (dots → slashes).
- Assets are flat under `assets/` except `external_comps/`.
- Extension contents are unpacked (**not** ZIP-in-ZIP) into `assets/external_comps/<package-name>/`. Each subdirectory matches standalone [AIX](aix.md) layout.

---

## `project.properties`

A Java **`.properties`** file (UTF-8, `key=value` lines).

| Key | Example | Notes |
|-----|---------|-------|
| `name` | `Test` | Short project name |
| `aname` | `Test` | App display name on device |
| `main` | `io.kodular.username.Test.Screen1` | Fully-qualified first screen class |
| `minSdk` | `21` | Minimum Android SDK |
| `versioncode` | `1` | Integer build number |
| `versionname` | `1.0` | Human-readable version |

The package path under `src/` is derived from **`main`** by dropping the last segment (e.g. `io.kodular.username.Test`).

This table reflects keys **aia-kit** reads and writes. Real AIAs may add keys (`source`, `authURL`, `defaultfilescope`, themes, …); they should be **preserved** on round-trip even when not interpreted.

---

## SCM files (`*.scm`)

One SCM per screen: designer component tree as JSON inside `#| $JSON … |#`. Deep dive: **[SCM](scm.md)**.

**Structure:**

```
#|
$JSON
{"authURL":["aia-kit"],"YaVersion":"1","Source":"Form","Properties":{...}}
|#
```

Extract JSON with `/#\|\s*\$JSON\s*(.*?)\s*\|#/s` (see [`parseScm`](../src/scm/parse.ts)).

**Envelope fields:**

| Field | Type | Notes |
|-------|------|-------|
| `YaVersion` | string | Young Android schema version |
| `Source` | string | `"Form"` for screen SCM |
| `Properties` | RawComponent | Root Form + children |
| `authURL` | string[] | Platform tag — round-trip as-is |

**RawComponent (recursive):**

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

| Field | Notes |
|-------|-------|
| `$Name` | Instance name |
| `$Type` | Short type (`Button`, `Form`, …) |
| `$Version` | Schema version |
| `Uuid` | Instance id |
| `$Components` | Children |
| Other keys | Property values as strings |

---

## BKY files (`*.bky`)

One BKY per screen: Blockly XML + App Inventor block types. Deep dive: **[BKY](bky.md)**.

**Example:**

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

Empty workspace: `<xml/>` or equivalent — valid.

**Common App Inventor block types:**

| Block type | Role | Key fields |
|------------|------|------------|
| `component_event` | Event handler | `<mutation instance_name event_name component_type/>` |
| `component_method` | Method call | `<mutation instance_name method_name component_type/>` |
| `component_get_property` | Getter | `COMPONENT_SELECTOR`, `PROPERTY_NAME` |
| `component_set_property` | Setter | + `<value name="VALUE">` |
| `component_set_get` | Combined set/get | — |
| `component_component_block` | Component reference | — |
| `global_declaration` | Global | `<field name="NAME">` |
| `lexical_variable_get` / `_set` | Locals | — |
| `procedures_defnoreturn` / `defreturn` | Procedure def | — |
| `procedures_callnoreturn` / `callreturn` | Procedure call | — |

Plus standard Blockly primitives (`math_number`, `text`, `logic_boolean`, …).

---

## YAIL files (`*.yail`)

Optional per screen; Scheme-like intermediate from SCM + BKY. Deep dive: **[YAIL](yail.md)**.

**Example:**

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

Parsing treats missing YAIL as acceptable; some workflows regenerate it when building.

---

## Assets

Binaries under `assets/` — **only top-level files** count as project assets; `external_comps/` is separate.

---

## aia-kit APIs

| Stage | Entry |
|-------|--------|
| Read ZIP → raw model | **`readAia`** — [`src/aia/read-archive.ts`](../src/aia/read-archive.ts) |
| Enrich with descriptors | **`buildModel`** — [`src/model/index.ts`](../src/model/index.ts) |
| Write ZIP | **`writeAia`** — [`src/aia/write-archive.ts`](../src/aia/write-archive.ts) |

Extensions inside an AIA surface as **`AiaExtension`** (same shape as **`readAix`**).

---

## Writer round-trip notes

Older writer behaviour: only component descriptor JSON under `external_comps/` was guaranteed on write; **`classes.jar`**, **`AndroidRuntime.jar`**, **`AndroidManifest.xml`**, and extension assets had to remain from the source archive to survive round-trip. v2 models these via **`AiaExtension.loadClasses()`** and **`loadAssets()`** — see [AIX](aix.md).

---

## See also

| Topic | Document |
|-------|-----------|
| Single-screen export | [AIS](ais.md) |
| Standalone extension ZIP | [AIX](aix.md) |
| Glossary | [Ubiquitous language — AIA](ubiquitous-language.md#file-formats) |
