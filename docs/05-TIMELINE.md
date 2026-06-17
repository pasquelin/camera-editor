# 05 — Timeline

> **Statut : 🟡 planifié — Passe 2.** Périmètre figé ci-dessous.

## Purpose

Représentation et édition temporelle multi-tracks. Consomme la clock du Runtime en
**lecture seule** ; elle ne contrôle pas la lecture, elle délègue au Runtime.

## Périmètre (à détailler)

- **Tracks** : `VideoTrack` (max 3), `AudioTrack` (max 5), `TextTrack`,
  `StickerTrack`, `FilterTrack`.
- **Gestes** : drag & drop des clips, resize/trim par drag, split au timecode,
  merge de clips contigus, duplicate/delete, zoom (pinch), snap magnétique, seek.
- Affichage des **waveforms** audio.
- Synchro clock via `useAnimatedReaction` (lecture seule).
  → [13-STATE-DATAFLOW](./13-STATE-DATAFLOW.md), [ADR-0004](./ADR/0004-shared-clock-reanimated.md).
- Mutations (split, merge, trim…) émises via le CommandBus, commit en fin de geste.
  → [ADR-0007](./ADR/0007-mutations-commandbus-undo.md).

## Cross-refs

- [03-RUNTIME](./03-RUNTIME.md) — source de la clock.
- [02-PROJECT-SCHEMA](./02-PROJECT-SCHEMA.md) — modèle des tracks et objets.
