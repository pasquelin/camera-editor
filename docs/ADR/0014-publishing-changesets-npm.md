# ADR-0014 — Publication npm via changesets

- **Statut** : ✅ Accepté
- **Date** : 2026-06-17
- **Concerne** : [11-MONOREPO](../11-MONOREPO.md), tous les packages `@media-studio/*`.

## Contexte

~18 packages publiés indépendamment sous le scope `@media-studio/*`, maintenus par
un dev solo. Il faut un versionnage par package fiable, des changelogs générés, et
une publication scriptable en CI, sans cérémonie excessive.

## Décision

On utilise **changesets**. Chaque PR impactant un package ajoute un `.changeset/*.md`
(bump patch/minor/major + note). `changeset version` calcule les versions et écrit
les `CHANGELOG.md` ; `changeset publish` publie sur npm. **Versionnage indépendant**
par package ; les inter-dépendances sont encadrées par des `peerDependencies` sur
`@media-studio/core`. Le package `sdk` agrège et est le point d'installation par défaut.

## Conséquences

- **Positives** : versionnage et changelogs déterministes ; bumps explicites en PR ;
  publication scriptable (CI) ; cohérent avec le cache Turborepo
  ([ADR-0001](./0001-monorepo-pnpm-turborepo.md)).
- **Négatives / coûts** : discipline d'ajout du changeset à chaque changement ;
  gestion manuelle des ranges de peerDeps entre packages.
- **Suivi** : automatiser un contrôle CI « changeset présent si package modifié » ;
  documenter la matrice de compatibilité quand l'écosystème grossit.

## Alternatives écartées

- **semantic-release** : pensé mono-package ; lourd à plier au multi-package.
- **Lerna (publish)** : redondant avec pnpm + Turborepo ; maintenance en berne.
- **Versionnage fixe (toutes les versions alignées)** : force des bumps inutiles et
  brouille l'historique réel de chaque package.
