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

| Raw key | TypeScript field | Type | Example | Notes |
|---------|-----------------|------|---------|-------|
| `main` | `main` | `string` | `appinventor.ai_user.MyApp.Screen1` | Fully-qualified first screen class. The package path under `src/` is derived from this by dropping the last segment (e.g. `appinventor/ai_user/MyApp`). |
| `name` | `name` | `string` | `MyApp` | Short project name. Falls back to `aname` if absent. |
| `aname` | `appName` | `string` (optional) | `My App` | Display name shown on device. |
| `versioncode` | `versionCode` | `integer` | `1` | Integer build number. Defaults to `1` if missing or non-numeric. |
| `versionname` | `versionName` | `string` | `1.0` | Human-readable version string. |
| `sizing` | `sizing` | `"Fixed" \| "Responsive"` (optional) | `Responsive` | Screen sizing mode. Omitted from `ProjectProperties` if value is not exactly `Fixed` or `Responsive`. |
| `theme` | `theme` | `string` (optional) | `AppTheme.Light.DarkActionBar` | Android theme name. |
| `color.primary` | `colorPrimary` | `string` (optional) | `&HFF6200EE` | App primary color in ARGB hex (`&H` prefix). |
| `color.primary.dark` | `colorPrimaryDark` | `string` (optional) | `&HFF3700B3` | App primary dark color. |
| `color.accent` | `colorAccent` | `string` (optional) | `&HFF03DAC5` | App accent color. |
| `showlistsasjsonarray` | `showListsAsJsonArray` | `boolean` (optional) | `true` | Controls list serialization behavior. |
| `actionbar` | `actionBar` | `boolean` (optional) | `true` | Whether to show the action bar. |

---

## Unknown keys

Real AIA files may contain additional keys not listed above (e.g. `source`, `authURL`, `defaultfilescope`, `minSdk`, platform-specific theme variants). These are collected into `ProjectProperties.unknown: Record<string, string>` and **round-tripped faithfully** — they are not interpreted or validated, but will be preserved on write.

---

## Example file

```properties
main=appinventor.ai_user.MyApp.Screen1
name=MyApp
aname=My App
versioncode=1
versionname=1.0
sizing=Responsive
theme=AppTheme.Light.DarkActionBar
color.primary=&HFF6200EE
color.primary.dark=&HFF3700B3
color.accent=&HFF03DAC5
showlistsasjsonarray=true
actionbar=true
```

---

## aia-kit APIs

| Operation | Function | Source |
|-----------|----------|--------|
| Parse raw key-value map → `ProjectProperties` | `parseProjectProperties()` | [`src/parse.ts`](../src/parse.ts) |
| Serialize `ProjectProperties` → file text | `serializeProperties()` | [`src/write.ts`](../src/write.ts) |

The raw file text is parsed with the `properties-file` npm package before being passed to `parseProjectProperties`. On write, `serializeProperties` emits known keys first (in a fixed order), then appends all `unknown` entries.

---

## TypeScript type

```typescript
interface ProjectProperties {
  main: string
  name: string
  versionCode: number
  versionName: string
  appName?: string
  sizing?: 'Fixed' | 'Responsive'
  theme?: string
  colorPrimary?: string
  colorPrimaryDark?: string
  colorAccent?: string
  showListsAsJsonArray?: boolean
  actionBar?: boolean
  /** All other key-value pairs not explicitly modelled above */
  unknown: Record<string, string>
}
```

Defined in [`src/core/types.ts`](../src/core/types.ts).

---

## See also

| Topic | Document |
|-------|---------|
| ZIP layout overview | [AIA](aia.md) |
| Platform component metadata | [simple-components-json.md](simple-components-json.md) |
| Glossary | [Ubiquitous language](ubiquitous-language.md) |
