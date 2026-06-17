---
"@media-studio/sdk": minor
---

Nouveau package `@media-studio/sdk` — point d'entrée unique : ré-exporte le Core et
tous les moteurs headless (licensing, filter/text/sticker-engine, runtime, timeline,
background-jobs, export-engine, security, asset-manager) et expose la façade
`createMediaStudio` (câble Core + JobQueue + licence ; `exportProject` snapshot +
enqueue). Conforme à docs/11-MONOREPO.md, docs/26, docs/27.
