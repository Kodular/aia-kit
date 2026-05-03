# SCM — Screen component metadata

This document describes the **`.scm`** screen file: JSON describing the **Visual Designer** component tree, wrapped in a block comment. For field tables and a minimal example, see [AIA reference — SCM](aia.md#scm-files-scm).

---

## Role in the project

Each screen has **one SCM file** that captures:

- The root **Form** (screen) and its hierarchy of visible and non-visible components.
- **Designer property values** as strings (colors, text, layout numbers, asset names, etc.).
- Per-instance **`Uuid`** values used by the runtime and editor.

| Concern | File |
|--------|------|
| **Component tree & properties** | `*.scm` |
| Block program | `*.bky` |
| Optional compiled intermediate | `*.yail` |

SCM does **not** contain blocks logic — only structure and property bags for the designer.

---

## Why the `#| … |#` wrapper

The file looks like a **Scheme block comment** enclosing a **`$JSON`** payload. That mirrors **Young Android** history: designer data was embedded in a textual pipeline related to Scheme/YAIL tooling. Today it is effectively **JSON-in-comment**; creators ignore the Scheme angle for most practical edits.

**aia-kit** extracts JSON with a regex matching the `$JSON` region (see [`parseScm`](../src/scm/parse.ts)).

---

## JSON envelope

Typical top-level keys (see [aia.md § SCM](aia.md#scm-files-scm)):

| Field | Meaning |
|-------|---------|
| **`YaVersion`** | Young Android / designer schema version string. |
| **`Source`** | Screen SCM uses **`"Form"`**. |
| **`Properties`** | Root **RawComponent** — the Form node with nested **`$Components`**. |
| **`authURL`** | Optional tag array (platform/creator). Preserved on round-trip even when not interpreted. |

Additional keys may appear in real AIAs. **`serializeScm`** parses the full wrapper JSON, replaces only **`Properties`** with the updated tree, and re-stringifies — so **`YaVersion`**, **`Source`**, **`authURL`**, and other top-level keys round-trip together with the wrapper (property value fidelity inside components follows **`parseScm`** string rules; see comment in [`serialize.ts`](../src/scm/serialize.ts)).

---

## Raw component shape (`Properties` tree)

Recursive objects use MIT naming conventions:

| Key | Meaning |
|-----|---------|
| **`$Name`** | Instance name (`Screen1`, `Button1`, …) — referenced from **BKY** blocks. |
| **`$Type`** | Short type (`Form`, `Button`, …), **not** always the full Java class. |
| **`Uuid`** | String uid for the instance (may be empty on some roots depending on export). |
| **`$Version`** | Optional integer component-version marker. |
| **`$Components`** | Child array; **`[]`** if leaf. |
| **Other keys** | Property values as JSON primitives or strings (e.g. **`"&HFFFFFFFF"`** for colors). |

**aia-kit** maps this to **`AiaComponent`**: `name`, `type`, `uid`, `properties` (flat string map), `children`.

---

## Resolution vs raw

- **`parseScm`** → **`AiaComponent`** — unvalidated strings, no platform descriptors.
- **`buildModel(project, environment)`** → **`ModelComponent`** — attaches **`ComponentDescriptor`**, typed **`ComponentProperty`**, and diagnostics for unknown types/properties.

Full Java class names used in **YAIL** come from the **environment**, not from SCM **`$Type`** alone.

---

## aia-kit APIs

| Piece | Location |
|-------|-----------|
| Public SCM editor | **`ScmDocument`** — [`src/scm/index.ts`](../src/scm/index.ts) |
| Screen field | **`AiaScreen.scm`** (`string`) |
| Project fold-back | **`replaceScreenScm`** — [`src/aia/screens.ts`](../src/aia/screens.ts) |

`ScmDocument` parses SCM text, updates the local `AiaComponent` tree, then serialises back while preserving envelope metadata from the original string. Use `replaceScreenScm` to fold the edited SCM string back into an `AiaProject`.

---

## Further reading

| Topic | Where |
|-------|--------|
| Block programs | [BKY](bky.md) |
| Intermediate language | [YAIL](yail.md) |
| MIT sources (designer + build pipeline) | [App Inventor sources](https://github.com/mit-cml/appinventor-sources) |

Canonical glossary: [Ubiquitous language — SCM](ubiquitous-language.md#file-formats).
