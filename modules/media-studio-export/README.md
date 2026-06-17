# media-studio-export (module natif Expo)

Implémente le port `NativeEncoder` du SDK avec un backend d'encodage natif
(FFmpeg fork en principal, AVFoundation/MediaCodec en fallback — ADR-0002).

## Branchement

```ts
import { nativeEncoder } from "media-studio-export";
import { createExportRenderer, createMediaStudio, createLicense } from "@media-studio/sdk";

const license = createLicense("pro");
const exportRenderer = createExportRenderer({ primary: nativeEncoder, license });
const studio = createMediaStudio({ license, exportRenderer });
```

## État

- TS (`index.ts`) : adaptateur complet (snapshot JSON, progression via events, abort).
- iOS (`ios/MediaStudioExportModule.swift`) / Android (`.../MediaStudioExportModule.kt`) :
  squelettes Expo Modules API avec le point d'intégration FFmpeg marqué `TODO(prod)`.

## Build

Nécessite un **dev build** (`npx expo run:ios` / `npx expo run:android`) — indisponible
en Expo Go. La logique pure (dégradation licence, sélection moteur, file d'export) est
déjà testée côté `@media-studio/export-engine` et `@media-studio/background-jobs`.
