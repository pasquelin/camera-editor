---
"@media-studio/audio-engine": minor
---

Nouveau package `@media-studio/audio-engine` (headless) : `buildAudioMixPlan`
(plan de mixage par piste), `gainAt` (gain effectif volume + fades à un instant) et
`validateAudioRoles` (cardinalité background/voiceover/sfx). Le mixage natif et le
mixdown d'export restent côté natif. Dépend de `core` en type-only. Conforme à
docs/22-AUDIO-ENGINE.md.
