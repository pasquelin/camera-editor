---
"@media-studio/timeline": minor
---

Nouveau package `@media-studio/timeline` (headless) : conversion temps↔pixels
(`createTimeScale` : pxPerMs, pxOf, msOf) et moteur de snap (`collectSnapPoints`,
`snapToPoints`, `createSnapEngine`) accrochant aux bords de clips, 0 et durée. Seuil
en ms (conversion px→ms via TimeScale côté UI). Dépend de `@media-studio/core` en
type-only. Gestes (drag/trim/zoom) et commit CommandBus câblés par l'UI. Conforme à
docs/05-TIMELINE.md.
