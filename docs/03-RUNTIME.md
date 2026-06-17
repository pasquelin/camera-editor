# 03 — Runtime

> **Statut : ✅ stable.**

## Purpose

Orchestrateur central de la **lecture**. Le Runtime coordonne Timeline, Preview
Renderer et Audio Engine via une **clock partagée**, sans dépendre de l'UI et **sans
contenir aucune logique de rendu**. Il est l'unique autorité sur l'état de lecture
(playing / paused / ended), le loop et le playback rate.

## Concepts

### Une seule autorité, une seule horloge

Le Runtime **possède** la clock. Tous les autres modules la **consomment en lecture
seule**. Cela garantit que Timeline, Preview et Audio voient exactement le même temps
à chaque frame — la synchronisation est structurelle, pas négociée.

- La clock est une **`SharedValue<number>` Reanimated** (ms), vivant sur l'**UI
  thread**. → [ADR-0004](./ADR/0004-shared-clock-reanimated.md).
- Elle avance frame-by-frame via `useFrameCallback`, modulée par le `playbackRate`.
- Le JS lit le temps **ponctuellement** (`getCurrentTime()`), jamais en boucle.

### Machine à états de lecture

```
        play()                 seek(t<dur) / play()
 ┌────────────────▶ playing ──────────────────────┐
 │                    │  ▲                          │
 │            pause() │  │ play()                   │ clock >= duration
 │                    ▼  │                          ▼
paused ◀───────────  paused                       ended
 ▲                                                  │
 └──────────────────  seek(t) / play() ─────────────┘
```

- `playing` : la clock avance ; Preview et Audio sont actifs.
- `paused` : la clock est figée ; la frame courante reste affichée.
- `ended` : la clock a atteint `duration`. Si `loop` est actif, retour à `0` et
  `playing` ; sinon `paused` à `duration` et émission de fin de lecture.
- `seek(t)` est valide dans **tout** état et **ne change pas** l'état playing/paused
  (un seek pendant la lecture continue la lecture depuis `t`).

## Interfaces (TS)

```ts
interface Runtime {
  play(): void;
  pause(): void;
  seek(timeMs: number): void;        // clampé à [0, duration]
  getCurrentTime(): number;          // lecture ponctuelle (ms)
  getDuration(): number;             // ms
  isPlaying(): boolean;
  setLoop(enabled: boolean): void;
  setPlaybackRate(rate: number): void; // 0.25–4.0 (borné)

  // Accès lecture seule à la clock pour les consommateurs (Timeline, Preview)
  readonly clock: SharedValue<number>;
}
```

### Exemple d'usage

```ts
const editor = new Editor();
await editor.loadProject(project);

editor.runtime.play();
editor.runtime.pause();
editor.runtime.seek(10_000);       // seek à 10s
editor.runtime.getCurrentTime();   // → 10000
editor.runtime.getDuration();      // → durée totale ms
editor.runtime.setLoop(true);
editor.runtime.setPlaybackRate(2); // ×2
```

### La boucle d'horloge

```ts
// Worklet exécuté à chaque frame sur l'UI thread
useFrameCallback((frame) => {
  "worklet";
  if (!playingShared.value) return;
  const next = clock.value + frame.timeSincePreviousFrame * rateShared.value;

  if (next >= durationShared.value) {
    if (loopShared.value) {
      clock.value = next % durationShared.value;     // boucle
    } else {
      clock.value = durationShared.value;
      runOnJS(handleEnded)();                         // transition → ended
    }
  } else {
    clock.value = next;
  }
});
```

> `timeSincePreviousFrame` est en ms : la clock est **basée sur le temps réel**, pas
> sur un compteur de frames — elle reste juste même si l'app saute des frames.

### Distribution aux consommateurs

| Consommateur | Mode de consommation |
|--------------|----------------------|
| **Timeline** | `useAnimatedReaction(() => clock.value, …)` — position de la tête de lecture, UI thread. |
| **Preview Renderer** | lit `clock.value` en worklet pour afficher la frame correspondante et piloter `AVPlayer`/`ExoPlayer`. |
| **Audio Engine** | aligne la position de lecture audio sur la clock (resync si dérive). |

## Responsabilités

- Gérer l'état de lecture (`playing` / `paused` / `ended`).
- Maintenir et **distribuer** la clock à Timeline, PreviewRenderer et AudioEngine.
- Gérer `loop` et `playbackRate`.
- Déclencher les événements `runtime:play`, `runtime:pause`, `timeline:seeked`.
- **Ne contient aucune logique de rendu** ni de composition.

### Synchronisation avec les stores

Le `runtimeStore` (Zustand) ne reflète que l'état **discret** (`isPlaying`,
`isLooping`, `playbackRate`, `durationMs`) pour l'UI. Le temps courant **n'y est
jamais** (il provoquerait un re-render par frame). → [13-STATE-DATAFLOW](./13-STATE-DATAFLOW.md).

```ts
runtime.on("runtime:play",  () => runtimeStore.setState({ isPlaying: true }));
runtime.on("runtime:pause", () => runtimeStore.setState({ isPlaying: false }));
```

### Gestion de la dérive audio

L'audio natif (AVPlayer/ExoPlayer) a sa propre horloge matérielle. Le Runtime traite
la clock comme **maître** : si l'écart audio ↔ clock dépasse un seuil (≈ 50 ms),
l'Audio Engine se resynchronise (micro-seek). Détail : [22-AUDIO-ENGINE](./22-AUDIO-ENGINE.md).

## Configuration

- Aucune capacité directe ne dépend d'un flag : le Runtime est requis dès qu'il y a
  lecture (`mode="video"`). En `mode="photo"` il n'est pas monté.
- `playbackRate` : plage `[0.25, 4.0]` par défaut, configurable (cohérent avec `VideoObject.speed`).
- **Lecture inversée temps réel** : le `reversed` d'un `VideoObject` est un attribut
  de rendu interprété par le Runtime ; la lecture inversée est supportée au niveau clip.
- **Courbes de vitesse (ramping)** : le `playbackRate` peut être modulé dynamiquement
  via les courbes de vitesse configurables par clip.
- Le mode **headless** expose `useRuntime(editor)` →
  `{ play, pause, seek, currentTime, isPlaying, … }`. → [12-CONFIGURATION](./12-CONFIGURATION.md).

## Décisions liées

- [ADR-0004](./ADR/0004-shared-clock-reanimated.md) — clock en SharedValue Reanimated.
- [ADR-0010](./ADR/0010-preview-export-pipeline-split.md) — le Runtime ne pilote que la preview, jamais l'export.

## Cross-refs

- [13-STATE-DATAFLOW](./13-STATE-DATAFLOW.md) — autorité de la clock, runtimeStore.
- [04-RENDERER](./04-RENDERER.md) — consommation de la clock par la preview.
- [05-TIMELINE](./05-TIMELINE.md) — tête de lecture et seek.
- [22-AUDIO-ENGINE](./22-AUDIO-ENGINE.md) — resynchronisation audio.
