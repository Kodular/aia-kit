# YAIL — Young Android Intermediate Language

This document explains what YAIL is, how it relates to AIA screens (SCM + BKY), and where to learn more in MIT’s open-source tree. For ZIP layout and a minimal example file, see [AIA reference — YAIL](aia.md#yail-files-yail).

---

## Names and role

**YAIL** is the textual intermediate language App Inventor–family tools generate from a screen’s **component tree** (`*.scm`) and **blocks** (`*.bky`). MIT documentation and source comments refer to it as **Young Android Intermediate Language**. Some materials (including earlier App Inventor blog posts) use **Yet Another Intermediate Language** as the expansion — both refer to the same Scheme-like layer.

YAIL is **not** the blocks XML and **not** the designer JSON inside SCM; it is the **lowered** representation used by the runtime on the path to execution.

---

## Execution model (MIT App Inventor family)

At a high level (as described in public MIT/community explanations):

- **Live development:** Blockly programs are translated into YAIL and run on the device inside the **Companion**, using a **Kawa**-based Scheme interpreter on the JVM, which bridges to Android APIs.
- **Packaged apps:** The runtime plus YAIL program participates in the normal Android build (compilation to bytecode / DEX), rather than staying as a loose `.yail` file on the phone.

So `.yail` files in an **AIA archive** are a **persisted** view of that intermediate form for each screen; they may be absent in some exports and regenerated when building or loading.

Primary references:

- [MIT `appinventor-sources` repository](https://github.com/mit-cml/appinventor-sources) — full compiler and runtime.
- [`runtime.scm` — Young Android runtime macros](https://github.com/mit-cml/appinventor-sources/blob/master/appinventor/buildserver/src/com/google/appinventor/buildserver/resources/runtime.scm) — defines forms such as `define-repl-form`, `define-form-internal`, registration of components/events/globals, and `(require <com.google.youngandroid.runtime>)`.
- Historical context on choosing Scheme/YAIL and live programming: [Hal Abelson’s blog — live programming in App Inventor](https://furious-ideas.blogspot.com/2014/08/the-creation-of-live-programming-in-app.html).
- Community summary of blocks → YAIL → Companion: [Google Groups — “what computer programming language…”](https://groups.google.com/g/mitappinventortest/c/cMkhyGqvFFA/m/vuFOvdnJ4x4J).

---

## Typical shape of a screen `.yail` file

The following pieces appear repeatedly in generated screens (see example in [aia.md](aia.md#yail-files-yail)):

| Form | Purpose |
|------|---------|
| `#\| … $\|#` header | Source marker (e.g. `$Source $Yail`). |
| `(define-repl-form <qualified-class> <form-symbol>)` | Associates the screen’s JVM-qualified class (derived from `project.properties` `main` and the screen name) with the Scheme-level form symbol. **`define-repl-form`** is a macro that expands to `define-form-internal` with the **`ReplForm`** path used for interactive Companion execution ([`runtime.scm`](https://github.com/mit-cml/appinventor-sources/blob/master/appinventor/buildserver/src/com/google/appinventor/buildserver/resources/runtime.scm)). Packaged apps may use **`define-form`** instead in some flows — Companion-oriented projects favor **`define-repl-form`**. |
| `(require <com.google.youngandroid.runtime>)` | Loads the Young Android runtime module that implements `add-component`, `define-event`, property coercion helpers, etc. |
| `(do-after-form-creation …)` | Deferred initialization once the form exists — commonly **`set-and-coerce-property!`** on the root **Form**. |
| `(add-component <parent-symbol> <java-class> <instance-symbol> …)` | Creates a component instance under a parent; nesting mirrors the SCM tree. **`java-class`** is typically a fully qualified type such as `com.google.appinventor.components.runtime.Button`. |
| `(set-and-coerce-property! '<component> '<property> <value-expr> '<coercion>)` | Sets a property with an explicit coercion tag (e.g. `'text`, `'number`, `'boolean`). |
| `(define-event <instance> <EventName> (<params>) …)` | Event handlers lowered from blocks; bodies often include `(set-this-form)` where the runtime expects it. |
| `(init-runtime)` | Final runtime bootstrap for the screen file. |

The macros in `runtime.scm` compile down to data structures (e.g. lists of components to create, events to register, thunks for “after creation”) that the generated Java/Kawa layer consumes when the screen class is built.

---

## Mapping SCM types to Java classes

- SCM **`$Type`** stores short names (`Button`, `Form`, …).
- YAIL **`add-component`** uses the **runtime Java class** for that component, usually under **`com.google.appinventor.components.runtime.*`**.

In **aia-kit**, resolved **`ComponentDescriptor.type`** values in environment JSON already carry those fully qualified names where applicable, which is what a generator should emit in YAIL.

**Extensions** use their own qualified classes from the extension descriptor / AIX metadata (see [AIX](aix.md)).

---

## Blockly → YAIL (MIT sources)

The production Blockly-to-YAIL logic lives in MIT’s repo under the blockly editor, for example:

- [Blockly generators directory](https://github.com/mit-cml/appinventor-sources/tree/master/appinventor/blocklyeditor/src/generators) — includes **`yail.js`** and supporting **`yail/`** modules.

Anyone implementing a compatible emitter outside MIT’s codebase should treat that tree as the ground truth for edge cases and block coverage.

---

## Kodular and other forks

Kodular (and similar forks) generally share the same **AIA layout**, **`com.google.youngandroid.runtime`** module name, and the same **macro vocabulary** (`add-component`, `define-event`, …). Differences show up in **extra components**, **properties**, and **block types**, which can change the exact YAIL emitted for the same high-level intent.

For **aia-kit**, parity with every fork-specific block is explicitly non-goals for early milestones; see the [M2c YAIL generation plan](superpowers/plans/2026-05-02-aia-kit-v2-m2c-yail-generation.md).

---

## Further reading

| Topic | Link |
|--------|------|
| MIT App Inventor sources | https://github.com/mit-cml/appinventor-sources |
| Modified Kawa used by MIT | https://github.com/mit-cml/ai2-kawa |
| Overview blog (sources/components) | https://appinventor.mit.edu/blogs/evan/2023/04/10/overview-app-inventor-sources-components |
| Community thread on YAIL documentation | https://community.appinventor.mit.edu/t/yail-companion-documentation/28875 |

---

## aia-kit usage

- **Parse:** `*.yail` is optional in the ZIP; when present it is stored on `AiaScreen.yail`.
- **Write:** See [write pipeline](../src/write.ts); optional regeneration when `yail` is missing is planned in [M2c](superpowers/plans/2026-05-02-aia-kit-v2-m2c-yail-generation.md).

Canonical glossary entry: [Ubiquitous language — YAIL](ubiquitous-language.md#file-formats).
