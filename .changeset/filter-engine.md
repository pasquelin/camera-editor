---
"@media-studio/filter-engine": minor
---

Nouveau package `@media-studio/filter-engine` (headless) : catalogue intégré de 17
filtres en 5 catégories (`BUILTIN_FILTERS`), registry interrogeable extensible
(`createFilterCatalog` avec `hidden`/`custom`), et résolution de paramètres
(`DEFAULT_FILTER_PARAMS`, `resolveFilterParams` avec clamp intensity [0,1] et
ajustements [-1,1]). Dépend de `@media-studio/core` en type-only. Le rendu natif
(Skia/GLSL) sera fourni par le renderer. Conforme à docs/21-FILTER-ENGINE.md.
