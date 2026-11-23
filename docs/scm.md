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

**aia-kit** extracts JSON with a regex matching the `$JSON` region (see [`parseScm`](../src/formats/scm.ts)).

---

## JSON envelope

Typical top-level keys (see [aia.md § SCM](aia.md#scm-files-scm)):

| Field | Meaning |
|-------|---------|
| **`YaVersion`** | Young Android / designer schema version string. |
| **`Source`** | Screen SCM uses **`"Form"`**. |
| **`Properties`** | Root **RawComponent** — the Form node with nested **`$Components`**. |
| **`authURL`** | Optional tag array (platform/creator). Preserved on round-trip even when not interpreted. |

Additional keys may appear in real AIAs. Every key other than **`Properties`** is kept in **`Screen.meta.form`** and written back.

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

**aia-kit** maps this to **`Component`**: `name`, `type`, `version`, `uuid`, `properties` (string map), `children`. Values that are not strings, and unrecognised `$` keys, are kept in `extra` so nothing is lost.

---

## Types and descriptors

A **`Component`** carries only what the file says. To learn what a type offers (properties, events, methods, its full Java class name), look it up in a platform: **`lookupComponent(component.type, platform, project)`** from `aia-kit/platforms`.

---

## aia-kit APIs

| Piece | Location |
|-------|----------|
| A screen's tree | **`Screen.form`** |
| Find / walk | **`findComponent`**, **`findParent`**, **`walkComponents`** — [`src/query.ts`](../src/query.ts) |
| Edit | **`addComponent`**, **`removeComponent`**, **`renameComponent`**, **`moveComponent`**, **`setProperty`** — [`src/edit/components.ts`](../src/edit/components.ts) |
| Loose files | **`parseScm`**, **`serializeScm`** from `aia-kit/formats` — [`src/formats/scm.ts`](../src/formats/scm.ts) |

---

## Further reading

| Topic | Where |
|-------|--------|
| Block programs | [BKY](bky.md) |
| Intermediate language | [YAIL](yail.md) |
| MIT sources (designer + build pipeline) | [App Inventor sources](https://github.com/mit-cml/appinventor-sources) |

Canonical glossary: [Ubiquitous language — SCM](ubiquitous-language.md#file-formats).
