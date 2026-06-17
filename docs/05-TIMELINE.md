# 05 — Timeline

> **Statut : ✅ stable.**

## Purpose

Représentation et édition **temporelle** multi-tracks du projet. La Timeline affiche
les clips dans le temps, offre les gestes d'édition (drag, trim, split, merge…) et
une tête de lecture. Elle consomme la clock du Runtime en **lecture seule** : elle ne
contrôle pas la lecture, elle **délègue** au Runtime.

## Concepts

### Tracks

| Track | Limite | Contenu |
|-------|--------|---------|
| `VideoTrack` | **max 3** simultanées | `VideoObject`, `ImageObject` |
| `AudioTrack` | **max 5** simultanées | `AudioObject` |
| `TextTrack` | — | `TextObject` |
| `StickerTrack` | — | `StickerObject` |
| `FilterTrack` | — | `FilterObject` |

Chaque track est multi-layers (plusieurs objets, éventuellement chevauchants).
L'ordre des tracks + l'ordre intra-track définissent le **z-index** consommé par le
Renderer ([04-RENDERER](./04-RENDERER.md)).

### Coordonnées : temps ↔ pixels

La Timeline convertit le temps en position écran via un facteur de **zoom**
(pixels par ms). Tous les gestes opèrent en pixels puis sont reconvertis en ms au
commit.

```ts
const pxPerMs = basePxPerMs * zoom;          // zoom: pinch
const xOf  = (ms: number) => ms * pxPerMs;
const msOf = (x: number)  => x / pxPerMs;    // clampé, puis snappé
```

## Interfaces (TS)

> Types **inférés** (au-delà du brief) pour expliciter le contrat de la Timeline.

```ts
interface TimelineController {
  // Édition (toutes via CommandBus → undo/redo)
  trim(id: string, edge: "start" | "end", deltaMs: number): void;
  split(id: string, atMs: number): void;       // au timecode courant par défaut
  merge(idA: string, idB: string): void;       // clips contigus, même track
  duplicate(id: string): void;
  remove(id: string): void;
  move(id: string, toTrack: string, toStartMs: number): void; // drag & drop

  // Navigation (NON enregistrée — preview)
  seek(timeMs: number): void;                  // délègue au Runtime
  setZoom(zoom: number): void;
  setSnap(enabled: boolean): void;
}

interface SnapEngine {
  enabled: boolean;
  threshold: number;                           // px : distance d'accroche
  points(project: Project): number[];          // bords de clips, marqueurs, tête de lecture, 0, duration
  apply(candidateMs: number): number;          // renvoie le ms accroché si dans le seuil
}
```

## Fonctionnalités

- **Drag & drop** des clips (déplacement temporel et inter-tracks) → `move`.
- **Resize / trim** par drag des bords → `trim`.
- **Split** au timecode courant → `split`.
- **Merge** de clips contigus → `merge`.
- **Duplicate / Delete** → `duplicate` / `remove`.
- **Zoom** (pinch gesture) → `setZoom`.
- **Snap magnétique** aux points clés (bords de clips, tête de lecture, marqueurs).
- **Seek** par tap/drag sur la réglette temporelle → délègue au Runtime.
- **Waveforms** audio affichées sous les `AudioObject`.

## Synchronisation avec le Runtime

La Timeline lit la clock **en worklet**, sans re-render React :

```ts
// Dans le composant Timeline
const playhead = useSharedValue<number>(0);
useAnimatedReaction(
  () => runtime.clock.value,
  (time) => { playhead.value = time; }   // tête de lecture, UI thread
);
```

- La Timeline **ne mute jamais** la clock directement : un drag sur la réglette
  appelle `runtime.seek(ms)`. L'autorité reste le Runtime
  ([03-RUNTIME](./03-RUNTIME.md), [ADR-0004](./ADR/0004-shared-clock-reanimated.md)).

## Le pattern geste → commit

Pendant un geste (drag/trim/zoom), tout se passe sur l'**UI thread** via des
`SharedValue` : zéro mutation du projet, zéro re-render, 60 fps. On **commit une seule
fois** au `onEnd` du geste, ce qui produit **une seule commande** et **un seul état
d'undo**. → [13-STATE-DATAFLOW](./13-STATE-DATAFLOW.md), [ADR-0007](./ADR/0007-mutations-commandbus-undo.md).

```ts
const pan = Gesture.Pan()
  .onUpdate((e) => { "worklet"; ghostX.value = startX.value + e.translationX; })
  .onEnd(() => {
    "worklet";
    const ms = snap.apply(msOf(ghostX.value));
    runOnJS(execute)("video.update", { id, startTime: ms });   // commit unique
  });
```

## Configuration

- Montée par le flag `enableTimeline` ([12-CONFIGURATION](./12-CONFIGURATION.md)).
- Composant `<Timeline />` remplaçable par slot ; le mode **headless** expose
  `useTimeline(editor)` → `{ tracks, zoom, snap, … }`.
- `SnapEngine.threshold` et le pas de zoom sont paramétrables.

## Limites V1

- **Max 3 VideoTrack**, **max 5 AudioTrack** simultanées (appliqué à l'insertion).
- Snap sur points discrets (bords, tête de lecture, marqueurs) ; pas de grille
  rythmique (beat-snap) en V1.
- Pas de groupes/nesting de clips.

## Décisions liées

- [ADR-0004](./ADR/0004-shared-clock-reanimated.md) — clock lue en lecture seule.
- [ADR-0007](./ADR/0007-mutations-commandbus-undo.md) — édition via CommandBus, commit en fin de geste.

## Cross-refs

- [03-RUNTIME](./03-RUNTIME.md) — source de la clock et du seek.
- [04-RENDERER](./04-RENDERER.md) — z-index issu de l'ordre des tracks.
- [02-PROJECT-SCHEMA](./02-PROJECT-SCHEMA.md) — modèle des objets et tracks.
- [18-VIDEO-EDITOR](./18-VIDEO-EDITOR.md) — opérations d'édition clip.
