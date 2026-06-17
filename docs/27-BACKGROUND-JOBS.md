# 27 — Background Jobs (aperçu immédiat & export non-bloquant)

> **Statut : ✅ stable.**

## Purpose

Décrire le modèle **asynchrone non-bloquant** de traitement, façon TikTok : quand
l'utilisateur termine son montage, il obtient un **aperçu immédiat** et l'export part
en **job d'arrière-plan** (file, **% de progression**, **vignette loader**). Pendant ce
temps, l'utilisateur **continue à éditer et naviguer** dans son projet — rien ne bloque
l'UI. → [ADR-0016](./ADR/0016-background-export-jobs.md).

## Concepts

### Aperçu immédiat ≠ export

- **Aperçu** : la **Preview** temps réel (Skia + vidéo native) affiche le résultat
  **instantanément**, sans rendu offline. → [04-RENDERER](./04-RENDERER.md).
- **Export** : le rendu final qualité max part **en tâche de fond** ; il ne fige ni
  l'aperçu ni l'édition.

### Le job opère sur un snapshot

À l'`enqueue`, le job capture un **snapshot immuable** du projet. L'utilisateur peut
donc continuer à modifier le projet **vivant** sans corrompre le rendu en cours : le
job rend la version figée. → [02-PROJECT-SCHEMA](./02-PROJECT-SCHEMA.md) (snapshot),
[ADR-0007](./ADR/0007-mutations-commandbus-undo.md).

```
finishEditing()
     │
     ├─▶ Preview affiche l'aperçu immédiat (UI libre)
     │
     └─▶ JobQueue.enqueue(snapshot, config)
              │  (arrière-plan, async)
              ▼
        job: queued → running → completed (uri)
              │            │
              │            └─▶ vignette + % (job:progress)
              │
        l'utilisateur continue d'éditer / naviguer pendant ce temps
```

### Cycle de vie d'un job

```
queued ─▶ running ─▶ completed (outputUri)
   │         │
   │         └─▶ failed (error)
   └────────────▶ cancelled   (cancel())
```

## Interfaces (TS)

```ts
type JobStatus = "queued" | "running" | "completed" | "failed" | "cancelled";

interface ExportJob {
  id: string;
  status: JobStatus;
  progress: number;          // 0–1
  thumbnailUri?: string;     // vignette de progression (aperçu réduit)
  outputUri?: string;        // disponible quand status === "completed"
  error?: string;            // renseigné si "failed"
  config: ExportConfig;
  createdAt: string;         // ISO8601
}

interface JobQueue {
  enqueue(project: Project, config: ExportConfig): ExportJob;  // snapshot interne
  cancel(jobId: string): void;
  get(jobId: string): ExportJob | null;
  list(): ExportJob[];
  on(
    event: "job:started" | "job:progress" | "job:completed" | "job:failed",
    cb: (job: ExportJob) => void
  ): void;
}
```

### Événements (alignés sur l'EventBus)

Les événements globaux d'export restent émis ([01-ARCHITECTURE](./01-ARCHITECTURE.md) Annexe B) :
`export:started`, `export:progress(pct)`, `export:completed(uri)`, `export:failed(err)`.
Le `JobQueue` ajoute leur granularité **par job** (`job:progress`, etc.).

### UI — vignette de progression

Un composant `<ExportProgress />` ([24-UI-COMPONENTS](./24-UI-COMPONENTS.md)) affiche la
**vignette + le pourcentage** par-dessus l'éditeur, à la TikTok, sans bloquer l'interaction.

## Configuration

- **Aperçu activable/désactivable** : `flow.preview` ([26-STUDIO-FLOW](./26-STUDIO-FLOW.md))
  décide si l'étape aperçu est montrée ; l'export en background reste possible sans elle.
- **Concurrence** : nombre de jobs simultanés configurable (`jobs.maxConcurrent`,
  défaut 1).
- **Vignette** : affichage de la vignette de progression activable (`jobs.showThumbnail`,
  défaut true) ; intervalle de mise à jour du `%` configurable.
- **Annulation** : `JobQueue.cancel(jobId)` interrompt proprement ; le projet vivant
  est intact.
- Le moteur d'export sous-jacent (FFmpeg / natif) est inchangé — le job est une
  **enveloppe asynchrone** autour de l'`ExportRenderer`. → [09-EXPORT-ENGINE](./09-EXPORT-ENGINE.md).

## Décisions liées

- [ADR-0016](./ADR/0016-background-export-jobs.md) — jobs d'export en arrière-plan + snapshot.
- [ADR-0007](./ADR/0007-mutations-commandbus-undo.md) — snapshot immuable du projet.
- [ADR-0010](./ADR/0010-preview-export-pipeline-split.md) — aperçu (preview) ≠ rendu (export).

## Cross-refs

- [09-EXPORT-ENGINE](./09-EXPORT-ENGINE.md) — l'ExportRenderer enveloppé par le job.
- [26-STUDIO-FLOW](./26-STUDIO-FLOW.md) — `finishEditing()` déclenche l'aperçu + le job.
- [13-STATE-DATAFLOW](./13-STATE-DATAFLOW.md) — état des jobs (store).
- [24-UI-COMPONENTS](./24-UI-COMPONENTS.md) — `<ExportProgress />` (vignette).
