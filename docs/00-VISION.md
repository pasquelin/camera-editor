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

## Paramètres par défaut (entièrement configurables)

Le SDK livre **toutes** ses capacités dès la première version. Les valeurs ci-dessous
sont des **défauts ajustables** par l'intégrateur (via `config.limits` / `config.renderer`),
pas des plafonds imposés. → [12-CONFIGURATION](./12-CONFIGURATION.md).

| Domaine | Valeur par défaut (configurable) |
|---------|----------------------------------|
| Video tracks | 3 par défaut |
| Audio tracks | 5 par défaut |
| Preview | 30 fps par défaut, multi-pass GPU supporté |
| Undo stack | 50 états par défaut |

### Tiers de licence (modèle commercial, pas une limite de version)

Toutes les fonctionnalités existent dès maintenant ; certaines sont rattachées à un
**plan commercial** (cf. [07-LICENSE-SYSTEM](./07-LICENSE-SYSTEM.md)) :

- **Pro** : export 4K, H.265, effets avancés, plugins premium.
- **Enterprise** : whitelabel, support, SLA, analytics.

### Écosystème de plugins

Des domaines entiers sont livrés sous forme de **plugins de l'écosystème** (dépôts
séparés), tous disponibles : **AI** (`media-studio-ai`), **Face Tracking**
(`media-studio-face-tracking`), **Collaboration** (`media-studio-collaboration`),
**Cloud Render** (`media-studio-cloud-render`). → [06-PLUGIN-API](./06-PLUGIN-API.md).

## Décisions liées

- [ADR-0002](./ADR/0002-export-ffmpeg-fork-native-fallback.md) — fork FFmpeg + fallback natif (ffmpeg-kit abandonné).
- [ADR-0009](./ADR/0009-headless-first-config-layers.md) — headless-first + couches de configuration.
- [ADR-0011](./ADR/0011-licensing-injected-interface.md) — licence optionnelle, injectée par interface.

## Cross-refs

- [01-ARCHITECTURE](./01-ARCHITECTURE.md) — comment le découplage se matérialise.
- [10-ROADMAP](./10-ROADMAP.md) — l'ordre d'exécution des phases.
- [11-MONOREPO](./11-MONOREPO.md) — l'organisation des packages open-core.
