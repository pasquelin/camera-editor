# 17 — Photo Editor

> **Statut : 🟡 planifié — Passe 3 (Phase 1 roadmap).** Périmètre figé ci-dessous.

## Purpose

Édition photo basée sur le PreviewRenderer Skia : transformations, dessin libre,
overlays (texte/stickers/filtres), export image.

## Périmètre (à détailler)

- **Transformations** : crop (libre ou ratio fixe), rotate (90° ou libre), flip
  H/V, resize.
- **Dessin libre** : pinceau (taille, couleur, opacité), gomme, formes (rectangle,
  cercle, ligne).
- **Overlay** : texte ([19-TEXT-ENGINE](./19-TEXT-ENGINE.md)), stickers
  ([20-STICKER-ENGINE](./20-STICKER-ENGINE.md)), filtres ([21-FILTER-ENGINE](./21-FILTER-ENGINE.md)).
- **Export** : JPEG (qualité configurable), PNG. → [09-EXPORT-ENGINE](./09-EXPORT-ENGINE.md).
- Mutations via CommandBus ([ADR-0007](./ADR/0007-mutations-commandbus-undo.md)).

## Cross-refs

- [04-RENDERER](./04-RENDERER.md) — Skia, calques statiques.
- [24-UI-COMPONENTS](./24-UI-COMPONENTS.md) — `<PhotoEditor />`.
