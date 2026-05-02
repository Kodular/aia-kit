# App Inventor file formats

Reference hub for archive and screen-level formats that **aia-kit** reads and writes. Detailed tables and examples live in the linked documents.

---

## Project archives

| Format | Description | Document |
|--------|-------------|----------|
| **AIA** | Multi-screen App Inventor project (ZIP) | [aia.md](aia.md) |
| **AIX** | Compiled extension package (ZIP) | [aix.md](aix.md) |
| **AIS** | Single-screen export (AIA-shaped subset) | [ais.md](ais.md) |

---

## Files inside an AIA (per screen)

| Extension | Role | Deep dive |
|-----------|------|-----------|
| **`.scm`** | Designer component tree (JSON in comment) | [scm.md](scm.md) · [reference in AIA](aia.md#scm-files-scm) |
| **`.bky`** | Blockly program XML | [bky.md](bky.md) · [reference in AIA](aia.md#bky-files-bky) |
| **`.yail`** | Optional YAIL intermediate | [yail.md](yail.md) · [reference in AIA](aia.md#yail-files-yail) |

---

## Quick links

- **Project metadata & ZIP layout:** [AIA — directory structure](aia.md#zip-directory-structure)
- **`project.properties` keys:** [AIA — project.properties](aia.md#projectproperties)
- **Bundled extensions:** [AIA assets](aia.md#assets) · [AIX layout](aix.md#zip-directory-structure-single-component)
- **Extension packs:** [AIX — extension packs](aix.md#extension-packs)
- **Writer round-trip:** [AIA — writer notes](aia.md#writer-round-trip-notes)

---

## Ubiquitous language

Canonical names and pipeline terms: [ubiquitous-language.md](ubiquitous-language.md).
