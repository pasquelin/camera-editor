/**
 * Implémentation de la file d'export non-bloquante. Chaque job opère sur un
 * snapshot immuable du projet (l'utilisateur continue d'éditer le projet vivant).
 * L'I/O de rendu est injectée via le port `ExportRenderer`. Voir docs/27.
 */
import type { Project } from "@media-studio/core";
import type {
  ExportConfig,
  ExportJob,
  ExportRenderer,
  JobEvent,
  JobQueue,
  JobQueueDeps,
} from "./types";

/** Clone profond JSON (le Project est sérialisable par construction). */
function snapshot(project: Project): Project {
  return JSON.parse(JSON.stringify(project)) as Project;
}

interface InternalJob {
  job: ExportJob;
  project: Project; // snapshot figé
  controller: AbortController;
}

export function createJobQueue(deps: JobQueueDeps): JobQueue {
  const renderer: ExportRenderer = deps.renderer;
  const maxConcurrent = deps.maxConcurrent ?? 1;
  const now = deps.now ?? (() => new Date().toISOString());
  let seq = 0;
  const generateId = deps.generateId ?? (() => `job-${(seq += 1)}`);

  const jobs = new Map<string, InternalJob>();
  const queue: string[] = []; // ids en attente, FIFO
  const running = new Set<string>();
  const listeners: Record<JobEvent, Set<(job: ExportJob) => void>> = {
    "job:started": new Set(),
    "job:progress": new Set(),
    "job:completed": new Set(),
    "job:failed": new Set(),
  };

  const emit = (event: JobEvent, job: ExportJob): void => {
    for (const cb of listeners[event]) cb(job);
  };

  const schedule = (): void => {
    while (running.size < maxConcurrent && queue.length > 0) {
      const id = queue.shift();
      if (id === undefined) break;
      const entry = jobs.get(id);
      if (!entry || entry.job.status !== "queued") continue;
      start(entry);
    }
  };

  const start = (entry: InternalJob): void => {
    const { job } = entry;
    job.status = "running";
    running.add(job.id);
    emit("job:started", job);

    renderer
      .render({
        project: entry.project,
        config: job.config,
        onProgress: (progress) => {
          if (job.status !== "running") return;
          job.progress = Math.min(1, Math.max(0, progress));
          emit("job:progress", job);
        },
        signal: entry.controller.signal,
      })
      .then((outputUri) => {
        if (job.status !== "running") return; // annulé entre-temps
        job.status = "completed";
        job.progress = 1;
        job.outputUri = outputUri;
        running.delete(job.id);
        emit("job:completed", job);
        schedule();
      })
      .catch((err: unknown) => {
        if (job.status !== "running") return; // déjà annulé
        job.status = "failed";
        job.error = err instanceof Error ? err.message : String(err);
        running.delete(job.id);
        emit("job:failed", job);
        schedule();
      });
  };

  return {
    enqueue: (project, config: ExportConfig) => {
      const job: ExportJob = {
        id: generateId(),
        status: "queued",
        progress: 0,
        config,
        createdAt: now(),
      };
      jobs.set(job.id, { job, project: snapshot(project), controller: new AbortController() });
      queue.push(job.id);
      queueMicrotask(schedule); // démarrage non-bloquant
      return job;
    },

    cancel: (jobId) => {
      const entry = jobs.get(jobId);
      if (!entry) return;
      const { job } = entry;
      if (job.status === "queued") {
        const i = queue.indexOf(jobId);
        if (i >= 0) queue.splice(i, 1);
        job.status = "cancelled";
      } else if (job.status === "running") {
        job.status = "cancelled";
        running.delete(jobId);
        entry.controller.abort();
        queueMicrotask(schedule);
      }
    },

    get: (jobId) => jobs.get(jobId)?.job ?? null,
    list: () => [...jobs.values()].map((e) => e.job),
    on: (event, cb) => {
      listeners[event].add(cb);
      return () => listeners[event].delete(cb);
    },
  };
}
