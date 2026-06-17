/**
 * Contrats de la file d'export en arrière-plan. Voir docs/27-BACKGROUND-JOBS.md
 * et docs/09-EXPORT-ENGINE.md.
 */
import type { Project } from "@media-studio/core";

/** Configuration d'export (alignée sur docs/09-EXPORT-ENGINE.md). */
export interface ExportConfig {
  format: "mp4" | "mov" | "jpeg" | "png";
  resolution: "720p" | "1080p" | "1440p" | "4k";
  fps: 24 | 30 | 60;
  videoBitrate: number; // kbps
  audioBitrate: number; // kbps
  codec: "h264" | "h265";
  quality: number; // 0–1 (JPEG)
}

/** Config d'export par défaut (MP4 1080p H.264) — source unique réutilisable. */
export const DEFAULT_EXPORT_CONFIG: ExportConfig = {
  format: "mp4",
  resolution: "1080p",
  fps: 30,
  videoBitrate: 8000,
  audioBitrate: 128,
  codec: "h264",
  quality: 1,
};

export type JobStatus = "queued" | "running" | "completed" | "failed" | "cancelled";

export interface ExportJob {
  id: string;
  status: JobStatus;
  progress: number; // 0–1
  thumbnailUri?: string;
  outputUri?: string; // disponible si status === "completed"
  error?: string; // renseigné si "failed"
  config: ExportConfig;
  createdAt: string; // ISO8601
}

/** Entrée fournie au renderer pour traiter un job. */
export interface ExportRenderInput {
  project: Project; // snapshot immuable du projet
  config: ExportConfig;
  onProgress: (progress: number) => void; // 0–1
  signal: AbortSignal; // abort sur annulation
}

/**
 * Port de rendu injecté (enveloppé par le job). L'implémentation réelle
 * (FFmpeg / natif) vit dans @media-studio/export-engine. → docs/09.
 */
export interface ExportRenderer {
  render(input: ExportRenderInput): Promise<string>; // résout l'outputUri
}

export type JobEvent = "job:started" | "job:progress" | "job:completed" | "job:failed";

/** File d'export non-bloquante détenue par le Provider racine (docs/27). */
export interface JobQueue {
  enqueue(project: Project, config: ExportConfig): ExportJob; // snapshot interne
  cancel(jobId: string): void;
  get(jobId: string): ExportJob | null;
  list(): ExportJob[];
  on(event: JobEvent, cb: (job: ExportJob) => void): () => void; // retourne unsubscribe
}

/** Dépendances injectées à la file. */
export interface JobQueueDeps {
  renderer: ExportRenderer;
  maxConcurrent?: number; // défaut 1 (jobs.maxConcurrent)
  now?: () => string; // ISO8601 courant (injecté pour les tests)
  generateId?: () => string; // générateur d'id (injecté pour les tests)
}
