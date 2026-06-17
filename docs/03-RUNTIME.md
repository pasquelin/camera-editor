# 03 — Runtime

> **Statut : 🟡 planifié — Passe 2.** Périmètre figé ci-dessous ; interfaces
> détaillées à l'écriture de la passe 2.

## Purpose

Orchestrateur central de la lecture. Coordonne Timeline, Preview Renderer et Audio
Engine via une **clock partagée**, sans dépendre de l'UI ni contenir de logique de
rendu.

## Périmètre (à détailler)

- Interface `Runtime` : `play / pause / seek / getCurrentTime / getDuration /
  isPlaying / setLoop / setPlaybackRate`.
- **Clock partagée** en `SharedValue` Reanimated, avancée par `useFrameCallback` sur
  l'UI thread. → [ADR-0004](./ADR/0004-shared-clock-reanimated.md).
- États de lecture (playing / paused / ended), loop, playback rate.
- Émission des événements `runtime:play`, `runtime:pause`, `timeline:seeked`.
- Distribution de la clock à Timeline / Preview / Audio (lecture seule côté abonnés).

## Cross-refs

- [13-STATE-DATAFLOW](./13-STATE-DATAFLOW.md) — autorité de la clock, runtimeStore.
- [04-RENDERER](./04-RENDERER.md) · [05-TIMELINE](./05-TIMELINE.md) — consommateurs.
