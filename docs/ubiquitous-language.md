# aia-kit — Ubiquitous Language

This document defines the canonical terms used throughout aia-kit's codebase, documentation, and API. When in doubt, prefer these terms over synonyms.

---

## File Formats

**AIA**
The project archive format used by App Inventor platforms. A ZIP file containing screens, assets, extensions, and project metadata. Stands for _App Inventor Archive_. See [aia.md](aia.md).

**AIX**
The extension package format. A ZIP file containing component descriptors, compiled code, assets, and an Android manifest. Stands for _App Inventor Extension_. See [aix.md](aix.md).

**AIS**
A single-screen export format — AIA-shaped subset focused on one screen’s SCM/BKY (and optional YAIL). See [ais.md](ais.md).

**SCM**
The component definition file for a screen. A JSON document describing the component tree — types, names, UIDs, and property values — embedded in a `#| $JSON … |#` wrapper. One SCM file per screen (e.g., `Screen1.scm`). See [SCM](scm.md).

**BKY**
The block definition file for a screen. An XML document (Blockly format) describing all event handlers, procedures, and logic blocks. One BKY file per screen (e.g., `Screen1.bky`). See [BKY](bky.md).

**YAIL**
The intermediate textual format (Scheme-like, typically interpreted by **Kawa** in the Companion) generated from a screen's SCM + BKY. MIT sources expand the acronym as **Young Android Intermediate Language**; **Yet Another Intermediate Language** appears in older/community writing — both names refer to the same layer. See [YAIL](yail.md).

---

## Data model

**Project**
The content of an AIA: properties, screens, assets, extensions, and any other archive files. Plain immutable data.

**Screen**
One screen: its name, its **form** (designer tree), its **blocks**, and file-level metadata.

**Form**
The root component of a screen. Its name always equals the screen's name.

**Component**
A node of the designer tree: name, type, version, uuid, properties, children. Property values are strings, exactly as App Inventor encodes them (`"True"`, `"18"`, `"&HFF0000FF"`).

**Block**
A Blockly block. Nested blocks hang off `values` (expression inputs), `statements` (the first block of a nested stack) and `next` (the block attached below).

**Component block**
A block tied to a component: an event handler, method call, property getter/setter, or component value. Decoded by `componentReference`.

**Asset**
A media file bundled in the project: a name and a `Blob`.

**Extension**
A third-party component package: its package name, the component descriptors it provides, and all of its files.

**Other files**
Archive entries aia-kit does not model, or could not read. Carried along so that writing a project never drops data.

---

## Platforms

**Platform**
The set of built-in components of one App Inventor distribution (MIT App Inventor, Kodular Creator). Needed only to answer "does this component / property exist?".

**Component descriptor**
The description of one component type: its properties, block properties, events and methods. Comes from a platform's `simple_components.json` or an extension's `components.json`.

**Simple name / qualified type**
A component type appears in screen files and blocks by simple name (`Button`, `Look`), including for extension components as MIT App Inventor writes them; descriptors identify types by fully qualified class name (`edu.mit.appinventor.ai.look.Look`). `lookupComponent` and the extension-usage functions accept both.

---

## Operations

**Read / write**
The archive boundary: `readAia`, `readAix`, `writeAia`, `writeAix`. The only asynchronous operations.

**Edit**
A function from a project to a new project (`renameComponent`, `addScreen`, …). Edits keep the designer tree, blocks and properties consistent with each other, and throw when they cannot.

**Check**
A read-only pass that returns **problems**.

**Problem**
A finding about a project's data, identified by a `code`, with a severity and a message. Problems are values; they are never thrown.

**Error**
A thrown `AiaKitError`: the input is unusable, or an edit was asked to do something impossible.

---

## Guarantees

**Round-trip fidelity**
`writeAia((await readAia(x)).project)` reproduces every file of `x` byte-for-byte.

**Lossless edits**
After an edit, only the files it touched are re-serialized, and fields aia-kit does not model survive in `extra` / `meta`.

**Structural sharing**
An edit returns a new project that shares every part it did not change. An edit that changes nothing returns the same object.
