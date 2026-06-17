---
"@media-studio/camera": minor
"@media-studio/sdk": minor
---

Nouveau package `@media-studio/camera` (headless) : `createCameraSession` — état
optique (facing/flash/ratio/exposition bornée) + intégration projet via CommandBus
(`addPhoto` → image.create, `addClip` → video.create, segments positionnés en
séquence), `clampExposure`/`clampZoom`/`clampPointOfInterest`. Le `sdk` le ré-exporte.
La capture native (vision-camera + module Expo) est branchée par l'app ; l'exemple
Expo fournit un écran de capture via expo-camera (Expo Go). Conforme à docs/16-CAMERA.md.
