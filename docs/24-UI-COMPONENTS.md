# 24 — UI Components

> **Statut : 🟡 planifié — Passe 3 (Phase 4 roadmap).** Périmètre figé ci-dessous.

## Purpose

Catalogue des composants d'UI **par défaut**, entièrement remplaçables. L'UI ne
contient aucune logique métier : chaque composant consomme les hooks headless et
expose un slot d'override. → [12-CONFIGURATION](./12-CONFIGURATION.md), [ADR-0009](./ADR/0009-headless-first-config-layers.md).

## Périmètre (à détailler)

### Composants
`<CameraView />`, `<PhotoEditor />`, `<VideoEditor />`, `<Timeline />`,
`<TextEditor />`, `<StickerPicker />`, `<FilterPicker />`, `<AudioPicker />`,
`<ExportPanel />`, `<ToolBar />`.

### Theming
Pilotés par les **design tokens** (`Theme`) : `colors`, `fonts`, `borderRadius`
(number configurable) + extensions (`radius`, `spacing`, `typography`, `iconSet`).
`MediaStudio.setTheme(partial)` est réactif. → [12-CONFIGURATION](./12-CONFIGURATION.md).

### Remplacement
Chaque composant est substituable via un **slot** nommé recevant un prop bag typé
(état + actions). Le mode **headless** permet de tout réécrire.

## Cross-refs

- [12-CONFIGURATION](./12-CONFIGURATION.md) — slots, tokens, headless.
- [16-CAMERA](./16-CAMERA.md) · [17-PHOTO-EDITOR](./17-PHOTO-EDITOR.md) · [18-VIDEO-EDITOR](./18-VIDEO-EDITOR.md) — composants associés.
