---
"@media-studio/runtime": minor
---

Nouveau package `@media-studio/runtime` (headless) : machine de transport de lecture
`createRuntime` — autorité unique sur l'état (playing/paused/ended), play/pause/seek
(clampé), loop, playbackRate borné, avancement via `tick(deltaMs)`, événements
runtime:play/pause/ended + timeline:seeked. La clock (SharedValue Reanimated) est
abstraite par le port `Clock` ; la frame-loop native pilote `tick()`. Zéro dépendance.
Conforme à docs/03-RUNTIME.md.
