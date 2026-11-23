# `project.properties` — AIA project metadata

The file `youngandroidproject/project.properties` is the canonical metadata entry inside every **AIA** ZIP. It is a Java **`.properties`** file: UTF-8 encoded, one `key=value` pair per line, no section headers.

**ZIP context:** [AIA — directory structure](aia.md#zip-directory-structure) · [AIA — project.properties](aia.md#projectproperties)

---

## Location

```
youngandroidproject/
└── project.properties    ← this file
```

---

## Field reference

| Raw key | `ProjectProperties` field | Type | Example |
|---------|---------------------------|------|---------|
| `main` | `main` | `string` | `appinventor.ai_user.MyApp.Screen1` |
| `name` | `name` | `string` | `MyApp` |
| `versioncode` | `versionCode` | `number` | `1` |
| `versionname` | `versionName` | `string` | `1.0` |
| `useslocation` | `usesLocation` | `boolean` | `False` |
| `aname` | `appName` | `string` | `My App` |
| `icon` | `icon` | `string` | `logo.png` |
| `sizing` | `sizing` | `string` | `Responsive` |
| `showlistsasjson` | `showListsAsJson` | `boolean` | `True` |
| `actionbar` | `actionBar` | `boolean` | `True` |
| `theme` | `theme` | `string` | `AppTheme.Light.DarkActionBar` |
| `color.primary` | `primaryColor` | `string` | `&HFF6200EE` |
| `color.primary.dark` | `primaryColorDark` | `string` | `&HFF3700B3` |
| `color.accent` | `accentColor` | `string` | `&HFF03DAC5` |
| `defaultfilescope` | `defaultFileScope` | `string` | `App` |

`main` is required. The package path under `src/` is `main` without its last segment. `name` falls back to the project segment of `main`. Every field except `main` and `name` is optional and absent when the file has no such key.

Booleans are read case-insensitively and written as `True` / `False`. A value that does not parse as its type (for example `versioncode=abc`) stays in `extra` instead of being dropped.

---

## Other keys

Every other key — `assets`, `source`, `build`, and platform-specific ones — is kept verbatim in `ProjectProperties.extra` and written back.

---

## Example file

```properties
main=appinventor.ai_user.MyApp.Screen1
name=MyApp
assets=../assets
source=../src
build=../build
versioncode=1
versionname=1.0
useslocation=False
aname=My App
sizing=Responsive
showlistsasjson=True
actionbar=True
theme=AppTheme.Light.DarkActionBar
color.primary=&HFF6200EE
color.primary.dark=&HFF3700B3
color.accent=&HFF03DAC5
```

---

## aia-kit APIs

| Operation | Function |
|-----------|----------|
| Read from a project | `project.properties` |
| Change | `setProjectProperties(project, changes)` |
| Loose file text ⇄ `ProjectProperties` | `parseProperties`, `serializeProperties` from `aia-kit/formats` — [`src/formats/properties.ts`](../src/formats/properties.ts) |

The Java `.properties` syntax (escapes, `=` / `:` separators, continuations, comments) is handled by aia-kit itself. Unchanged properties are written back as their original text; changed ones are written in App Inventor's key order, followed by the remaining `extra` keys.

---

## See also

| Topic | Document |
|-------|---------|
| ZIP layout overview | [AIA](aia.md) |
| Platform component metadata | [simple-components-json.md](simple-components-json.md) |
| Glossary | [Ubiquitous language](ubiquitous-language.md) |
