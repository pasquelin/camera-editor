import { describe, expect, it } from "vitest";
import { createEmptyProject } from "@media-studio/core";
import { createJobQueue } from "./job-queue";
import type { ExportConfig, ExportRenderInput, ExportRenderer, JobQueueDeps } from "./types";

const CONFIG: ExportConfig = {
  format: "mp4",
  resolution: "1080p",
  fps: 30,
  videoBitrate: 8000,
  audioBitrate: 128,
  codec: "h264",
  quality: 1,
};

interface Call {
  input: ExportRenderInput;
  resolve: (uri: string) => void;
  reject: (err: unknown) => void;
}

function recordingRenderer(): { renderer: ExportRenderer; calls: Call[] } {
  const calls: Call[] = [];
  const renderer: ExportRenderer = {
    render: (input) =>
      new Promise<string>((resolve, reject) => {
        calls.push({ input, resolve, reject });
      }),
  };
  return { renderer, calls };
}

/** Laisse s'écouler les microtâches (scheduling + résolutions de promesses). */
const tick = (): Promise<void> => new Promise((r) => setTimeout(r, 0));

function makeQueue(over: Partial<JobQueueDeps> = {}) {
  const { renderer, calls } = recordingRenderer();
  let n = 0;
  const queue = createJobQueue({
    renderer,
    now: () => "2026-06-17T00:00:00.000Z",
    generateId: () => `j${(n += 1)}`,
    ...over,
  });
  return { queue, calls };
}

describe("JobQueue — cycle de vie nominal", () => {
  it("enqueue → queued, puis running, progress, completed", async () => {
    const { queue, calls } = makeQueue();
    const events: string[] = [];
    queue.on("job:started", () => events.push("started"));
    queue.on("job:progress", (j) => events.push(`progress:${j.progress}`));
    queue.on("job:completed", (j) => events.push(`completed:${j.outputUri}`));

    const job = queue.enqueue(createEmptyProject(), CONFIG);
    expect(job.id).toBe("j1");
    expect(job.status).toBe("queued");
    expect(job.createdAt).toBe("2026-06-17T00:00:00.000Z");

    await tick();
    expect(queue.get("j1")?.status).toBe("running");
    expect(calls).toHaveLength(1);

    calls[0]!.input.onProgress(0.5);
    expect(queue.get("j1")?.progress).toBe(0.5);

    calls[0]!.resolve("file://out.mp4");
    await tick();
    const done = queue.get("j1")!;
    expect(done.status).toBe("completed");
    expect(done.outputUri).toBe("file://out.mp4");
    expect(done.progress).toBe(1);
    expect(events).toEqual(["started", "progress:0.5", "completed:file://out.mp4"]);
  });

  it("échec du renderer → failed avec message d'erreur", async () => {
    const { queue, calls } = makeQueue();
    let failed: string | undefined;
    queue.on("job:failed", (j) => (failed = j.error));

    queue.enqueue(createEmptyProject(), CONFIG);
    await tick();
    calls[0]!.reject(new Error("boom"));
    await tick();

    expect(queue.get("j1")?.status).toBe("failed");
    expect(failed).toBe("boom");
  });
});

describe("JobQueue — annulation", () => {
  it("cancel d'un job en file (queued) ne le lance pas", async () => {
    const { queue, calls } = makeQueue({ maxConcurrent: 1 });
    queue.enqueue(createEmptyProject(), CONFIG); // j1
    queue.enqueue(createEmptyProject(), CONFIG); // j2
    await tick();
    expect(calls).toHaveLength(1); // j1 running, j2 queued

    queue.cancel("j2");
    expect(queue.get("j2")?.status).toBe("cancelled");

    calls[0]!.resolve("out");
    await tick();
    expect(calls).toHaveLength(1); // j2 jamais lancé
  });

  it("cancel d'un job running l'interrompt (signal abort, pas de completed)", async () => {
    const { queue, calls } = makeQueue();
    let completed = false;
    queue.on("job:completed", () => (completed = true));
    queue.enqueue(createEmptyProject(), CONFIG);
    await tick();

    queue.cancel("j1");
    expect(queue.get("j1")?.status).toBe("cancelled");
    expect(calls[0]!.input.signal.aborted).toBe(true);

    calls[0]!.resolve("late"); // résolution tardive ignorée
    await tick();
    expect(queue.get("j1")?.status).toBe("cancelled");
    expect(completed).toBe(false);
  });
});

describe("JobQueue — concurrence", () => {
  it("respecte maxConcurrent puis enchaîne la file", async () => {
    const { queue, calls } = makeQueue({ maxConcurrent: 2 });
    queue.enqueue(createEmptyProject(), CONFIG); // j1
    queue.enqueue(createEmptyProject(), CONFIG); // j2
    queue.enqueue(createEmptyProject(), CONFIG); // j3
    await tick();
    expect(calls).toHaveLength(2); // 2 en parallèle, j3 en attente

    calls[0]!.resolve("out1");
    await tick();
    expect(calls).toHaveLength(3); // j3 démarre quand un slot se libère
  });
});

describe("JobQueue — snapshot & accès", () => {
  it("le job opère sur un snapshot figé (le projet vivant peut muter)", async () => {
    const { queue, calls } = makeQueue();
    const project = createEmptyProject();
    queue.enqueue(project, CONFIG);
    await tick();

    project.duration = 999; // mutation du projet vivant après enqueue
    expect(calls[0]!.input.project.duration).toBe(0); // snapshot intact
  });

  it("get/list exposent les jobs", async () => {
    const { queue } = makeQueue();
    queue.enqueue(createEmptyProject(), CONFIG);
    queue.enqueue(createEmptyProject(), CONFIG);
    expect(queue.list().map((j) => j.id)).toEqual(["j1", "j2"]);
    expect(queue.get("j1")?.id).toBe("j1");
    expect(queue.get("absent")).toBeNull();
  });
});
