---
"@media-studio/sticker-engine": minor
---

Nouveau package `@media-studio/sticker-engine` (headless) : catégories intégrées
(`STICKER_CATEGORIES`, 7), formats (`STICKER_FORMATS` + `isStickerFormat`),
animations (`STICKER_ANIMATIONS` + `isStickerAnimation`) et registry mutable
(`createStickerCatalog` : register/unregister/list/get/has/byCategory, seed
`initial`/`hidden`). Dépend de `@media-studio/core` en type-only. Rendu
Skia/SVG/GIF/Lottie, gestes Reanimated et StickerPacks distants reportés
(renderer/UI/AssetManager). Conforme à docs/20-STICKER-ENGINE.md.
