# ADR-0001 — Monorepo : pnpm + Turborepo

- **Statut** : ✅ Accepté
- **Date** : 2026-06-17
- **Concerne** : [11-MONOREPO](../11-MONOREPO.md), tout le repo.

## Contexte

Le SDK est un ensemble de ~18 packages versionnés et publiés séparément, dont
certains contiennent du natif (Expo Modules). Un dev solo doit pouvoir builder,
tester et publier sans friction. Le gestionnaire de paquets et l'orchestrateur de
tâches conditionnent la résolution Metro, la vitesse de CI et la rigueur des
frontières de dépendances.

## Décision

On utilise **pnpm workspaces** comme gestionnaire et **Turborepo** comme
orchestrateur de tâches (build/lint/test/typecheck avec cache). Versionnage et
publication via **changesets** ([ADR-0014](./0014-publishing-changesets-npm.md)).

## Conséquences

- **Positives** : installation rapide et déterministe ; pas de hoisting sauvage
  (isole les fuites de dépendances, ce qui aide à garantir « Core sans dépendance ») ;
  cache de tâches Turborepo ; configuration légère adaptée à un mainteneur solo.
- **Négatives / coûts** : pnpm utilise des symlinks → Metro doit être configuré
  explicitement (`unstable_enableSymlinks`, `nodeModulesPaths`) ; quelques outils
  natifs supposent un layout `node_modules` plat et demandent des ajustements.
- **Suivi** : vérifier la compatibilité Metro/pnpm à chaque montée de version Expo.

## Alternatives écartées

- **Yarn classic + workspaces** : historiquement le plus testé avec Expo, mais
  hoisting permissif (masque les fuites de deps) et plus lent que pnpm.
- **Bun** : très rapide, mais support Expo/Metro encore immature pour un projet pro
  multi-années — risque non justifié.
- **Nx** : puissant mais lourd et à forte courbe d'apprentissage pour un dev solo ;
  on garde l'idée des contraintes de frontières sans adopter tout l'outillage.
