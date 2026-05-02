# BKY — Blockly XML for a screen

This document describes the **`.bky`** screen file: Blockly’s persisted workspace XML, App Inventor–specific block types, and how **aia-kit** treats it. For a minimal XML example and block-type table, see [File formats — BKY](file-formats.md#bky-files-bkybky).

---

## Role in the project

Each screen has **one BKY file** that stores the entire **Blocks editor** program for that screen: event handlers, procedures, globals, and expressions.

| Concern | File |
|--------|------|
| Component layout & designer properties | `*.scm` |
| **Block program** (control flow, calls, literals) | `*.bky` |
| Optional compiled intermediate | `*.yail` |

The BKY document is the **canonical textual serialization** of the same tree you see as blocks in the browser — analogous to saving source code as text even though the UI is graphical ([discussion of BKY as source](https://groups.google.com/g/mitappinventortest/c/cMkhyGqvFFA/m/vuFOvdnJ4x4J)).

---

## Format at a glance

BKY is **XML** with a root **`<xml>`** element. Google Blockly expects a namespace on that root; **aia-kit**’s serializer emits:

```xml
<xml xmlns="https://developers.google.com/blockly/xml">
  ...
</xml>
```

Real exports may omit the xmlns or use slightly different casing; the parser accepts the standard Blockly shape (see [`parseBky`](../src/blocks/bky-parser.ts)).

### Block elements

Each **`<block>`** carries at least:

- **`type`** — Blockly type id (`component_event`, `text`, `math_number`, …).
- **`id`** — stable uuid used by the editor and mutations.

Top-level blocks often include **`x`** / **`y`** for workspace position.

Child markup includes:

| Element | Role |
|---------|------|
| **`<field name="...">`** | Fixed slots (text labels, dropdown selections). |
| **`<value name="...">`** | Expression inputs — contain another `<block>`. |
| **`<statement name="...">`** | Statement stacks — contain a nested `<block>` chain. |
| **`<mutation ... />`** | Extra structured parameters (common on App Inventor component blocks). |
| **`<next>`** | Horizontal chain to the next statement block at the same level. |

An **empty** screen typically uses **`<xml xmlns="..."></xml>`** or a self-closing equivalent — still valid.

---

## App Inventor vs generic Blockly

App Inventor forks extend Blockly with block types that encode **which component**, **which event or method**, and **which property**. Examples:

- **`component_event`** — `<mutation instance_name`, `event_name`, `component_type/>`.
- **`component_method`**, **`component_get_property`**, **`component_set_property`** — tie block slots to designer instances and metadata.

Standard Blockly math/logic/text/control blocks appear alongside these.

The **Blockly → YAIL** lowering logic in MIT’s codebase lives under the blockly editor (e.g. generators under [`appinventor/blocklyeditor/src/generators`](https://github.com/mit-cml/appinventor-sources/tree/master/appinventor/blocklyeditor/src/generators)). Third-party tools should treat that tree as the behaviour reference for edge cases.

---

## Relationship to SCM

Block mutations and fields reference **component instance names** (`Button1`, `Screen1`, …) that must match **`$Name`** entries in the screen’s **SCM**. Renaming or deleting components without updating blocks produces inconsistent projects.

---

## aia-kit representation and APIs

| Piece | Location |
|-------|-----------|
| In-memory AST | **`BlockAst`**, **`BlockNode`** — [`src/blocks/ast.ts`](../src/blocks/ast.ts) |
| Parse XML → AST | **`parseBky`** — [`src/blocks/bky-parser.ts`](../src/blocks/bky-parser.ts) |
| AST → XML | **`serializeBky`** — [`src/blocks/bky-serializer.ts`](../src/blocks/bky-serializer.ts) |
| Read/mutate via project | **Block lens** — **`queryBlocks`**, **`updateBlocks`**, **`updateAllScreenBlocks`**, **`parseBlocks`**, **`serializeBlocks`**, **`updateScreenBky`** — [`src/blocks/lens.ts`](../src/blocks/lens.ts) |
| Raw screen field | **`AiaScreen.bky`** (`string`) |

Parsing failures surface as **`MALFORMED_BKY`** when using higher-level helpers such as **`diagnose()`** (see [Analysis](file-formats.md)); **`parseBky`** itself throws on invalid XML.

---

## Further reading

| Topic | Where |
|-------|--------|
| Component tree files | [SCM](scm.md) |
| Intermediate language | [YAIL](yail.md) |
| Blockly XML format | [Blockly documentation — serialization](https://developers.google.com/blockly/guides/configure/web/serialization) |

Canonical glossary: [Ubiquitous language — BKY](ubiquitous-language.md#file-formats).
