# AIA Explorer

Browse an App Inventor / Kodular project in the browser: screens, component tree, a schematic layout preview, blocks as an outline, assets, extensions, project properties, navigation between screens, and the problems `check` finds.

It also opens a standalone `.aix` extension and shows its components, events, methods, properties and files.

Files are read locally with `aia-kit`; nothing is uploaded. The app is read-only.

```
pnpm explorer                              # from the repo root: dev server
pnpm --filter @aia-kit/explorer build      # static build in apps/explorer/dist
```

Stack: Vite 8, Solid 2, Tailwind 4.

## Deployment

`.github/workflows/pages.yml` builds the app and publishes it to GitHub Pages on every push to `main` that touches the app or the library. Pages must be enabled for the repository with "GitHub Actions" as the source. The build is fully static.

## Structure

```
src/
  App.tsx          layout: top bar, project sidebar, main view, inspector (screens only), problems pane
  state.ts         app state and navigation (recorded in browser history, so Back and Forward work)
  components/
    ui/            primitives: Icon, Button, Tabs, Disclosure, ListRow, Card, PageHeader, Badge, KeyValue
    *.tsx          views, built from the primitives
  lib/             pure helpers: block labels, highlighting, formatting, icon choice
```

Build views from `components/ui` instead of writing buttons, rows or headings by hand. Icons come from the `lucide` package and render through `Icon`.
