# 16 — Camera Module

> **Statut : 🟡 planifié — Passe 3 (Phase 2 roadmap).** Périmètre figé ci-dessous.

## Purpose

Module de capture photo/vidéo, indépendant de l'éditeur, alimentant le projet en
clips. Encapsulé pour rester remplaçable.

## Périmètre (à détailler)

- **Fonctionnalités** : capture photo, capture vidéo, bascule avant/arrière, flash
  (auto/on/off/torch), zoom (pinch), focus tactile, contrôle exposition,
  enregistrement segmenté (multi-clips).
- **Modes ratio** : 9:16, 16:9, 1:1, 4:3.
- **Stack** : `react-native-vision-camera` (recommandé) + natif Swift/Kotlin pour
  les contrôles avancés. → [ADR-0006](./ADR/0006-native-expo-modules-new-arch.md).

## Configuration

- Activé par le flag `enableCamera` ([12-CONFIGURATION](./12-CONFIGURATION.md)).
- UI par défaut `<CameraView />` remplaçable via slot `CameraControls`
  ([24-UI-COMPONENTS](./24-UI-COMPONENTS.md)).

## Cross-refs

- [15-NATIVE-CONFIG-PLUGINS](./15-NATIVE-CONFIG-PLUGINS.md) — permissions, config plugin.
- [02-PROJECT-SCHEMA](./02-PROJECT-SCHEMA.md) — clips produits (VideoObject/ImageObject).
