# 11 — Monorepo

## Purpose

Décrire l'organisation physique du code : layout **pnpm workspace**, pipeline
**Turborepo**, liste des packages avec leur direction de dépendance, configuration
TypeScript et **Metro** pour un monorepo Expo, et la stratégie de versionnage /
publication npm. Ce document fait respecter les règles de dépendances de
[01-ARCHITECTURE](./01-ARCHITECTURE.md).

## Concepts

- **pnpm workspace** — gestion stricte des dépendances (pas de hoisting sauvage),
  liens symboliques entre packages locaux.
- **Turborepo** — orchestrateur de tâches avec cache (build/lint/test/typecheck).
- **changesets** — versionnage indépendant par package + génération de changelog.
- **Frontière d'import** — règle ESLint qui interdit au Core d'importer un plugin.

→ choix d'outillage justifié dans [ADR-0001](./ADR/0001-monorepo-pnpm-turborepo.md).

## Layout

```
media-studio/
├── package.json                 # racine, private, scripts turbo
├── pnpm-workspace.yaml
├── turbo.json
├── tsconfig.base.json
├── .changeset/
├── packages/
│   ├── core/                    # noyau pur, AUCUNE dépendance externe
│   ├── runtime/                 # orchestrateur play/pause/seek/clock
│   ├── renderer/
│   │   ├── preview/             # rendu temps réel 30fps
│   │   └── export/              # rendu offline qualité max
│   ├── timeline/
│   ├── camera/
│   ├── photo-editor/
│   ├── video-editor/
│   ├── text-engine/
│   ├── sticker-engine/
│   ├── filter-engine/
│   ├── audio-engine/
│   ├── export-engine/
│   ├── asset-manager/
│   ├── licensing/
│   ├── security/
│   ├── ui/
│   └── sdk/                     # package d'entrée unique (@media-studio/sdk)
├── examples/
│   ├── photo-editor-basic/
│   ├── video-editor-basic/
│   └── full-app/
└── docs/
```

```yaml
# pnpm-workspace.yaml
packages:
  - "packages/*"
  - "packages/renderer/*"
  - "examples/*"
```

## Packages et direction de dépendance

| Package | Publié sous | Dépend de | Rôle |
|---------|-------------|-----------|------|
| `core` | `@media-studio/core` | **rien** | ProjectManager, bus, registries, AssetManager |
| `runtime` | `@media-studio/runtime` | core | play/pause/seek, clock partagée |
| `renderer/preview` | `@media-studio/renderer-preview` | core, runtime | rendu temps réel (Skia + vidéo native) |
| `renderer/export` | `@media-studio/renderer-export` | core | rendu offline (FFmpeg / natif) |
| `timeline` | `@media-studio/timeline` | core, runtime | tracks, gestes, snap |
| `camera` | `@media-studio/camera` | core | capture photo/vidéo |
| `photo-editor` | `@media-studio/photo-editor` | core, renderer-preview, text/sticker/filter-engine | édition photo |
| `video-editor` | `@media-studio/video-editor` | core, runtime, timeline, audio-engine | édition vidéo |
| `text-engine` | `@media-studio/text-engine` | core | styles, animations, fonts |
| `sticker-engine` | `@media-studio/sticker-engine` | core | png/svg/gif/lottie |
| `filter-engine` | `@media-studio/filter-engine` | core | filtres Skia + shaders GPU |
| `audio-engine` | `@media-studio/audio-engine` | core | trim, volume, fade, mix |
| `export-engine` | `@media-studio/export-engine` | core, renderer-export | pipeline d'export |
| `asset-manager` | `@media-studio/asset-manager` | core | (façade des assets ; cœur dans core) |
| `licensing` | `@media-studio/licensing` | (injecté) core via interface | validation de licence |
| `security` | `@media-studio/security` | (injecté) core via interface | signatures, tamper detection |
| `ui` | `@media-studio/ui` | tous les engines, runtime | composants par défaut, thémés |
| `sdk` | `@media-studio/sdk` | ui + tout | **point d'entrée unique** |

> **Invariant vérifié** : `core` n'a aucune entrée dans la colonne « Dépend de ».
> Toute dépendance circulaire ou import de plugin par le Core casse le build.

## Configuration TypeScript

```jsonc
// tsconfig.base.json — strict pour tout le monorepo
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "moduleResolution": "bundler",
    "composite": true,
    "declaration": true,
    "declarationMap": true
  }
}
```

Chaque package a son `tsconfig.json` avec `references` vers ses dépendances locales
(TypeScript **project references**) → typecheck incrémental et frontières explicites.

## Pipeline Turborepo

```jsonc
// turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build":     { "dependsOn": ["^build"], "outputs": ["dist/**", "build/**"] },
    "typecheck": { "dependsOn": ["^build"] },
    "lint":      {},
    "test":      { "dependsOn": ["^build"], "outputs": ["coverage/**"] }
  }
}
```

- `^build` = construire d'abord les dépendances en amont (respect du DAG).
- Cache local + (optionnel) remote cache pour la CI.

## Configuration Metro (monorepo Expo)

Point critique pour qu'Expo résolve les packages locaux et leurs `node_modules`
hoistés par pnpm :

```js
// examples/full-app/metro.config.js
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// 1) surveiller tout le monorepo
config.watchFolders = [workspaceRoot];

// 2) résoudre les modules locaux puis ceux de la racine
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

// 3) pnpm utilise des symlinks — les suivre
config.resolver.unstable_enableSymlinks = true;
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
```

> Sans `unstable_enableSymlinks` + `nodeModulesPaths`, Metro échoue à résoudre les
> packages `@media-studio/*` liés par pnpm.

## Frontières d'import (règle automatisée)

```jsonc
// .eslintrc — interdit au Core d'importer quoi que ce soit du monorepo
{
  "rules": {
    "@nx/enforce-module-boundaries": ["error", {
      "depConstraints": [
        { "sourceTag": "scope:core", "onlyDependOnLibsWithTags": [] },
        { "sourceTag": "scope:runtime", "onlyDependOnLibsWithTags": ["scope:core"] }
      ]
    }]
  }
}
```

(L'outil exact — `eslint-plugin-boundaries`, `dependency-cruiser` ou règle maison —
est tranché à l'implémentation ; l'**invariant** est ce qui compte.)

## Versionnage et publication

- **changesets** : chaque PR qui modifie un package ajoute un `.changeset/*.md`
  décrivant le bump (patch/minor/major). `changeset version` génère les versions et
  changelogs ; `changeset publish` publie sur npm.
- **Versionnage indépendant** : `core` peut être en `1.4.0` quand `ui` est en `2.1.0`.
- **Build par package** : libs JS pures via `tsup` ; packages avec natif via le
  build **expo-module**. → [15-NATIVE-CONFIG-PLUGINS](./15-NATIVE-CONFIG-PLUGINS.md).
- Le package `sdk` agrège et ré-exporte ; c'est la seule dépendance qu'un
  intégrateur installe pour le chemin par défaut.

## Limites V1

- Pas de remote cache obligatoire (le cache local Turborepo suffit pour un dev solo).
- Pas de génération auto de la matrice de compatibilité de versions inter-packages
  en V1 (les peerDeps `@media-studio/core` encadrent les ranges).

## Décisions liées

- [ADR-0001](./ADR/0001-monorepo-pnpm-turborepo.md) — pnpm + Turborepo.
- [ADR-0014](./ADR/0014-publishing-changesets-npm.md) — publication via changesets.

## Cross-refs

- [01-ARCHITECTURE](./01-ARCHITECTURE.md) — les règles de dépendances appliquées ici.
- [15-NATIVE-CONFIG-PLUGINS](./15-NATIVE-CONFIG-PLUGINS.md) — build des packages natifs.
- [14-TESTING](./14-TESTING.md) — où s'exécutent les tâches `test` de Turborepo.
