# ADR-0010 — Séparation des pipelines Preview et Export

- **Statut** : ✅ Accepté
- **Date** : 2026-06-17
- **Concerne** : [04-RENDERER](../04-RENDERER.md), [09-EXPORT-ENGINE](../09-EXPORT-ENGINE.md), [11-MONOREPO](../11-MONOREPO.md).

## Contexte

Deux besoins de rendu antagonistes : la **preview** doit être fluide (30 fps,
réactive aux gestes, qualité « suffisante ») ; l'**export** doit être parfait
(qualité maximale, frame-by-frame, sans contrainte temps réel). Tenter de servir les
deux avec un seul moteur conduit soit à une preview qui rame, soit à un export
dégradé.

## Décision

Deux pipelines **distincts**, dans deux packages séparés
(`renderer/preview` et `renderer/export`), **sans code de rendu partagé** :

- **Preview** : Skia (calques statiques : image, texte, stickers, filtres) +
  composant vidéo natif (AVPlayer / ExoPlayer), composition par z-index, textures
  compressées, effets simplifiés, cible 30 fps.
- **Export** : pipeline offline FFmpeg / AVFoundation / MediaCodec, filtres GPU
  appliqués frame-by-frame, mixage audio complet, qualité maximale.

Ils ne partagent que le **modèle de données** (`Project`), pas le rendu.

## Conséquences

- **Positives** : chaque pipeline est optimisé pour son objectif unique ; on peut
  faire évoluer l'un sans risquer l'autre ; frontières de packages nettes ; tests
  ciblés (perf pour preview, fidélité pour export).
- **Négatives / coûts** : risque de **divergence visuelle** preview ↔ export (un
  filtre rendu différemment) — à maîtriser par des tests de parité visuelle et un
  catalogue de filtres décrit de façon déclarative et partagée.
- **Suivi** : suite de tests de parité (preview vs export) sur les filtres et le
  texte ; documenter les écarts assumés.

## Alternatives écartées

- **Moteur de rendu unique** : compromis perdant-perdant (preview lente ou export
  médiocre).
- **Export = preview en plus lent** : ignore les codecs matériels et la qualité
  frame-by-frame ; plafonne la qualité finale.
- **Tout Skia, y compris l'export vidéo** : insuffisant pour l'encodage/mux et les
  codecs natifs.
