# ADR-0003 — Preview : Skia pour les calques statiques + composant vidéo natif

- **Statut** : ✅ Accepté
- **Date** : 2026-06-17
- **Concerne** : [04-RENDERER](../04-RENDERER.md), [03-RUNTIME](../03-RUNTIME.md), [21-FILTER-ENGINE](../21-FILTER-ENGINE.md).

## Contexte

La preview doit composer, à 30 fps, des calques de natures différentes : du contenu
**statique et déterministe** (image, texte, stickers, filtres, formes) et des **flux
vidéo** décodés par le système. React Native Skia excelle pour le 2D déterministe
mais n'est pas un décodeur vidéo ; à l'inverse, lire chaque frame vidéo pour la
re-dessiner dans Skia (texture upload par frame) est coûteux et fait chuter le
framerate.

## Décision

La preview est **hybride** :

- **Calques statiques** → rendus par un **Skia Canvas** (composition 2D, filtres
  `ColorFilter`/`ImageFilter`, texte, stickers).
- **Clips vidéo** → rendus par le **composant vidéo natif** (`AVPlayer` iOS /
  `ExoPlayer` Android), positionné dans la composition à son z-index, et
  **synchronisé sur la clock** du Runtime (seek/play/pause suivent le transport).

Les deux couches sont composées par z-index ; le composant vidéo s'insère parmi les
calques Skia. Ceci ne concerne **que la preview** : l'export a son propre pipeline
frame-by-frame ([ADR-0010](./0010-preview-export-pipeline-split.md)).

## Conséquences

- **Positives** : décodage vidéo délégué au matériel (fluide, économe) ; Skia libre
  pour le 2D haute qualité ; 30 fps atteignable ; chaque couche utilise le bon outil.
- **Négatives / coûts** : composer une **vue native** au milieu d'un canvas Skia est
  contraint (z-index, transforms, masques limités sur la vue vidéo) ; les filtres GPU
  *sur la vidéo* sont **simplifiés** en preview (qualité réelle à l'export) ;
  synchronisation clock ↔ position vidéo à gérer (resync sur dérive).
- **Suivi** : surveiller les cas multi-clips vidéo simultanés (jusqu'à 3 VideoTracks)
  et le coût des transforms appliquées à la vue vidéo.

## Alternatives écartées

- **Tout Skia (frame vidéo → texture par frame)** : upload de texture par frame,
  coûteux, framerate insuffisant pour plusieurs clips.
- **Tout natif (composition par vues natives)** : perd la richesse 2D de Skia pour
  texte/filtres/stickers et complexifie la composition par z-index.
- **GPU custom unifié (un seul pipeline Metal/GL pour tout)** : puissant mais
  développement et maintenance hors de portée d'un dev solo en V1 ; réservé à
  l'export où la qualité le justifie.
