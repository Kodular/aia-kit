# aia-kit

Read, inspect, edit, check and write App Inventor / Kodular projects (`.aia`) and extensions (`.aix`). Works in browsers and Node.

```
pnpm add aia-kit
```

## Quick start

```typescript
import { readAia, writeAia, renameComponent, setProperty, addAsset } from "aia-kit";

const { project } = await readAia(aiaBlob);

project.screens[0].form.children; // designer components
project.screens[0].blocks;        // Blockly blocks

let next = renameComponent(project, "Screen1", "Button1", "SubmitButton"); // blocks follow
next = setProperty(next, "Screen1", "SubmitButton", "Text", "Send");
next = addAsset(next, "logo.png", pngBlob);

const out = await writeAia(next); // Blob
```

## How it works

- **A project is plain immutable data.** `Project` → `Screen` → `Component` / `Block`. Log it, diff it, keep it in UI state.
- **Edits are functions** that take a project and return a new one. The original is never changed, and untouched parts are shared.
- **Edits keep the project consistent.** Renaming a component rewrites the blocks that use it; renaming a screen updates `main` and the blocks that open it.
- **Nothing is lost.** Reading then writing reproduces every file byte-for-byte. After an edit, only the files you touched are re-serialized, and unknown fields survive.
- **Failures are explicit.** An edit that cannot be done throws an `AiaKitError` subclass. Findings about the data are returned as `Problem[]`.

## Checking a project

```typescript
import { check } from "aia-kit";
import { loadPlatform } from "aia-kit/platforms";

const kodular = await loadPlatform("kodular"); // or "app-inventor"

for (const problem of check(project, kodular)) {
  if (problem.code === "missing-asset") console.warn(problem.asset, "is missing");
  else console.warn(problem.message);
}
```

`check` also flags values that look like embedded API keys, tokens or passwords.

A platform is only needed for checks that depend on which components exist. Reading, editing and writing never need one.

## Entry points

| Import | Contents |
|--------|----------|
| `aia-kit` | `readAia`, `writeAia`, `readAix`, `writeAix`, the data types, queries, edits, `check`, errors |
| `aia-kit/platforms` | `loadPlatform`, `definePlatform`, `lookupComponent` |
| `aia-kit/analysis` | `diffProjects`, unused assets / extensions, block summaries, navigation graph |
| `aia-kit/formats` | `parseScm`, `parseBky`, `parseProperties` and their serializers, for loose files |

## Documentation

- [Usage guide](docs/usage.md)
- [API reference](docs/api.md)
- [File formats](docs/file-formats.md) · [Glossary](docs/ubiquitous-language.md)

## Explorer

`apps/explorer` is a web app for browsing a project: its screens, component tree, blocks, assets, extensions and problems. It runs entirely in the browser.

```
pnpm explorer
```

## Not included

YAIL generation. An existing `.yail` is preserved while its screen is unchanged; App Inventor regenerates YAIL when it opens or builds a project.

## Development

Tool versions are pinned in `mise.toml`.

```
mise install
pnpm install
pnpm check    # typecheck + lint + format check + tests
pnpm build
```

## Releasing

Releases are published by `.github/workflows/release.yml` when a version tag is pushed.

1. Set the new `version` in `package.json` and merge that to `main`.
2. Tag that commit and push the tag:

   ```
   git tag v2.0.1
   git push origin v2.0.1
   ```

The workflow checks that the tag matches `package.json` and is on `main`, runs `pnpm check`, publishes to npm with provenance, and creates the GitHub release with generated notes. A version with a hyphen, such as `2.1.0-beta.1`, is published under the `next` tag and marked as a pre-release.

It signs in to npm through trusted publishing, so no token is stored. That is configured once on npmjs.com, in the package's settings, by adding this repository and `release.yml` as a trusted publisher.

## License

ISC
