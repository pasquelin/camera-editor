# ADR-0012 — Caméra : react-native-vision-camera

- **Statut** : ✅ Accepté
- **Date** : 2026-06-17
- **Concerne** : [16-CAMERA](../16-CAMERA.md), [15-NATIVE-CONFIG-PLUGINS](../15-NATIVE-CONFIG-PLUGINS.md).

## Contexte

Le module caméra doit offrir capture photo/vidéo, bascule avant/arrière, flash, zoom,
focus tactile, contrôle d'exposition et enregistrement segmenté multi-clips, sur iOS et
Android, en restant performant (New Architecture, frame processors) et compatible Expo.

## Décision

On utilise **`react-native-vision-camera`** comme socle du module caméra, complété par
du natif **Swift/Kotlin** (Expo Modules API) pour les contrôles avancés non couverts.
La librairie est intégrée via **config plugin** ([ADR-0006](./0006-native-expo-modules-new-arch.md)),
sans `eject`.

## Conséquences

- **Positives** : API riche et maintenue (formats, frame processors, devices) ;
  support New Architecture ; contrôle fin (exposition, focus, zoom optique) ;
  compatible Expo via config plugin ; large communauté.
- **Négatives / coûts** : dépendance externe lourde (binaire) ; certaines capacités
  très spécifiques (ProRes, RAW selon device) nécessitent du code natif complémentaire ;
  matrice de devices à tester.
- **Suivi** : suivre les versions vis-à-vis de la matrice Expo SDK / RN ; valider les
  frame processors si un plugin (ex. face-tracking) les exploite.

## Alternatives écartées

- **`expo-camera`** : simple et intégré, mais contrôles avancés (exposition manuelle,
  multi-format, frame processors) insuffisants pour un éditeur pro.
- **Module caméra 100 % maison (Camera2 / AVFoundation)** : contrôle maximal mais coût
  de développement et de maintenance disproportionné pour un dev solo.
