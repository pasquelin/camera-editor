# 08 — Asset Manager

> **Statut : ✅ stable.**

## Purpose

Service central de gestion de **tous les assets** du projet : import, cache, cycle de
vie, et **Resource Pack System** pour la marketplace. Le cœur de l'AssetManager vit
dans le Core ([01-ARCHITECTURE](./01-ARCHITECTURE.md)) ; ce document décrit son
contrat et le système de packs.

## Concepts

### Cycle de vie d'un asset

```
import(source) ──▶ copie/résolution en URI local ──▶ Asset (indexé)
        │                                               │
        ▼                                               ▼
   cache(asset)  ◀── réutilisation ──  get(id) / list(type)
        │
   clearCache() / delete(id)
```

Un asset importé (local, distant ou marketplace) est **résolu en URI local** puis
indexé. L'AssetManager émet `asset:imported`. → [01-ARCHITECTURE](./01-ARCHITECTURE.md) (Annexe B).

### Resource Packs

Un `ResourcePack` est un ensemble d'assets **signé**, vérifié par le Security Layer
avant installation ([15-NATIVE-CONFIG-PLUGINS](./15-NATIVE-CONFIG-PLUGINS.md),
[ADR-0013](./ADR/0013-security-layer-package.md)). C'est l'unité de distribution de la
marketplace.

## Interfaces (TS)

```ts
interface AssetManager {
  import(source: AssetSource): Promise<Asset>;
  delete(id: string): Promise<void>;
  get(id: string): Asset | null;
  list(type?: AssetType): Asset[];
  cache(asset: Asset): Promise<void>;
  clearCache(): Promise<void>;
  getSize(): Promise<number>;           // taille du cache en bytes
}

type AssetType =
  | "video" | "image" | "audio" | "font"
  | "sticker" | "template" | "filter" | "transition";

interface Asset {
  id: string;
  type: AssetType;
  uri: string;                // URI local après import
  source: AssetSource;        // origine
  size: number;               // bytes
  createdAt: string;          // ISO8601
  pack?: string;              // référence ResourcePack si applicable
}

type AssetSource =
  | { kind: "local"; path: string }
  | { kind: "remote"; url: string }
  | { kind: "marketplace"; packId: string; assetId: string };
```

### Resource Pack System

```ts
interface ResourcePack {
  id: string;
  version: string;
  name: string;
  description: string;
  author: string;
  license: "free" | "pro" | "enterprise";
  assets: Asset[];
  signature: string;          // vérifié par le Security Layer
}

interface ResourcePackManager {
  install(pack: ResourcePack): Promise<void>;   // → SecurityLayer.verifyPack(pack)
  uninstall(packId: string): Promise<void>;
  list(): ResourcePack[];
}
```

### Types de packs

| Pack | Apporte | Consommé par |
|------|---------|--------------|
| `FontPack` | Polices | [19-TEXT-ENGINE](./19-TEXT-ENGINE.md) |
| `StickerPack` | Stickers | [20-STICKER-ENGINE](./20-STICKER-ENGINE.md) |
| `FilterPack` | Filtres / LUTs | [21-FILTER-ENGINE](./21-FILTER-ENGINE.md) |
| `TemplatePack` | Templates de projet | [02-PROJECT-SCHEMA](./02-PROJECT-SCHEMA.md) |
| `TransitionPack` | Transitions | [23-TRANSITION-ENGINE](./23-TRANSITION-ENGINE.md) |
| `MusicPack` | Pistes audio libres de droits | [22-AUDIO-ENGINE](./22-AUDIO-ENGINE.md) |

## Configuration

- **Installation à chaud** : `resourcePackManager.install(pack)` ; vérification de
  signature automatique avant activation.
- **Cache configurable** : taille interrogeable (`getSize`) et purge (`clearCache`) ;
  la politique de cache (taille cible, éviction) est paramétrable via la config.
- Les catalogues built-in (fonts, filtres, musique) sont **remplaçables** par la config
  ou enrichis par des packs. → [12-CONFIGURATION](./12-CONFIGURATION.md).
- Un plugin marketplace (`media-studio-marketplace`) télécharge dynamiquement des packs.
  → [06-PLUGIN-API](./06-PLUGIN-API.md).

## Décisions liées

- [ADR-0008](./ADR/0008-extensibility-object-schema-registry.md) — assets/packs comme extension du modèle.
- [ADR-0013](./ADR/0013-security-layer-package.md) — signature des ResourcePacks.

## Cross-refs

- [02-PROJECT-SCHEMA](./02-PROJECT-SCHEMA.md) — référence `pack` dans les objets/assets.
- [15-NATIVE-CONFIG-PLUGINS](./15-NATIVE-CONFIG-PLUGINS.md) — Security Layer (vérification).
- [12-CONFIGURATION](./12-CONFIGURATION.md) — catalogues configurables.
