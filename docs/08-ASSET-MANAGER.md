# 08 — Asset Manager

> **Statut : 🟡 planifié — Passe 3.** Périmètre figé ci-dessous.
> Le cœur de l'AssetManager vit dans le **Core** ; ce doc en décrit la façade.

## Purpose

Service central de gestion de tous les assets du projet : import, cache, cycle de
vie, et préparation du **Resource Pack System** pour la marketplace future.

## Périmètre (à détailler)

- Interface `AssetManager` : `import(source) / delete(id) / get(id) / list(type?) /
  cache(asset) / clearCache() / getSize()`.
- Types : `video | image | audio | font | sticker | template | filter | transition`.
- `Asset` : `id, type, uri, source, size, createdAt, pack?`.
- Sources : `{kind:"local"}` · `{kind:"remote"}` · `{kind:"marketplace"}`.
- **ResourcePack** : `FontPack`, `StickerPack`, `FilterPack`, `TemplatePack`,
  `TransitionPack`, `MusicPack` ; `install / uninstall / list`.
- Vérification de **signature** des packs marketplace avant installation (Security
  Layer). → [15-NATIVE-CONFIG-PLUGINS](./15-NATIVE-CONFIG-PLUGINS.md).

## Cross-refs

- [02-PROJECT-SCHEMA](./02-PROJECT-SCHEMA.md) — référence `pack` dans les assets.
- [12-CONFIGURATION](./12-CONFIGURATION.md) — catalogues (fonts, filtres, musique) configurables.
