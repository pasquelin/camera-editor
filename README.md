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
  core/               noyau pur (ProjectManager, CommandBus, registries, built-ins)
  licensing/          plans → capacités (createLicense)
  filter-engine/      catalogue de filtres + résolution de params
  text-engine/        presets, animations, Font Manager
  sticker-engine/     catégories, formats, animations, registry
  transition-engine/  catalogue de transitions + contrainte d'overlap
  audio-engine/       plan de mixage, gain avec fades, validation des rôles
  runtime/            machine de transport play/pause/seek/loop
  timeline/           conversion temps↔pixels + moteur de snap
  background-jobs/    file d'export non-bloquante (JobQueue)
  export-engine/      dégradation licence + ExportRenderer (port NativeEncoder)
  security/           vérification de signature des plugins
  asset-manager/      registry de ResourcePack + gating licence
  video-editor/       contrôleur headless d'édition vidéo
  photo-editor/       contrôleur headless d'édition photo
  ui/                 couche React (Provider, hooks, <MediaStudio>, <ExportProgress>)
  sdk/                point d'entrée unique + façade createMediaStudio
modules/
  media-studio-export/  module natif Expo d'export (FFmpeg/AVFoundation/MediaCodec)
examples/
  headless-demo/      démo Node exécutable de toute la chaîne headless
  studio-app/         app Expo (Expo Go) consommant le SDK
```

Tout le **socle logique est headless** (zéro dépendance native dans la logique) :
chaque effet/contrainte natif passe par un **port injecté** (`NativeEncoder`, `Clock`,
`LicenseValidator`, `StorageAdapter`, `PluginVerifier`, FontManager…).

## Démarrer

```bash
pnpm install
pnpm build        # build de tous les packages (turbo)
pnpm typecheck    # typecheck strict (turbo)
pnpm test         # tests (vitest)

# Démo headless exécutable (Node, sans device)
pnpm -F @media-studio/example-headless start

# App Expo (Expo Go)
pnpm -F @media-studio/example-studio-app start
```

## Workflow Git

- `main` — **production uniquement** (mises en prod).
- `develop` — **intégration du développement**. Toutes les branches partent de `develop`.
- Branches de travail : `feat/*`, `fix/*`, `chore/*` → PR vers `develop`.

## Documentation

Point d'entrée : [`docs/README.md`](./docs/README.md). Roadmap de construction :
[`docs/10-ROADMAP.md`](./docs/10-ROADMAP.md).
