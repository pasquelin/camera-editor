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

## Deux modes d'intégration

| Mode | Quand | Comment |
|------|-------|---------|
| **Montage direct** | Un seul écran de création dans ton app | `<MediaStudio flow={…} />` posé dans cet écran. |
| **Provider racine** (recommandé app-wide) | Création accessible **de partout**, traitement **non-bloquant** visible sur tous les écrans | `<MediaStudioProvider>` à la racine + `useMediaStudio().open()`. |

### Provider racine & API impérative `open()`

Pour le modèle « façon TikTok » — ouvrir l'éditeur de n'importe où et voir la
progression sur **tous** les écrans sans rien bloquer — on monte **un Provider unique à
la racine** de l'app. Il ne rend pas l'éditeur par défaut : il fournit un **contexte**
(jobs, progression) et une **API impérative**. L'éditeur est présenté **en overlay
plein écran via un portail**, **au-dessus** de ta navigation — **toujours pas de
routeur** ([ADR-0017](./ADR/0017-root-provider-portal-presentation.md)).

```tsx
// À la racine, UNE fois, au-dessus de toute ta navigation
import { MediaStudioProvider } from "@media-studio/sdk";

<MediaStudioProvider>
  <App />                {/* tes écrans / ta navigation, intacts */}
</MediaStudioProvider>;
```

```tsx
// Depuis n'importe quel écran : sur un bouton OU au load de l'écran
import { useMediaStudio } from "@media-studio/sdk";

function FeedScreen() {
  const studio = useMediaStudio();
  useEffect(() => {
    // ouverture au montage de l'écran si souhaité :
    // studio.open({ mode: "video" });
  }, []);
  return <CreateButton onPress={() => studio.open({ mode: "video" })} />;
}
```

```ts
interface MediaStudioContext {
  open(opts?: { mode?: StudioMode; projectId?: string }): void;  // overlay plein écran
  close(): void;
  jobs: ExportJob[];               // jobs d'export en cours (lecture seule)
  activeProgress: number | null;   // % global agrégé pour la vignette
}

const studio = useMediaStudio();   // disponible partout sous le Provider
```

Ce que le **Provider** garantit :

- **Présentation par portail** : l'éditeur flotte au-dessus de l'app ; **ta navigation
  reste intacte** (pas d'URL, pas de pile poussée par le SDK).
- **Jobs persistants** : à la fermeture de l'éditeur, les jobs d'export **continuent en
  arrière-plan** ; ils sont détenus par le Provider (racine), pas par l'écran.
  → [27-BACKGROUND-JOBS](./27-BACKGROUND-JOBS.md).
- **Vignette globale** : `<ExportProgress />` est rendu par le Provider **au-dessus de
  tous les écrans** → l'utilisateur voit le `%` partout et **continue à naviguer**.
- **Drafts** : le projet est persisté (reprise possible) — rien n'est perdu.

> L'objectif central : **ne jamais bloquer l'utilisateur** sur un traitement. Il valide,
> l'éditeur se ferme, il navigue librement, la vignette progresse au-dessus de tout.

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
- **Présentation** : `open()` ouvre l'éditeur en overlay plein écran (portail). Le
  Provider accepte une config de présentation (animation, `dismissable`…).

## Décisions liées

- [ADR-0015](./ADR/0015-studio-internal-state-machine.md) — machine à états interne (pas de routeur).
- [ADR-0016](./ADR/0016-background-export-jobs.md) — aperçu + export en arrière-plan.
- [ADR-0017](./ADR/0017-root-provider-portal-presentation.md) — Provider racine + présentation par portail.
- [ADR-0009](./ADR/0009-headless-first-config-layers.md) — flow disponible aussi en headless.

## Cross-refs

- [24-UI-COMPONENTS](./24-UI-COMPONENTS.md) — sous-vues orchestrées, design unifié.
- [27-BACKGROUND-JOBS](./27-BACKGROUND-JOBS.md) — aperçu immédiat + export non-bloquant.
- [13-STATE-DATAFLOW](./13-STATE-DATAFLOW.md) — état du flow (step/mode).
- [16-CAMERA](./16-CAMERA.md) — étape capture (toggle Photo/Vidéo).
