# 16 — Camera Module

> **Statut : ✅ stable.**

## Purpose

Module de **capture photo et vidéo** indépendant de l'éditeur. Il produit des
`ImageObject` et `VideoObject` que le projet consomme directement. La caméra est
intentionnellement découplée du pipeline d'édition : elle peut être remplacée,
omise (bibliothèque de médias uniquement) ou entièrement surchargée sans toucher
au Core. Son activation est pilotée par le flag `enableCamera`.

## Concepts

### Indépendance du module Caméra

Le Camera Module n'a **aucune dépendance** vers le Runtime, la Timeline ou le
Renderer. Il communique avec le reste du SDK via un seul canal : la production
de `VideoObject` / `ImageObject` ajoutés au projet via le `CommandBus`. Cette
isolation garantit sa remplaçabilité totale.

### Stack : `react-native-vision-camera` + natif Swift / Kotlin

`react-native-vision-camera` constitue la couche JavaScript de pilotage
(permissions, configuration de session, déclenchement de capture). Les contrôles
avancés (exposition manuelle, focus point précis, enregistrement segmenté) sont
exposés via un **Expo Module natif** dédié (`CameraControlsModule`) écrit en
Swift (iOS) et Kotlin (Android), conforme à la New Architecture (Fabric /
TurboModules). → [ADR-0006](./ADR/0006-native-expo-modules-new-arch.md).

### Enregistrement segmenté (multi-clips)

L'utilisateur peut **démarrer et arrêter l'enregistrement plusieurs fois** dans
la même session Caméra. Chaque segment produit un `VideoObject` distinct qui
s'ajoute à la piste vidéo principale dans l'ordre de capture. Un identifiant de
session (`sessionId`) regroupe les clips d'une même session pour permettre
d'éventuels regroupements ultérieurs.

### Modes de ratio

| Ratio | Usage principal |
|-------|-----------------|
| `9:16` | Portrait plein écran (TikTok, Reels) |
| `16:9` | Paysage HD |
| `1:1`  | Carré (Instagram) |
| `4:3`  | Format standard appareil photo |

Le ratio pilote uniquement le **recadrage du flux de prévisualisation** ; la
capture native se fait toujours à la résolution maximale du capteur, puis un
crop est appliqué à l'export.

### Contrôle de la mise au point et de l'exposition

- **Focus tactile** : l'utilisateur touche l'écran → un `PointOfInterest`
  normalisé `{ x: [0,1], y: [0,1] }` est transmis au natif.
- **Exposition** : valeur de compensation EV dans `[-2.0, +2.0]` (pas de 0.1).
  En dehors de cette plage, la valeur est bornée sans erreur.
- **Zoom** : geste pinch → delta de scale → appel `setZoom(scale)`. La plage
  autorisée est `[minZoom, maxZoom]` retournée par le device et bornée côté SDK.

### Mode headless

En mode headless, l'intégration ne monte pas `<CameraView />`. L'hôte récupère
`useCameraController(editor)` et pilote lui-même la capture :

```ts
const ctrl = useCameraController(editor);
await ctrl.startRecording();
// … gestes natifs de l'hôte …
const clip = await ctrl.stopRecording(); // → VideoObject
```

## Interfaces (TS)

```ts
// inféré (hors brief) — contrat plausible du CameraController public
type FlashMode = 'auto' | 'on' | 'off' | 'torch';
type CameraRatio = '9:16' | '16:9' | '1:1' | '4:3';
type CameraFacing = 'front' | 'back';

interface PointOfInterest {
  x: number; // [0, 1] — normalisé
  y: number; // [0, 1] — normalisé
}

interface CameraController {
  // --- Capture photo ---
  capturePhoto(): Promise<ImageObject>;

  // --- Enregistrement vidéo segmenté ---
  startRecording(): Promise<void>;
  stopRecording(): Promise<VideoObject>;

  // --- Contrôles optiques ---
  switchCamera(facing?: CameraFacing): void;
  setFlash(mode: FlashMode): void;
  setZoom(scale: number): void;        // borné à [minZoom, maxZoom] du device
  focus(point: PointOfInterest): void; // focus tactile + exposition auto sur le point
  setExposure(ev: number): void;       // EV dans [-2.0, +2.0]

  // --- Ratio de capture ---
  setRatio(ratio: CameraRatio): void;

  // --- État courant (lecture seule) ---
  readonly isRecording: boolean;
  readonly facing: CameraFacing;
  readonly flash: FlashMode;
  readonly zoom: number;
  readonly ratio: CameraRatio;
}
```

```ts
// inféré (hors brief) — hook headless
function useCameraController(editor: Editor): CameraController;
```

> **Note** : `ImageObject` et `VideoObject` sont définis dans
> [02-PROJECT-SCHEMA](./02-PROJECT-SCHEMA.md). Le `CameraController` ci-dessus
> est inféré ; il sera validé lors de l'implémentation du Jalon 2 (cf. [10-ROADMAP](./10-ROADMAP.md)).

### Flux de production d'un clip

```
CameraController.stopRecording()
  → VideoObject { uri, durationMs, width, height, sessionId, … }
  → CommandBus.dispatch("video.create", { object: VideoObject, trackIndex: 0, positionMs: 0 })
  → Timeline.addClip(videoObject, trackIndex)
```

La caméra **ne mutate jamais le projet directement** : elle passe toujours par
le `CommandBus`, garantissant l'undo/redo et la cohérence du schéma.
→ [ADR-0007](./ADR/0007-mutations-commandbus-undo.md).

## Configuration

| Paramètre | Type | Défaut | Description |
|-----------|------|--------|-------------|
| `enableCamera` | `boolean` | `false` | Active le module caméra. Sans ce flag, `<CameraView />` et `useCameraController` ne sont pas montés / disponibles. |
| `camera.defaultFacing` | `CameraFacing` | `'back'` | Caméra active au montage. |
| `camera.defaultRatio` | `CameraRatio` | `'9:16'` | Ratio de prévisualisation au montage. |
| `camera.defaultFlash` | `FlashMode` | `'auto'` | Mode flash initial. |
| `camera.maxSegments` | `number` | `∞` | Limite optionnelle de clips par session. |
| `camera.captureFormats` | `('heic' \| 'jpeg' \| 'raw' \| 'prores')[]` | `['heic', 'jpeg']` | Formats photo/vidéo activés. RAW (DNG/ProRAW) et ProRes sont supportés sur les appareils compatibles. |
| `camera.enableMultiMic` | `boolean` | `false` | Active l'enregistrement audio multi-piste depuis la caméra (plusieurs sources microphone). |
| `camera.manualExposure` | `boolean` | `false` | Active le contrôle manuel ISO + vitesse d'obturation indépendants (en complément de la compensation EV). |
| `camera.enableOpticalZoomLens` | `boolean` | `false` | Expose la notion d'objectif discret (grand-angle, standard, télé) pour le zoom optique sur les appareils multi-capteurs. |
| `camera.preferredFrameRate` | `number \| 'auto'` | `'auto'` | Fréquence d'images cible (ex. `60`, `120`, `240`). Le mode haute fréquence est supporté sur les appareils compatibles. |
| `camera.maxClipDurationMs` | `number` | `∞` | Durée maximale par clip (ms). Configurable indépendamment de `maxSegments`. |

→ Paramétrage complet dans [12-CONFIGURATION](./12-CONFIGURATION.md).

### Slots et override UI

| Slot | Composant par défaut | Description |
|------|----------------------|-------------|
| `CameraControls` | Boutons flash, bascule, ratio, déclencheur | UI de contrôle superposée au flux vidéo. Remplaçable intégralement. |
| `CaptureButton` | Bouton rond, animation d'enregistrement | Déclencheur de capture photo ou démarrage/arrêt vidéo. |
| `RatioSelector` | Sélecteur de ratio en barre horizontale | Permet à l'hôte d'injecter son propre sélecteur. |

→ Catalogue complet dans [24-UI-COMPONENTS](./24-UI-COMPONENTS.md).

### Permissions natives

Les permissions `NSCameraUsageDescription`, `NSMicrophoneUsageDescription`
(iOS) et `android.permission.CAMERA`, `RECORD_AUDIO` (Android) sont injectées
automatiquement via le **config plugin** du Camera Module. Aucune configuration
manuelle n'est requise dans `app.json`.
→ [15-NATIVE-CONFIG-PLUGINS](./15-NATIVE-CONFIG-PLUGINS.md).

## Décisions liées

- [ADR-0006](./ADR/0006-native-expo-modules-new-arch.md) — Expo Modules API (New Arch) pour les contrôles avancés Swift / Kotlin.
- [ADR-0007](./ADR/0007-mutations-commandbus-undo.md) — ajout de clips au projet via CommandBus, jamais en mutation directe.
- [ADR-0009](./ADR/0009-headless-first-config-layers.md) — architecture headless-first avec slots et `useCameraController`.

## Cross-refs

- [15-NATIVE-CONFIG-PLUGINS](./15-NATIVE-CONFIG-PLUGINS.md) — config plugin, permissions, New Architecture.
- [02-PROJECT-SCHEMA](./02-PROJECT-SCHEMA.md) — définition de `VideoObject` et `ImageObject` produits par la caméra.
- [12-CONFIGURATION](./12-CONFIGURATION.md) — flag `enableCamera` et paramètres de configuration.
- [24-UI-COMPONENTS](./24-UI-COMPONENTS.md) — `<CameraView />`, slots `CameraControls`, `CaptureButton`.
- [05-TIMELINE](./05-TIMELINE.md) — destination des clips produits (ajout à une piste vidéo).
