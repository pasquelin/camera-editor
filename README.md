# Media Studio SDK

SDK React Native + Expo de création, d'édition et d'export photo/vidéo.

> Le blueprint d'architecture complet vit dans [`docs/`](./docs/README.md) — c'est la
> source de vérité. Ce dépôt implémente ce blueprint, package par package.

## Monorepo

- **Gestionnaire** : pnpm workspaces
- **Orchestrateur** : Turborepo
- **Versionnage** : changesets

```
packages/
  core/        @media-studio/core — noyau pur (aucune dépendance externe)
```

## Démarrer

```bash
pnpm install
pnpm build        # build de tous les packages (turbo)
pnpm test         # tests (vitest)
pnpm typecheck
```

## Workflow Git

- `main` — **production uniquement** (mises en prod).
- `develop` — **intégration du développement**. Toutes les branches partent de `develop`.
- Branches de travail : `feat/*`, `fix/*`, `chore/*` → PR vers `develop`.

## Documentation

Point d'entrée : [`docs/README.md`](./docs/README.md). Roadmap de construction :
[`docs/10-ROADMAP.md`](./docs/10-ROADMAP.md).
