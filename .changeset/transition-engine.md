---
"@media-studio/transition-engine": minor
---

Nouveau package `@media-studio/transition-engine` (headless) : catalogue de 9
transitions (`BUILTIN_TRANSITIONS`, `createTransitionCatalog` avec hidden/custom),
easings (`TRANSITION_EASINGS`, `isTransitionEasing`) et contrainte d'overlap
(`maxTransitionDurationMs`). Les mutations passent par les commandes `transition.*`
du Core ; le rendu par le Renderer/Export. Dépend de `core` en type-only. Conforme à
docs/23-TRANSITION-ENGINE.md.
