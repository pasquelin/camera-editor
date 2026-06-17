# Exemple — App Studio (Expo)

App Expo Router démontrant l'intégration **complète** du SDK Media Studio :
`MediaStudioProvider` à la racine, éditeur en overlay (`<MediaStudio />`), vignette
d'export globale (`<ExportProgress />`), licence Pro et export en arrière-plan.

## Lancer (Expo Go — sans build natif)

```bash
pnpm install
pnpm -F @media-studio/example-studio-app start   # puis scanner le QR avec Expo Go
```

L'export utilise un **encodeur de démo** (`lib/demo-encoder.ts`) compatible Expo Go.

## Passer en production (export natif réel)

Remplacer l'encodeur de démo par le module natif `media-studio-export`
(FFmpeg/AVFoundation/MediaCodec) et faire un dev build :

```bash
npx expo run:ios   # ou run:android
```

Voir `modules/media-studio-export/README.md` et `docs/09-EXPORT-ENGINE.md`.
