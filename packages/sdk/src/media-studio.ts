/**
 * Façade d'intégration headless : câble le Core, la file d'export (si un renderer
 * est fourni) et la licence en une API cohérente. La couche React
 * (`MediaStudioProvider`, `<MediaStudio />`) s'appuie sur cette façade. Voir
 * docs/26-STUDIO-FLOW.md, docs/27-BACKGROUND-JOBS.md.
 */
import { Core, type CoreDependencies, type Project } from "@media-studio/core";
import {
  createJobQueue,
  type ExportConfig,
  type ExportJob,
  type ExportRenderer,
  type JobQueue,
} from "@media-studio/background-jobs";

export interface MediaStudioDeps extends CoreDependencies {
  /** Renderer d'export (ex. createExportRenderer). Sans lui, pas de JobQueue. */
  exportRenderer?: ExportRenderer;
  /** Jobs d'export simultanés (défaut 1). */
  maxConcurrentExports?: number;
}

export interface MediaStudio {
  readonly core: Core;
  /** File d'export en arrière-plan (null si aucun renderer fourni). */
  readonly jobs: JobQueue | null;
  /** Snapshot le projet courant et lance un export en arrière-plan. */
  exportProject(config: ExportConfig): ExportJob;
}

export function createMediaStudio(deps: MediaStudioDeps = {}): MediaStudio {
  const { exportRenderer, maxConcurrentExports, ...coreDeps } = deps;
  const core = new Core(coreDeps);
  const jobs = exportRenderer
    ? createJobQueue({ renderer: exportRenderer, maxConcurrent: maxConcurrentExports ?? 1 })
    : null;

  return {
    core,
    jobs,
    exportProject: (config) => {
      if (!jobs) throw new Error("createMediaStudio: aucun exportRenderer fourni.");
      return jobs.enqueue(core.project.get() as Project, config);
    },
  };
}
