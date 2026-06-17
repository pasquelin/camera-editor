# Media Studio SDK — Documentation blueprint

> Source de vérité d'architecture pour le SDK React Native + Expo de création,
> d'édition et d'export photo/vidéo. Ces documents **sont** le plan : on construit
> le SDK en s'y référant. Ils sont écrits pour être suivis sur plusieurs années par
> un développeur solo.

## Comment lire cette doc

Les documents sont numérotés par couche de profondeur, du *pourquoi* vers le *comment*.

| # | Document | Rôle | Statut |
|---|----------|------|--------|
| 00 | [VISION](./00-VISION.md) | Mission, positionnement, principes | ✅ stable |
| 01 | [ARCHITECTURE](./01-ARCHITECTURE.md) | Couches, règles de dépendances, flux de données | ✅ stable |
| 02 | [PROJECT-SCHEMA](./02-PROJECT-SCHEMA.md) | Modèle de données, types d'objets, migrations | ✅ stable |
| 03 | [RUNTIME](./03-RUNTIME.md) | Orchestrateur play/pause/seek, clock partagée | ✅ stable |
| 04 | [RENDERER](./04-RENDERER.md) | Preview temps réel + Export offline | ✅ stable |
| 05 | [TIMELINE](./05-TIMELINE.md) | Tracks, gestes, snap, synchro clock | ✅ stable |
| 06 | [PLUGIN-API](./06-PLUGIN-API.md) | Système de plugins, points d'extension | ✅ stable |
| 07 | [LICENSE-SYSTEM](./07-LICENSE-SYSTEM.md) | Plans, validation, expiration gracieuse | ✅ stable |
| 08 | [ASSET-MANAGER](./08-ASSET-MANAGER.md) | Assets, cache, ResourcePacks | ✅ stable |
| 09 | [EXPORT-ENGINE](./09-EXPORT-ENGINE.md) | Pipeline d'export, formats, codecs | ✅ stable |
| 10 | [ROADMAP](./10-ROADMAP.md) | Jalons de construction (ordre de build) | ✅ stable |
| 11 | [MONOREPO](./11-MONOREPO.md) | pnpm + Turborepo, packages, publication | ✅ stable |
| 12 | [CONFIGURATION](./12-CONFIGURATION.md) | **Contrat de paramétrage complet** | ✅ stable |
| 13 | [STATE-DATAFLOW](./13-STATE-DATAFLOW.md) | Zustand, Reanimated, source de vérité | ✅ stable |
| 14 | [TESTING](./14-TESTING.md) | Stratégie de test cross-packages | ✅ stable |
| 15 | [NATIVE-CONFIG-PLUGINS](./15-NATIVE-CONFIG-PLUGINS.md) | Modules natifs, config plugins, New Arch | ✅ stable |
| 16 | [CAMERA](./16-CAMERA.md) | Capture photo/vidéo, ratios, vision-camera | ✅ stable |
| 17 | [PHOTO-EDITOR](./17-PHOTO-EDITOR.md) | Crop, rotate, dessin, overlays, export image | ✅ stable |
| 18 | [VIDEO-EDITOR](./18-VIDEO-EDITOR.md) | Trim, split, merge, speed, reverse | ✅ stable |
| 19 | [TEXT-ENGINE](./19-TEXT-ENGINE.md) | Styles, animations, Font Manager | ✅ stable |
| 20 | [STICKER-ENGINE](./20-STICKER-ENGINE.md) | PNG/SVG/GIF/Lottie, gestes, catégories | ✅ stable |
| 21 | [FILTER-ENGINE](./21-FILTER-ENGINE.md) | Catalogue de filtres, Skia + shaders GPU | ✅ stable |
| 22 | [AUDIO-ENGINE](./22-AUDIO-ENGINE.md) | Trim, fades, mix + Music Library | ✅ stable |
| 23 | [TRANSITION-ENGINE](./23-TRANSITION-ENGINE.md) | Transitions entre clips contigus | ✅ stable |
| 24 | [UI-COMPONENTS](./24-UI-COMPONENTS.md) | Catalogue des composants par défaut + theming | ✅ stable |
| 25 | [DEVELOPER-DOCS](./25-DEVELOPER-DOCS.md) | Docusaurus, TSDoc, CLI, distribution | ✅ stable |
| 26 | [STUDIO-FLOW](./26-STUDIO-FLOW.md) | **Composant Studio + machine à états interne** (capture→edit→preview, zéro routeur) | ✅ stable |
| 27 | [BACKGROUND-JOBS](./27-BACKGROUND-JOBS.md) | Aperçu immédiat + export non-bloquant (vignette, %) | ✅ stable |

Les [ADR](./ADR/) (Architecture Decision Records) capturent les **décisions
structurantes** et leurs alternatives écartées. Voir [ADR/0000-template](./ADR/0000-template.md).

## Principes transverses (à respecter dans tout le code)

Ces cinq principes sont non négociables. Chaque document les décline dans son domaine.

1. **Headless-first + tout override-able.** Chaque package expose trois couches :
   logique *headless* (zéro UI) → UI par défaut → points d'override
   (capability flags, design tokens, slots / render-props, handlers).
   → voir [12-CONFIGURATION](./12-CONFIGURATION.md), [ADR-0009](./ADR/0009-headless-first-config-layers.md).
2. **Core fermé / extensible.** Le Core ne dépend d'aucun plugin. Toute extension
   passe par `ObjectRegistry` / `SchemaRegistry` / `CommandBus` / `PluginManager`.
   → voir [01-ARCHITECTURE](./01-ARCHITECTURE.md), [ADR-0008](./ADR/0008-extensibility-object-schema-registry.md).
3. **Mutations via CommandBus uniquement.** Pas de mutation directe du projet ;
   undo/redo et snapshots en découlent.
   → voir [ADR-0007](./ADR/0007-mutations-commandbus-undo.md).
4. **Preview ≠ Export.** Deux pipelines de rendu distincts, aucun code partagé.
   → voir [04-RENDERER](./04-RENDERER.md), [ADR-0010](./ADR/0010-preview-export-pipeline-split.md).
5. **Bonnes pratiques RN/Expo gravées.** Expo Modules API (pas l'ancien bridge),
   New Architecture (Fabric/TurboModules) ready, config plugins (pas d'`eject`),
   discipline worklets Reanimated, Metro configuré pour le monorepo, EAS pour les builds.
   → voir [15-NATIVE-CONFIG-PLUGINS](./15-NATIVE-CONFIG-PLUGINS.md), [ADR-0006](./ADR/0006-native-expo-modules-new-arch.md).

## Template d'un document

Chaque document suit la même ossature :

```
# NN — Titre

## Purpose          — pourquoi ce module existe, en 3 lignes
## Concepts         — vocabulaire et idées clés
## Interfaces (TS)  — contrats publics, types exportés
## Configuration    — points de paramétrage (flags, tokens, slots, handlers, défauts ajustables)
## Décisions liées  — liens vers les ADR
## Cross-refs       — liens vers les autres docs
```

## Conventions d'écriture

- **Interfaces TS** : tout contrat public est exprimé en TypeScript strict. Les
  types « inventés » hors brief sont signalés et justifiés.
- **Statut** : `✅ stable` (validé), `🟡 passe N` (planifié), `🔴 draft` (en cours).
- **Unités** : temps en millisecondes (`ms`), tailles en bytes, angles en degrés,
  `scale` en ratio (`1.0` = 100 %), `opacity`/`intensity` dans `[0, 1]`.
- **Versionnage** : tout changement d'une interface `EditorObject` existante
  déclenche une migration enregistrée (cf. [02-PROJECT-SCHEMA](./02-PROJECT-SCHEMA.md)).
