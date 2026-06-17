# 20 — Sticker Engine

> **Statut : 🟡 planifié — Passe 3 (Phase 1 roadmap).** Périmètre figé ci-dessous.

## Purpose

Gestion des stickers multi-formats avec gestes (drag, rotate, scale) et catégories
intégrées.

## Périmètre (à détailler)

- **Formats** : PNG, SVG, GIF, Lottie (JSON).
- **Actions** : déplacement (drag), rotation (gesture), scale (pinch), opacité.
- **Catégories intégrées** : Emoji, Réactions, Love, Food, Travel, Funny, Shapes.
- Stickers additionnels via `StickerPack` ([08-ASSET-MANAGER](./08-ASSET-MANAGER.md)).
- `StickerObject` / `StickerAnimation` : [02-PROJECT-SCHEMA](./02-PROJECT-SCHEMA.md).

## Cross-refs

- [13-STATE-DATAFLOW](./13-STATE-DATAFLOW.md) — gestes (Reanimated) → commit CommandBus en fin de geste.
- [24-UI-COMPONENTS](./24-UI-COMPONENTS.md) — `<StickerPicker />`.
