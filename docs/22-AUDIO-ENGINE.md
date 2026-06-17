# 22 — Audio Engine & Music Library

> **Statut : ✅ stable.**

## Purpose

Gérer les pistes audio du projet — lecture synchronisée, mixage multi-piste et
bibliothèque musicale libre de droits intégrée. L'Audio Engine consomme la clock
du Runtime ([03-RUNTIME](./03-RUNTIME.md)) comme référence absolue : il ne possède
pas sa propre horloge et se resynchronise si l'horloge native (AVPlayer / ExoPlayer)
dérive au-delà d'un seuil.

L'audio s'applique **aussi bien à un projet vidéo qu'à un projet photo** : ajouter une
piste audio donne une **durée** à une photo, qui devient un clip animé/sonore exportable
en MP4 ([17-PHOTO-EDITOR](./17-PHOTO-EDITOR.md), [09-EXPORT-ENGINE](./09-EXPORT-ENGINE.md)).

## Concepts

### Sources audio prises en charge

Trois types de source peuvent alimenter une piste audio :

| Type | Description |
|------|-------------|
| **Fichier local** | URI vers un asset embarqué ou un fichier du système de fichiers de l'appareil. |
| **URL distante** | Flux streamé (HTTP/HTTPS) ; la mise en mémoire tampon est gérée de façon transparente. |
| **MusicPack** | Pack de musique distribué via l'Asset Manager ([08-ASSET-MANAGER](./08-ASSET-MANAGER.md)) ; résolu en URI local après téléchargement. |

### Architecture multi-piste

Le moteur distingue trois rôles de piste, avec une valeur par défaut de **5 audio
tracks simultanées** (configurable via `maxAudioTracks`) :

| Rôle | Cardinalité | Description |
|------|-------------|-------------|
| `background` | 1 | Musique de fond (boucle possible). |
| `voiceover` | 1 | Voix off enregistrée ou importée. |
| `sfx` | N | Sons courts déclenchés à un instant précis sur la timeline. |

Chaque piste correspond à un `AudioObject` dont la structure canonique est définie
dans le schéma de projet ([02-PROJECT-SCHEMA](./02-PROJECT-SCHEMA.md)).

### Capacités par piste

| Fonction | Valeurs |
|----------|---------|
| Trim | `trim.start` / `trim.end` — fenêtre de lecture dans le fichier source (ms). |
| Volume | `0` (muet) à `2` (double gain). |
| Fade in | `fadeIn` — durée en ms, appliqué depuis le début de la plage trimée. |
| Fade out | `fadeOut` — durée en ms, appliqué jusqu'à la fin de la plage trimée. |
| Speed | `0.5×` à `2×` (le pitch suit par défaut). |
| Loop | booléen — reboucle automatiquement tant que le playhead est dans la région de la piste. |

### Synchronisation avec le Runtime

La clock du Runtime ([03-RUNTIME](./03-RUNTIME.md)) est la **source de vérité du
temps**. À chaque frame, l'Audio Engine compare la position de lecture déclarée par
le lecteur natif à `clock.value`. Si l'écart dépasse ≈ 50 ms, un micro-seek est
appliqué au lecteur natif (resync). Ce mécanisme est unidirectionnel : l'audio suit
la clock, jamais l'inverse.

```
clock (Runtime, maître)
   │
   ▼
Audio Engine — compare position native
   │                          │
   │ écart < 50 ms            │ écart ≥ 50 ms
   │ → lecture continue       │ → seek natif (resync)
   ▼                          ▼
AVPlayer / ExoPlayer       AVPlayer / ExoPlayer
```

### Music Library

La bibliothèque musicale est intégrée au SDK et fournie libre de droits.

**Catégories disponibles** : Pop · Lo-Fi · Hip-Hop · Electronic · Corporate ·
Cinematic · Nature.

Elle est **entièrement remplaçable** via `config.musicLibrary`
([12-CONFIGURATION](./12-CONFIGURATION.md)) : un intégrateur peut pointer vers sa
propre source (URL d'API, fichiers locaux, plugin tiers). Des intégrations tierces
(Pixabay Music, Free Music Archive, Jamendo) sont disponibles via le système de plugins.

L'UI par défaut associée est `<AudioPicker />` ([24-UI-COMPONENTS](./24-UI-COMPONENTS.md)).

### Mutations via le CommandBus

Toutes les modifications d'une piste audio passent par le CommandBus
([ADR-0007](./ADR/0007-mutations-commandbus-undo.md)) et sont annulables/rejouables :

| Commande | Effet |
|----------|-------|
| `audio.create` | Ajoute une piste audio au projet. |
| `audio.update` | Met à jour les propriétés d'une piste (volume, speed…). |
| `audio.trim` | Ajuste `trim.start` / `trim.end` d'une piste. |
| `audio.volume` | Modifie le gain d'une piste. |
| `audio.fade` | Configure le fade in et/ou fade out d'une piste. |
| `audio.delete` | Supprime une piste du projet. |

## Interfaces (TS)

```ts
// AudioObject — forme canonique définie dans 02-PROJECT-SCHEMA.
// Reportez-vous à ce fichier pour la définition autoritative.
// Extrait indicatif (aligné sur la source de vérité) :
interface AudioObject {
  id: string;
  role: "background" | "voiceover" | "sfx";
  source: string;                            // URI local (résolu par l'AssetManager)
  startTime: number;        // ms — position sur la timeline (hérité de EditorObject)
  trim: { start: number; end: number };      // ms dans le fichier source
  volume: number;           // 0–2
  fadeIn: number;           // ms
  fadeOut: number;          // ms
  speed: number;            // 0.5–2.0
  loop: boolean;
}

// Mixeur interne (inféré — hors brief)
interface AudioMixer {
  addTrack(obj: AudioObject): void;
  removeTrack(id: string): void;
  setVolume(id: string, volume: number): void;    // 0–2
  fade(id: string, params: { fadeIn?: number; fadeOut?: number }): void;
  mixdown(): Promise<string>;   // URI du fichier mixé (usage export uniquement)
}

// Source sélectionnable pour créer une piste audio (≠ AudioObject, qui est l'objet dans le projet)
type AudioSource =
  | { type: "local"; uri: string }
  | { type: "remote"; url: string }
  | { type: "musicTrack"; trackId: string };

// Bibliothèque musicale remplaçable (config.musicLibrary)
interface MusicSource {
  categories: string[];
  list(category?: string): Promise<MusicTrack[]>;
  get(trackId: string): Promise<MusicTrack>;
}

// Music Library (inféré — hors brief)
interface MusicLibrary {
  categories: string[];   // ["Pop","Lo-Fi","Hip-Hop","Electronic","Corporate","Cinematic","Nature"]
  list(category?: string): Promise<MusicTrack[]>;
  get(trackId: string): Promise<MusicTrack>;
}

// MusicTrack (inféré — hors brief)
interface MusicTrack {
  id: string;
  title: string;
  category: string;
  durationMs: number;
  uri: string;   // URI locale (après résolution via Asset Manager)
}
```

## Configuration

```ts
// Extrait de MediaStudioConfig (12-CONFIGURATION)
interface MediaStudioConfig {
  musicLibrary?: MusicSource;   // remplace la bibliothèque intégrée
  capabilities?: {
    enableAudio?: boolean;      // false → moteur non monté
  };
  audio?: {
    maxAudioTracks?: number;    // défaut : 5 (configurable selon les besoins du projet)
  };
}
```

- Le flag `enableAudio: false` (niveau 0) empêche le montage du moteur audio : aucun
  code natif lié à l'audio n'est chargé.
- `config.musicLibrary` (niveau 0 / catalogue) permet de remplacer la bibliothèque
  intégrée par n'importe quelle source conforme à `MusicSource`.
- `config.audio.maxAudioTracks` configure le nombre maximum de pistes simultanées
  (défaut : 5).
- Le mode headless expose `useAudio(editor)` qui retourne l'état des pistes et les
  actions de mutation sans aucune UI.

## Capacités avancées

- Le nombre de pistes audio simultanées est configurable via `audio.maxAudioTracks`
  (toutes catégories confondues : `background` + `voiceover` + `sfx`).
- Le pitch-shift indépendant de la durée est supporté : `speed` et la hauteur tonale
  peuvent être contrôlés séparément.
- Le mixage temps réel est supporté en export : le `mixdown` peut être déclenché en
  parallèle des autres traitements par l'Export Engine
  ([09-EXPORT-ENGINE](./09-EXPORT-ENGINE.md)).
- L'ajout de pistes custom à la Music Library intégrée est possible directement via
  `config.musicLibrary` ou via plugin.
- Les intégrations Pixabay Music, Free Music Archive et Jamendo sont disponibles via
  le système de plugins.

## Décisions liées

- [ADR-0002](./ADR/0002-export-ffmpeg-fork-native-fallback.md) — pipeline d'export, dont mixdown audio via FFmpeg.
- [ADR-0004](./ADR/0004-shared-clock-reanimated.md) — clock partagée consommée par l'Audio Engine.
- [ADR-0006](./ADR/0006-native-expo-modules-new-arch.md) — modules natifs (AVPlayer / ExoPlayer) exposés via Expo Modules.
- [ADR-0007](./ADR/0007-mutations-commandbus-undo.md) — mutations audio via CommandBus, undo/redo.
- [ADR-0010](./ADR/0010-preview-export-pipeline-split.md) — preview audio vs. mixdown export.

## Cross-refs

- [02-PROJECT-SCHEMA](./02-PROJECT-SCHEMA.md) — définition canonique de `AudioObject`.
- [03-RUNTIME](./03-RUNTIME.md) — clock maître, resync audio sur dérive.
- [08-ASSET-MANAGER](./08-ASSET-MANAGER.md) — résolution des `MusicPack` en URI locale.
- [09-EXPORT-ENGINE](./09-EXPORT-ENGINE.md) — déclenchement du mixdown en export.
- [12-CONFIGURATION](./12-CONFIGURATION.md) — `config.musicLibrary`, `enableAudio`, `audio.maxAudioTracks`.
- [24-UI-COMPONENTS](./24-UI-COMPONENTS.md) — composant `<AudioPicker />`.
