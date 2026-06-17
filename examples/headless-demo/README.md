# Exemple — Démo headless

Démonstration **exécutable** (Node, sans device ni UI) de la chaîne headless du
`@media-studio/sdk` : projet + commandes built-in (undo/redo), licence et gating,
catalogue de filtres, transport runtime, et export en arrière-plan (JobQueue +
`ExportRenderer` avec encodeur natif **simulé**).

## Lancer

```bash
pnpm install
pnpm exec turbo run build        # construit les packages @media-studio/*
pnpm -F @media-studio/example-headless start
```

## Ce que ça montre

- `createMediaStudio({ license, exportRenderer })` câble Core + JobQueue + licence.
- `core.execute("video.create" | "text.create" | "filter.create" | "video.split", …)`,
  puis `core.undo()` / `core.redo()`.
- `core.license.has("export.4k")` (gating premium).
- `createFilterCatalog().byCategory("Cinema")`.
- `createRuntime()` : `play()` / `tick()` / `getCurrentTime()`.
- `studio.exportProject(config)` : job non-bloquant avec progression `job:progress`
  jusqu'à `job:completed`.

> L'encodeur (`NativeEncoder`) est ici **simulé**. En production, il est fourni par
> le backend natif (FFmpeg fork / AVFoundation / MediaCodec) — voir
> `docs/09-EXPORT-ENGINE.md`.
