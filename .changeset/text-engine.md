---
"@media-studio/text-engine": minor
---

Nouveau package `@media-studio/text-engine` (headless) : styles prédéfinis
(`TEXT_PRESETS` + `resolveTextPreset` avec override), catalogue d'animations
(`TEXT_ANIMATIONS`, `isTextAnimation`) et Font Manager (`createFontManager` :
registry de polices bundlées + `resolve`). Dépend de `@media-studio/core` en
type-only. Rendu Skia/Reanimated, polices système et FontPacks distants reportés
(renderer/UI/AssetManager). Conforme à docs/19-TEXT-ENGINE.md.
