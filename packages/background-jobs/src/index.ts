/**
 * @media-studio/background-jobs — file d'export non-bloquante (JobQueue).
 * Orchestration headless : snapshot du projet, cycle de vie, %, annulation,
 * concurrence. Le rendu réel est injecté via le port `ExportRenderer`
 * (@media-studio/export-engine). Voir docs/27-BACKGROUND-JOBS.md.
 */
export { createJobQueue } from "./job-queue";
export { DEFAULT_EXPORT_CONFIG } from "./types";
export type {
  ExportConfig,
  JobStatus,
  ExportJob,
  ExportRenderInput,
  ExportRenderer,
  JobEvent,
  JobQueue,
  JobQueueDeps,
} from "./types";
