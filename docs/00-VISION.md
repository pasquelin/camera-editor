# 00 — Vision

## Purpose

Media Studio SDK est un SDK **React Native + Expo** qui intègre dans une application
mobile un système complet de **création, d'édition et d'export photo/vidéo** inspiré
de TikTok, Instagram Reels, CapCut et CreativeEditor SDK.

Objectif : devenir une alternative **open source et commercialisable** à
CreativeEditor SDK (IMG.LY), Banuba et IMG.LY, avec une architecture entièrement
découplée, *Expo-first*, et maintenable par un développeur solo sur plusieurs années.

## Concepts

### Le quadruple positionnement

| Axe | Engagement |
|-----|-----------|
| **Open source (core)** | Le Core et tous les modules de base sont libres. |
| **Extensible** | Système de plugins en dépôts séparés (AI, face-tracking, collab…). |
| **Commercialisable** | Système de licences *optionnel* et non intrusif (Pro / Enterprise). |
| **Compatible** | Expo (managed) **et** React Native bare workflow. |

### Principes de conception

1. **Découplage total Core / Runtime / Renderer / UI.** Chaque couche est
   remplaçable. L'UI ne contient aucune logique métier ; le Core ne connaît ni le
   réseau, ni l'UI.
2. **Sens des dépendances unique.** Le Core ne dépend de rien. Tous les plugins
   dépendent du Core. Le Runtime orchestre les moteurs sans dépendre de l'UI.
3. **Headless-first + tout paramétrable.** Un intégrateur doit pouvoir utiliser le
   SDK *sans* son UI (mode headless), ou avec l'UI par défaut entièrement *thémée*
   et *remplaçable par slots*. → [12-CONFIGURATION](./12-CONFIGURATION.md).
4. **Maintenabilité solo.** Packages petits, frontières nettes, types stricts,
   décisions tracées en ADR. Pas de magie ; chaque unité est compréhensible seule.
5. **Stabilité du Core.** Le schéma de projet est versionné et migré ; le Core
   évolue lentement, les plugins évoluent vite.

### Positionnement concurrentiel

| Produit | Modèle | Notre différenciation |
|---------|--------|-----------------------|
| CreativeEditor SDK (IMG.LY) | Propriétaire, licence lourde | Open-core, Expo-first, prix léger |
| Banuba | Propriétaire, AR-centric | Architecture ouverte, plugins externes |
| ffmpeg-kit-react-native | **Abandonné fin 2023** | Fork communautaire actif + fallback natif |

## Interfaces (TS)

Point d'entrée unique du SDK, illustrant la vision « initialiser puis composer » :

```ts
import { MediaStudio } from "@media-studio/sdk";

await MediaStudio.initialize({ licenseKey: "XXXX-XXXX" }); // licence optionnelle

<MediaStudio
  mode="video"            // "photo" | "video" | "camera"
  enableCamera
  enableAudio
  enableFilters
  enableText
  enableStickers
  enableTimeline
  onExport={(uri) => {}}
  onError={(err) => {}}
/>
```

## Configuration

La vision « tout paramétrable » se concrétise par trois leviers, détaillés dans
[12-CONFIGURATION](./12-CONFIGURATION.md) :

- **Capability flags** — activer/désactiver chaque sous-système (`enableX`).
- **Theme tokens** — couleurs, polices, rayons, espacements (`setTheme()`).
- **Slots / render-props** — remplacer n'importe quel composant d'UI.
- **Mode headless** — piloter le SDK par API sans aucune UI fournie.

## Limites V1

Contraintes **explicites et non négociables** pour éviter le scope creep
(reprises du brief, communes à tout le SDK) :

| Domaine | Limite V1 |
|---------|-----------|
| Video tracks | 3 simultanées max |
| Audio tracks | 5 simultanées max |
| Preview | 30 fps max, textures compressées, effets simplifiés |
| Export codec | H.264 uniquement (H.265 = plan Pro) |
| Export résolution | 4K réservé au plan Pro |
| Rendu GPU | Pas de multi-pass |
| Undo stack | 50 états max |

**Non-goals V1** (livrés par plugins externes, dépôts séparés) :
Collaboration, **AI**, **Face Tracking**, **Cloud Render**.

## Décisions liées

- [ADR-0002](./ADR/0002-export-ffmpeg-fork-native-fallback.md) — fork FFmpeg + fallback natif (ffmpeg-kit abandonné).
- [ADR-0009](./ADR/0009-headless-first-config-layers.md) — headless-first + couches de configuration.
- [ADR-0011](./ADR/0011-licensing-injected-interface.md) — licence optionnelle, injectée par interface.

## Cross-refs

- [01-ARCHITECTURE](./01-ARCHITECTURE.md) — comment le découplage se matérialise.
- [10-ROADMAP](./10-ROADMAP.md) — l'ordre d'exécution des phases.
- [11-MONOREPO](./11-MONOREPO.md) — l'organisation des packages open-core.
