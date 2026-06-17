# ADR-0006 — Natif : Expo Modules API + New Architecture

- **Statut** : ✅ Accepté
- **Date** : 2026-06-17
- **Concerne** : [15-NATIVE-CONFIG-PLUGINS](../15-NATIVE-CONFIG-PLUGINS.md), [01-ARCHITECTURE](../01-ARCHITECTURE.md), [04-RENDERER](../04-RENDERER.md).

## Contexte

Le SDK a besoin de natif performant : capture caméra, preview vidéo (AVPlayer /
ExoPlayer), effets GPU (Metal / OpenGL ES), encode/decode. Il doit rester
**Expo-managed compatible** (installable sans `eject`) tout en étant utilisable en
bare workflow. L'ancien bridge RN est en voie de dépréciation au profit de la
**New Architecture** (Fabric + TurboModules + JSI).

## Décision

Tous les modules natifs sont écrits avec l'**Expo Modules API** (Swift / Kotlin),
ciblent la **New Architecture** (Fabric pour les vues, TurboModules pour les
modules), et exposent leur configuration de build via des **config plugins** Expo.
Aucune étape `eject` n'est requise pour l'intégrateur.

## Conséquences

- **Positives** : DSL moderne, typé, plus simple que le bridge ; autolinking ;
  intégration native (Skia, Reanimated, vision-camera) déjà alignée New Arch ;
  managed + bare avec le même code ; perf JSI (pas de pont JSON par frame).
- **Négatives / coûts** : exige un socle Expo SDK + RN récent ; certaines libs
  tierces doivent être à jour New Arch ; courbe d'apprentissage Swift/Kotlin pour
  un dev majoritairement JS.
- **Suivi** : verrouiller une matrice Expo SDK / RN supportée ; CI de build natif
  iOS + Android dès la Phase 2.

## Alternatives écartées

- **Ancien bridge RN** : en dépréciation, perf inférieure (sérialisation par pont) —
  exclu pour un projet multi-années.
- **Modules natifs RN bruts (sans Expo Modules)** : plus de boilerplate, pas
  d'autolinking Expo, casse la compatibilité managed.
- **Tout en JS/Skia sans natif** : impossible pour capture, encode/decode et codecs
  matériels.
