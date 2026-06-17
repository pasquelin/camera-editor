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

### Détenu par le Provider racine, visible partout

Le `JobQueue` vit dans le **`MediaStudioProvider`** monté à la racine de l'app
([26-STUDIO-FLOW](./26-STUDIO-FLOW.md)), **pas** dans l'écran d'édition. Conséquence :
quand l'éditeur se ferme, **les jobs continuent** et la **vignette globale**
(`<ExportProgress />`) reste affichée au-dessus de **tous** les écrans. L'utilisateur
navigue librement pendant le traitement.

### Persistance & tâche native de fond (survie au backgrounding)

L'encodage tourne sur un **thread natif** (dispatch queue iOS / coroutine Android),
jamais sur le thread JS — l'UI ne gèle pas. Pour **survivre au passage en arrière-plan**
de l'app, le job s'appuie sur les **tâches de fond de l'OS**, exposées via un module
natif Expo :

| Plateforme | Mécanisme |
|-----------|-----------|
| iOS | `beginBackgroundTask` (sursis court) / `BGProcessingTask` (rendu long) |
| Android | `WorkManager` / Foreground Service (notification de progression) |

Les jobs sont **persistés** : leur état est réhydraté au redémarrage de l'app ; un job
interrompu peut reprendre ou être relancé.

### Drafts (rien n'est perdu)

Le projet en cours est sauvegardé en **draft** local (`ProjectManager.save`,
[02-PROJECT-SCHEMA](./02-PROJECT-SCHEMA.md)). L'utilisateur peut **quitter et reprendre**
son montage ; le snapshot d'export et le draft vivant sont indépendants.

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

### UI — vignette de progression globale

`<ExportProgress />` ([24-UI-COMPONENTS](./24-UI-COMPONENTS.md)), rendu par le
**Provider racine**, affiche la **vignette + le pourcentage** au-dessus de **tous** les
écrans, à la TikTok, sans bloquer l'interaction — l'utilisateur continue de naviguer.

## Configuration

- **Aperçu activable/désactivable** : `flow.preview` ([26-STUDIO-FLOW](./26-STUDIO-FLOW.md))
  décide si l'étape aperçu est montrée ; l'export en background reste possible sans elle.
- **Concurrence** : nombre de jobs simultanés configurable (`jobs.maxConcurrent`,
  défaut 1).
- **Vignette** : affichage de la vignette de progression activable (`jobs.showThumbnail`,
  défaut true) ; intervalle de mise à jour du `%` configurable.
- **Persistance** : reprise des jobs au redémarrage activable (`jobs.persist`, défaut
  true) ; survie au backgrounding via tâche native.
- **Annulation** : `JobQueue.cancel(jobId)` interrompt proprement ; le projet vivant
  est intact.
- Le moteur d'export sous-jacent (FFmpeg / natif) est inchangé — le job est une
  **enveloppe asynchrone** autour de l'`ExportRenderer`. → [09-EXPORT-ENGINE](./09-EXPORT-ENGINE.md).

## Décisions liées

- [ADR-0016](./ADR/0016-background-export-jobs.md) — jobs d'export en arrière-plan + snapshot.
- [ADR-0017](./ADR/0017-root-provider-portal-presentation.md) — jobs détenus par le Provider racine (visibles partout).
- [ADR-0007](./ADR/0007-mutations-commandbus-undo.md) — snapshot immuable du projet.
- [ADR-0010](./ADR/0010-preview-export-pipeline-split.md) — aperçu (preview) ≠ rendu (export).

## Cross-refs

- [09-EXPORT-ENGINE](./09-EXPORT-ENGINE.md) — l'ExportRenderer enveloppé par le job.
- [26-STUDIO-FLOW](./26-STUDIO-FLOW.md) — `finishEditing()` déclenche l'aperçu + le job.
- [13-STATE-DATAFLOW](./13-STATE-DATAFLOW.md) — état des jobs (store).
- [24-UI-COMPONENTS](./24-UI-COMPONENTS.md) — `<ExportProgress />` (vignette).
