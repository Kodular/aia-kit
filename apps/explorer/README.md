# AIA Explorer

Browse an App Inventor / Kodular project in the browser: screens, component tree, a schematic layout preview, blocks as an outline, assets, extensions, project properties, navigation between screens, and the problems `check` finds.

Files are read locally with `aia-kit`; nothing is uploaded. The app is read-only.

```
pnpm explorer                              # from the repo root: dev server
pnpm --filter @aia-kit/explorer build      # static build in apps/explorer/dist
```

Stack: Vite 8, Solid 2, Tailwind 4.
