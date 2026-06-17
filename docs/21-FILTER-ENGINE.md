# 21 — Filter Engine

> **Statut : 🟡 planifié — Passe 3 (Phase 1 photo / Phase 3 vidéo).** Périmètre figé ci-dessous.

## Purpose

Filtres et effets colorimétriques : Skia pour la photo, shaders GPU pour la vidéo.

## Périmètre (à détailler)

- **Implémentation** : Skia `ColorFilter` / `ImageFilter` (photo) ; shaders GLSL
  (Metal / OpenGL ES) pour les effets GPU vidéo.
- **Catalogue** :
  - *Vintage* : Sepia, Retro, Old Film, Dust
  - *Cinema* : Drama, Hollywood, Teal & Orange
  - *Beauty* : Glow, Smooth, Bright
  - *Black & White* : Classic, Contrast, Film Noir
  - *Social* : TikTok, Reels, Neon, Dream
- **Paramètres** : `FilterParams` (intensity 0–1, contrast/saturation/brightness/
  temperature −1–1). → [02-PROJECT-SCHEMA](./02-PROJECT-SCHEMA.md).
- Filtres/LUTs additionnels via `FilterPack` + catalogue custom `config.filters`
  ([12-CONFIGURATION](./12-CONFIGURATION.md)).

## Limites V1

- Pas de multi-pass GPU (effets combinés limités).

## Cross-refs

- [04-RENDERER](./04-RENDERER.md) — application en preview vs export (parité, [ADR-0010](./ADR/0010-preview-export-pipeline-split.md)).
- [24-UI-COMPONENTS](./24-UI-COMPONENTS.md) — `<FilterPicker />`.
