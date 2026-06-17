---
"@media-studio/export-engine": minor
---

Nouveau package `@media-studio/export-engine` (headless) : `resolveExportConfig`
(dégradation licence 4K/H.265 → 1080p/H.264 + warnings) et `createExportRenderer`
(sélection moteur principal/fallback, branchable sur `createJobQueue`). Le backend
natif (FFmpeg fork / AVFoundation / MediaCodec) est injecté via le port
`NativeEncoder`. Dépend de `core` + `background-jobs` en type-only. Conforme à
docs/09-EXPORT-ENGINE.md, ADR-0002.
