---
"@media-studio/asset-manager": minor
---

Nouveau package `@media-studio/asset-manager` (façade) : ré-exporte `AssetManager`
et les types d'assets du Core, et ajoute le registry de ResourcePack
(`createResourcePackRegistry` : register/unregister/get/list/accessible/resolveAsset)
avec gating par licence (`isPackAccessible` : free/pro/enterprise). Le
téléchargement/cache réel reste côté Core + adapters. Dépend de `core`. Conforme à
docs/08-ASSET-MANAGER.md.
