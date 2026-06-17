---
"@media-studio/ui": minor
---

Nouveau package `@media-studio/ui` (couche React) : `MediaStudioProvider` (façade
headless + état des jobs + ouverture overlay), `useMediaStudio` (API impérative),
`<ExportProgress />` (vignette globale) et `<MediaStudio />` (coquille d'éditeur
headless-first). Headless-first : slots preview/caméra fournis par l'intégrateur.
react/react-native en peerDependencies. Conforme à docs/24, 26, 27, ADR-0017.
