---
"@media-studio/background-jobs": minor
---

Nouveau package `@media-studio/background-jobs` (headless) : file d'export
non-bloquante `createJobQueue`. Chaque job opère sur un snapshot immuable du projet
(l'édition continue sans corrompre le rendu), avec cycle de vie
queued→running→completed/failed/cancelled, progression 0–1, annulation (AbortSignal),
concurrence (`maxConcurrent`, défaut 1) et événements `job:*`. Le rendu réel est
injecté via le port `ExportRenderer` (export-engine, à venir). Dépend de
`@media-studio/core` en type-only. Conforme à docs/27-BACKGROUND-JOBS.md.
