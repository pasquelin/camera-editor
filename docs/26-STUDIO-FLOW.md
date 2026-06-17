# 26 — Composant Studio & machine à états interne

> **Statut : ✅ stable.**

## Purpose

Décrire le **composant unique embarquable** `<MediaStudio />` et sa **machine à états
interne** qui enchaîne les étapes capture → édition → aperçu. C'est **un composant, pas
une application** : le SDK n'apporte **aucun routeur, aucune URL, aucun deep-link**.
L'app hôte place `<MediaStudio />` dans son propre écran et garde **sa** navigation.

## Concepts

### Un composant, des vues internes (pas des routes)

`<MediaStudio />` rend, à un instant donné, **une seule sous-vue** décidée par son
**état courant**. Changer d'étape = changer un état interne ; c'est un `switch`, pas
une navigation. → [ADR-0015](./ADR/0015-studio-internal-state-machine.md).

```
état "capture"  →  Caméra + toggle Photo/Vidéo
        │ (capture terminée / média importé)
        ▼
état "edit"     →  Éditeur (même habillage en Photo et en Vidéo)
        │ (édition terminée)
        ▼
état "preview"  →  Aperçu immédiat + export en arrière-plan (vignette + %)
```

- L'app hôte n'orchestre rien : elle monte `<MediaStudio />` et reçoit le résultat via
  callback (`onComplete` / `onExport`).
- Les transitions sont déclenchées par les **actions utilisateur** (capturer, terminer
  l'édition), toutes **internes** au composant.
- **Composable** : les sous-vues (`CameraView`, `PhotoEditor`, `VideoEditor`,
  `ExportPanel`) restent utilisables **seules** si l'intégrateur veut piloter les
  étapes lui-même. Par défaut, le composant les orchestre — donc **pas** de méga-
  composant à câbler. → [24-UI-COMPONENTS](./24-UI-COMPONENTS.md).

### Le toggle Photo/Vidéo pilote l'éditeur

Sur l'étape `capture`, l'utilisateur bascule **Photo/Vidéo**. Ce choix (ou la nature
du média importé) détermine quel éditeur s'affiche à l'étape `edit`. **L'habillage de
l'éditeur est identique** dans les deux cas (cf. parité ci-dessous).

### Éditeur unifié (même design photo et vidéo)

Il n'y a **qu'un seul habillage d'éditeur** : barre d'outils, tiroir d'outils, panneau
de calques/timeline et zone d'aperçu sont **identiques** en Photo et en Vidéo, pour la
cohérence visuelle. Seuls **les outils disponibles** et l'affichage de la timeline
s'adaptent au contenu (la timeline apparaît dès que le projet a une durée — vidéo, ou
photo animée). → [17-PHOTO-EDITOR](./17-PHOTO-EDITOR.md), [18-VIDEO-EDITOR](./18-VIDEO-EDITOR.md).

## Interfaces (TS)

```ts
type StudioStep = "capture" | "edit" | "preview";
type StudioMode = "photo" | "video";

interface StudioState {
  step: StudioStep;
  mode: StudioMode;
  projectId: string;
}

// Contrôleur headless de la machine à états (exposé via useStudioFlow)
interface StudioController {
  readonly state: StudioState;
  setMode(mode: StudioMode): void;        // toggle Photo/Vidéo (étape capture)
  goTo(step: StudioStep): void;           // saut direct (si l'étape est activée)
  next(): void;
  back(): void;
  finishEditing(): void;                  // edit → preview (+ job export si auto)
}
```

### Le composant

```tsx
import { MediaStudio } from "@media-studio/sdk";

<MediaStudio
  flow={{ steps: ["capture", "edit", "preview"], initialMode: "video" }}
  onComplete={(result) => {/* projet finalisé */}}
  onExport={(uri) => {/* asset exporté */}}
/>;
```

### Mode headless du flow

```ts
import { useStudioFlow } from "@media-studio/sdk/headless";

const flow = useStudioFlow(editor);   // StudioController
flow.setMode("photo");
flow.finishEditing();                 // passe à l'aperçu, déclenche le job d'export
```

## Configuration

Le flow est **entièrement paramétrable** ([12-CONFIGURATION](./12-CONFIGURATION.md)) :

```ts
interface StudioFlowConfig {
  steps?: StudioStep[];          // défaut ["capture", "edit", "preview"]
  initialStep?: StudioStep;      // défaut "capture"
  initialMode?: StudioMode;      // défaut "video"
  allowModeToggle?: boolean;     // toggle Photo/Vidéo, défaut true
  preview?: boolean;             // afficher l'étape aperçu, défaut true
  autoExportOnFinish?: boolean;  // lancer l'export en fin d'édition, défaut true
}
```

- **Désactiver l'aperçu** : `preview: false` (ou retirer `"preview"` de `steps`) —
  l'édition terminée déclenche directement l'export (ou rend la main à l'hôte).
- **Démarrer sur l'éditeur** : `steps: ["edit", "preview"]` + média fourni → pas de
  caméra.
- **Caméra seule**, **éditeur seul**, **export seul** : on compose `steps` à volonté.
- Chaque sous-vue reste remplaçable par slot et thémée par tokens (design unifié).

## Décisions liées

- [ADR-0015](./ADR/0015-studio-internal-state-machine.md) — machine à états interne (pas de routeur).
- [ADR-0016](./ADR/0016-background-export-jobs.md) — aperçu + export en arrière-plan.
- [ADR-0009](./ADR/0009-headless-first-config-layers.md) — flow disponible aussi en headless.

## Cross-refs

- [24-UI-COMPONENTS](./24-UI-COMPONENTS.md) — sous-vues orchestrées, design unifié.
- [27-BACKGROUND-JOBS](./27-BACKGROUND-JOBS.md) — aperçu immédiat + export non-bloquant.
- [13-STATE-DATAFLOW](./13-STATE-DATAFLOW.md) — état du flow (step/mode).
- [16-CAMERA](./16-CAMERA.md) — étape capture (toggle Photo/Vidéo).
