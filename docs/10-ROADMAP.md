# 10 — Roadmap

> **Statut : 🟡 planifié — Passe 4.** Phases d'exécution figées ci-dessous.

## Purpose

Ordonner la construction du SDK en phases livrables, du Core vers la distribution.
Chaque phase est autonome et testable.

## Phases

### Phase 0 — Core
ProjectManager + SchemaRegistry · CommandBus + Undo/Redo · EventBus ·
ObjectRegistry (types built-in) · PluginManager · AssetManager.

### Phase 1 — Photo
PreviewRenderer (Skia, calques statiques) · Photo Editor (crop, rotate, flip, draw) ·
Text Engine + Font Manager · Sticker Engine · Filter Engine (photo) · ExportRenderer
(JPEG, PNG) · LicenseManager + interface de validation.

### Phase 2 — Caméra
Camera Module (photo + vidéo) · capture multi-clips.

### Phase 3 — Vidéo
Runtime (play, pause, seek, clock) · Video Editor (trim, split, merge, speed,
reverse) · Timeline (multi-tracks, drag, snap, seek) · PreviewRenderer vidéo ·
Audio Engine · Transition Engine · ExportRenderer vidéo (MP4, MOV) · Security Layer.

### Phase 4 — Distribution
ResourcePack System · Music Library intégrée · UI theming complet · CLI
`media-studio` · Documentation Docusaurus · Publication npm (`@media-studio/*`) ·
Exemples d'intégration.

## Cross-refs

- [00-VISION](./00-VISION.md) · [11-MONOREPO](./11-MONOREPO.md) · [14-TESTING](./14-TESTING.md).
