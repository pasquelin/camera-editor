# 18 — Video Editor

> **Statut : 🟡 planifié — Passe 3 (Phase 3 roadmap).** Périmètre figé ci-dessous.

## Purpose

Édition vidéo multi-tracks pilotée par le Runtime et la Timeline.

## Périmètre (à détailler)

- **Édition clip** : trim (in/out), split au timecode, merge de clips contigus,
  reverse, speed (0.25x, 0.5x, 1x, 1.5x, 2x, 4x), mute, sélection cover (vignette).
- **Timeline** : multi-tracks (max **3 vidéo**, max **5 audio**), multi-layers par track.
  → [05-TIMELINE](./05-TIMELINE.md).
- **Preview** : play / pause / seek (via [03-RUNTIME](./03-RUNTIME.md)), loop.
- Mutations via CommandBus ([Annexe A, 01-ARCHITECTURE](./01-ARCHITECTURE.md)).

## Cross-refs

- [03-RUNTIME](./03-RUNTIME.md) · [05-TIMELINE](./05-TIMELINE.md) · [22-AUDIO-ENGINE](./22-AUDIO-ENGINE.md).
- [24-UI-COMPONENTS](./24-UI-COMPONENTS.md) — `<VideoEditor />`.
