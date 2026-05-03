# AIS — App Inventor single-screen export

**AIS** is a **single-screen** export format used in App Inventor–family tooling. It is a **subset** of what appears inside a full **AIA**: essentially one screen’s sources plus the minimal project scaffolding needed to treat it as a self-contained unit.

There is **no** separate binary magic — AIS files discussed in ecosystem docs are typically still **ZIP-based**, like AIA, but with **one** logical screen (one `.scm` / `.bky` / optional `.yail` trio under `src/…`) and often reduced or empty `assets/` compared to a multi-screen app.

---

## Typical contents

Conceptually aligned with [AIA layout](aia.md):

- **`youngandroidproject/project.properties`** — `main` usually references that single screen’s qualified class.
- **`src/<package/path>/<Screen>.scm`**, **`.bky`**, optional **`.yail`**
- **`assets/`** — optional media; **`external_comps/`** only if the screen depends on extensions.

Screen file semantics are identical to [SCM](scm.md), [BKY](bky.md), and [YAIL](yail.md).

---

## Relationship to AIA

| | AIA | AIS |
|---|-----|-----|
| Screens | One or many | One primary screen |
| Use case | Whole app project | Share / import one screen, tutorials, snippets |

A conforming AIS can often be **merged** into an AIA (for example by copying files and adjusting `project.properties`) — exact UX depends on the platform exporter.

---

## aia-kit

The library’s **`readAia`** pipeline targets the **same ZIP conventions** as multi-screen AIAs. A minimal AIS that follows those conventions can be read as an **`AiaProject`** with a single screen entry.

There is **no separate `parseAis` entry point** in the current API surface; treat AIS as **AIA-shaped** unless/until a dedicated helper is added.

---

## See also

| Topic | Document |
|-------|-----------|
| Multi-screen project ZIP | [AIA](aia.md) |
| Glossary | [Ubiquitous language — AIS](ubiquitous-language.md#file-formats) |
