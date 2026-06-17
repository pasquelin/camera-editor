# 18 — Video Editor

> **Statut : ✅ stable.**

## Purpose

Éditeur vidéo multi-tracks orchestré par le **Runtime** et la **Timeline**. Il
expose les opérations d'édition clip (trim, split, merge, reverse, speed, mute,
cover) et leur composition dans une timeline à plusieurs pistes. Toutes les
mutations sont dispatché via le `CommandBus`, ce qui rend chaque action
undo-able et réplicable. Le Video Editor s'appuie sur le Runtime pour la
preview (play / pause / seek / loop) sans jamais piloter l'export directement.

Il partage **le même habillage** que le Photo Editor (design unifié — barre d'outils,
tiroir d'outils, panneau timeline, zone d'aperçu identiques), pour une expérience
cohérente quel que soit le type de média. → [24-UI-COMPONENTS](./24-UI-COMPONENTS.md),
[26-STUDIO-FLOW](./26-STUDIO-FLOW.md).

## Concepts

### Séparation Édition / Preview / Export

Le Video Editor **n'est pas le Renderer**. Son rôle est d'exprimer *quelles*
opérations s'appliquent à *quels* clips à *quel* moment. Le Runtime traduit cet
état en lecture temps réel ; le pipeline d'export (→ [09-EXPORT-ENGINE](./09-EXPORT-ENGINE.md))
produit le fichier final. Cette séparation est structurelle et non contournable.
→ [ADR-0010](./ADR/0010-preview-export-pipeline-split.md).

### Modèle de données : clips, tracks, layers

```
Project
 └── Timeline
      ├── VideoTrack 0  (3 par défaut, configurable)
      │    ├── VideoObject A  { trimIn, trimOut, speed, reversed, … }
      │    └── VideoObject B
      ├── VideoTrack 1
      ├── VideoTrack 2
      ├── AudioTrack 0  (5 par défaut, configurable)
      ├── AudioTrack 1
      …
      └── AudioTrack 4
```

- Un `VideoTrack` peut contenir plusieurs `VideoObject` placés côte à côte dans
  le temps (clips contigus ou avec gap).
- Chaque `VideoTrack` supporte plusieurs **layers** (overlays texte, stickers,
  filtres animés) positionnés dans la dimension temporelle. → [05-TIMELINE](./05-TIMELINE.md).
- Les `AudioTrack` sont indépendants des pistes vidéo et gérés par
  l'Audio Engine. → [22-AUDIO-ENGINE](./22-AUDIO-ENGINE.md).

### Opérations d'édition clip

| Opération | Description | Namespace CommandBus |
|-----------|-------------|---------------------|
| **Trim** | Définit `trimIn` et `trimOut` (ms dans le clip source) sans couper le fichier. Non destructif. | `video.trim` |
| **Split** | Coupe un clip en deux `VideoObject` au timecode indiqué. Le timecode est dans l'espace de la **timeline** (pas du clip source). Précision minimale de 100 ms par rapport aux bords du clip. | `video.split` |
| **Merge** | Fusionne deux clips contigus sur le même track en un seul `VideoObject` (annule un split précédent). | `video.merge` |
| **Reverse** | Inverse la lecture du clip (`VideoObject.reversed = true`). Attribut de rendu, pas un re-encode. | `video.reverse` |
| **Speed** | Modifie `VideoObject.speed` parmi les valeurs autorisées. Répercuté sur la durée occupée dans la timeline. | `video.speed` |
| **Mute** | Coupe l'audio natif du clip (`VideoObject.muted = true`) sans toucher les pistes audio séparées. | `video.mute` |
| **Cover** | Sélectionne la frame vignette (`VideoObject.coverTimeMs`) utilisée dans les aperçus et miniatures. | `video.cover` |
| **Create** | Ajoute un nouveau `VideoObject` dans un track à une position donnée. | `video.create` |
| **Delete** | Supprime un `VideoObject` et compacte ou laisse un gap selon le mode du track. | `video.delete` |
| **Update** | Met à jour un ou plusieurs attributs d'un `VideoObject` existant (position, taille, etc.). | `video.update` |

#### Valeurs de vitesse autorisées

`0.25×` · `0.5×` · `1×` · `1.5×` · `2×` · `4×`

Toute valeur hors de cet ensemble est rejetée par le CommandBus avec une erreur
de validation. Le facteur de vitesse influe sur la durée occupée dans la
timeline : `durationOnTimeline = (trimOut - trimIn) / speed`.

### Timeline multi-tracks

La Timeline est le **référentiel de position temporelle** de tous les clips. Le
Video Editor la pilote via les commandes `video.*` ; la Timeline réagit en
recalculant les positions et en notifiant le Runtime de la durée totale.
→ [05-TIMELINE](./05-TIMELINE.md).

Capacités de la timeline :

| Ressource | Valeur par défaut | Description |
|-----------|------------------|-------------|
| Pistes vidéo | 3 | Configurable via `videoEditor.maxVideoTracks` |
| Pistes audio | 5 | Configurable via `videoEditor.maxAudioTracks` |
| Layers par track | illimité (pratique : ~10 recommandé) | |

### Preview via Runtime

La preview du Video Editor est entièrement déléguée au Runtime :

- `play()` / `pause()` / `seek(timeMs)` / `setLoop(true|false)` — inchangés.
- La clock Reanimated (`SharedValue<number>`) pilote le PreviewRenderer qui
  affiche la frame correspondante via `AVPlayer` (iOS) / `ExoPlayer` (Android).
- L'état `isPlaying`, `durationMs` et `currentTime` sont exposés au Video Editor
  via `useRuntime(editor)` — aucun état de lecture n'est dupliqué dans le Video
  Editor.

→ [03-RUNTIME](./03-RUNTIME.md), [04-RENDERER](./04-RENDERER.md).

### Mode headless

Sans `<VideoEditor />`, l'hôte accède aux opérations d'édition via le hook
dédié et compose lui-même la Timeline et les contrôles :

```ts
const videoEditor = useVideoEditor(editor);
const runtime    = useRuntime(editor);

// Trim d'un clip
videoEditor.trim({ objectId: 'clip-1', trimIn: 2000, trimOut: 15000 });

// Split au timecode courant
videoEditor.split({ objectId: 'clip-1', atTimeMs: runtime.getCurrentTime() });

// Lecture preview
runtime.play();
runtime.setLoop(true);
```

## Interfaces (TS)

```ts
// inféré (hors brief) — types principaux du Video Editor

type SpeedFactor = 0.25 | 0.5 | 1 | 1.5 | 2 | 4;

interface TrimOptions {
  objectId: string;
  trimIn: number;   // ms dans le fichier source
  trimOut: number;  // ms dans le fichier source, > trimIn
}

interface SplitOptions {
  objectId: string;
  atTimeMs: number; // ms dans l'espace de la timeline globale
}

interface MergeOptions {
  objectIdA: string; // clip gauche (doit être contigu à B)
  objectIdB: string; // clip droit
}

interface SpeedOptions {
  objectId: string;
  speed: SpeedFactor;
}

interface CoverOptions {
  objectId: string;
  coverTimeMs: number; // ms dans le clip source, dans [trimIn, trimOut]
}

// inféré (hors brief) — contrôleur headless Video Editor
interface VideoEditorController {
  // Opérations clip
  trim(options: TrimOptions): void;
  split(options: SplitOptions): VideoObject[]; // retourne les 2 clips résultants
  merge(options: MergeOptions): VideoObject;   // retourne le clip fusionné
  reverse(objectId: string, reversed?: boolean): void;
  setSpeed(options: SpeedOptions): void;
  mute(objectId: string, muted?: boolean): void;
  setCover(options: CoverOptions): void;

  // Gestion de clips dans la timeline
  addClip(object: VideoObject, trackIndex: number, positionMs: number): void;
  removeClip(objectId: string): void;

  // Undo / Redo (délégué au CommandBus)
  undo(): void;
  redo(): void;
  canUndo: boolean;
  canRedo: boolean;
}

// inféré (hors brief) — hook headless
function useVideoEditor(editor: Editor): VideoEditorController;
```

### Commandes CommandBus (namespaces vidéo)

```ts
// inféré (hors brief) — union des commandes du domaine vidéo
type VideoCommand =
  | { type: 'video.create';  payload: { object: VideoObject; trackIndex: number; positionMs: number } }
  | { type: 'video.update';  payload: { objectId: string; patch: Partial<VideoObject> } }
  | { type: 'video.trim';    payload: TrimOptions }
  | { type: 'video.split';   payload: SplitOptions }
  | { type: 'video.merge';   payload: MergeOptions }
  | { type: 'video.delete';  payload: { objectId: string } }
  | { type: 'video.reverse'; payload: { objectId: string; reversed: boolean } }
  | { type: 'video.speed';   payload: SpeedOptions }
  | { type: 'video.mute';    payload: { objectId: string; muted: boolean } }
  | { type: 'video.cover';   payload: CoverOptions };
```

> Toutes ces commandes sont undo-able via le mécanisme standard du CommandBus.
> → [ADR-0007](./ADR/0007-mutations-commandbus-undo.md).

## Configuration

| Paramètre | Type | Défaut | Description |
|-----------|------|--------|-------------|
| `enableVideoEditor` | `boolean` | `false` | Active le module d'édition vidéo. |
| `videoEditor.maxVideoTracks` | `number` | `3` | Nombre maximum de pistes vidéo (défaut configurable). |
| `videoEditor.maxAudioTracks` | `number` | `5` | Nombre maximum de pistes audio (défaut configurable). |
| `videoEditor.allowedSpeeds` | `SpeedFactor[]` | `[0.25, 0.5, 1, 1.5, 2, 4]` | Valeurs de vitesse proposées dans l'UI. |
| `videoEditor.enableReverse` | `boolean` | `true` | Active l'opération reverse dans l'UI. |
| `videoEditor.enableSplit` | `boolean` | `true` | Active l'outil de split dans l'UI. |
| `videoEditor.enableMerge` | `boolean` | `true` | Active l'outil de merge dans l'UI. |
| `videoEditor.enableCoverSelection` | `boolean` | `true` | Permet à l'utilisateur de choisir la vignette de cover. |
| `videoEditor.defaultLoop` | `boolean` | `false` | État de loop de la preview au montage. |
| `videoEditor.enableGlobalReverse` | `boolean` | `true` | Active la lecture inversée temps réel globale de la timeline complète (mode transport du Runtime). |
| `videoEditor.enableCrosstrackDrag` | `boolean` | `true` | Active le déplacement de clips entre deux tracks différents via glisser-déposer. |

→ Paramétrage complet dans [12-CONFIGURATION](./12-CONFIGURATION.md) et
[ADR-0009](./ADR/0009-headless-first-config-layers.md).

### Slots et override UI

| Slot | Composant par défaut | Description |
|------|----------------------|-------------|
| `VideoEditorToolbar` | Barre d'outils (trim, split, speed, reverse, mute) | Barre d'actions principale. |
| `TimelineView` | Timeline scrollable multi-tracks | Affichage et gestion des pistes. Remplaçable par un composant Timeline personnalisé. |
| `PlaybackControls` | Boutons play/pause, seek bar, indicateur de temps | Contrôles de preview. |
| `ClipContextMenu` | Menu contextuel au long-press sur un clip | Actions rapides (split, mute, delete). |
| `SpeedPicker` | Sélecteur de vitesse (roue ou liste) | Remplaçable pour un affichage différent. |
| `CoverPicker` | Film strip de frames pour la sélection de vignette | UI de sélection de la frame cover. |

→ [24-UI-COMPONENTS](./24-UI-COMPONENTS.md).

## Décisions liées

- [ADR-0007](./ADR/0007-mutations-commandbus-undo.md) — mutations via CommandBus, undo/redo, namespaces `video.*`.
- [ADR-0009](./ADR/0009-headless-first-config-layers.md) — flags `enableVideoEditor`, slots, `useVideoEditor`.
- [ADR-0010](./ADR/0010-preview-export-pipeline-split.md) — le Video Editor pilote la preview via Runtime, jamais l'export directement.
- [ADR-0003](./ADR/0003-rendering-skia-vs-native-video.md) — rendu des frames vidéo via AVPlayer / ExoPlayer dans le PreviewRenderer.

## Cross-refs

- [03-RUNTIME](./03-RUNTIME.md) — orchestrateur play / pause / seek / loop utilisé pour la preview.
- [05-TIMELINE](./05-TIMELINE.md) — modèle de tracks, layers, positions temporelles ; destination des commandes `video.*`.
- [22-AUDIO-ENGINE](./22-AUDIO-ENGINE.md) — gestion des pistes audio indépendantes et de l'audio natif des clips.
- [04-RENDERER](./04-RENDERER.md) — pipeline de preview temps réel piloté par la clock Runtime.
- [09-EXPORT-ENGINE](./09-EXPORT-ENGINE.md) — pipeline d'export final (encode, codecs, formats).
- [23-TRANSITION-ENGINE](./23-TRANSITION-ENGINE.md) — transitions entre clips contigus (hors périmètre Video Editor).
- [02-PROJECT-SCHEMA](./02-PROJECT-SCHEMA.md) — `VideoObject` et ses attributs (`trim`, `speed`, `reversed`, `muted`) ; `trimIn`/`trimOut`/`coverTimeMs` sont les noms utilisés dans les commandes CommandBus (cf. interfaces TS ci-dessus).
- [12-CONFIGURATION](./12-CONFIGURATION.md) — flags `enableVideoEditor` et paramètres associés.
- [24-UI-COMPONENTS](./24-UI-COMPONENTS.md) — `<VideoEditor />` et ses slots.
