---
slug: /
title: Introduction
---

# Media Studio SDK

SDK React Native + Expo de création, d'édition et d'export photo/vidéo.

- **Headless-first** : toute la logique est pilotable sans UI ; les composants par
  défaut (`@media-studio/ui`) sont optionnels et thémables.
- **Core fermé / extensible** : registres d'objets et de commandes, plugins.
- **Mutations via CommandBus** : undo/redo et snapshots gratuits.
- **Preview ≠ Export** : deux pipelines distincts.

Installez le point d'entrée unique :

```bash
pnpm add @media-studio/sdk @media-studio/ui
```
