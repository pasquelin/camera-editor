# 23 — Transition Engine

> **Statut : 🟡 planifié — Passe 3 (Phase 3 roadmap).** Périmètre figé ci-dessous.

## Purpose

Transitions appliquées entre deux clips vidéo contigus.

## Périmètre (à détailler)

- **Transitions disponibles** : Cut, Fade, Zoom, Slide (×4), Blur, Dissolve.
- **Application** : entre deux clips contigus sur la même `VideoTrack`, durée
  configurable (ms).
- Transitions additionnelles via `TransitionPack`
  ([08-ASSET-MANAGER](./08-ASSET-MANAGER.md)).
- Effets rendus dans les deux pipelines (preview simplifié / export qualité max,
  [ADR-0010](./ADR/0010-preview-export-pipeline-split.md)).

## Cross-refs

- [05-TIMELINE](./05-TIMELINE.md) — clips contigus, points d'application.
- [04-RENDERER](./04-RENDERER.md) · [09-EXPORT-ENGINE](./09-EXPORT-ENGINE.md).
