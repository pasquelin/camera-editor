# 13 — State & Data-flow

## Purpose

Définir **où vit chaque type d'état** et comment il circule, pour garantir des
performances RN correctes (zéro re-render inutile, animations sur l'UI thread) tout
en gardant une **source de vérité unique**. Ce document tranche la répartition entre
`ProjectManager`, **Zustand** et **Reanimated**.

## Concepts — trois réservoirs d'état, trois rôles

| Réservoir | Contient | Vit sur | Réactivité |
|-----------|----------|---------|-----------|
| **ProjectManager** (Core) | Le document : tracks, objets, durée | thread JS | source de vérité, muté via CommandBus |
| **Zustand stores** | État dérivé/éphémère de l'éditeur et de l'UI | thread JS | sélecteurs → re-render ciblé |
| **Reanimated `SharedValue`** | Clock, transforms de gestes | **UI thread** | worklets, 60fps, sans pont JS |

> Règle : **le projet n'est jamais dans Zustand.** Zustand reflète et dérive ; il ne
> possède pas la vérité. Toute mutation du projet passe par le CommandBus
> ([ADR-0007](./ADR/0007-mutations-commandbus-undo.md)), puis l'`EventBus` notifie
> les stores qui se synchronisent.

## Le flux unidirectionnel

```
                 execute(cmd)            mutation             emit(event)
   UI / hook ───────────────▶ CommandBus ────────▶ ProjectManager ─────────┐
       ▲                                                                     │
       │ re-render ciblé (sélecteur)                                         │
       │                                                                     ▼
   Zustand stores ◀────────────── sync sur événement ──────────────────  EventBus
       │                                                                     │
       │ snapshot ponctuel (JS)                                              ▼
       └───────────────────────────────────────────────▶ Renderer (invalidate)
```

La **clock** suit un chemin séparé, sur l'UI thread, sans passer par Zustand :

```
useFrameCallback ──▶ clock.value (SharedValue) ──▶ useAnimatedReaction ──▶ Timeline / Preview
```

## Découpage des stores Zustand

Quatre stores, frontières nettes, jamais fusionnés :

```ts
// 1) projectStore — miroir réactif du ProjectManager (lecture seule pour l'UI)
interface ProjectStore {
  version: string;
  duration: number;
  aspectRatio: AspectRatio;
  trackIds: { video: string[]; audio: string[]; /* … */ };
  // pas les objets complets : on indexe par id pour des sélecteurs fins
  objectsById: Record<string, EditorObject>;
}

// 2) editorStore — état d'édition éphémère (non persisté, non dans le projet)
interface EditorStore {
  selectionId: string | null;
  activeTool: ToolId | null;
  canUndo: boolean;
  canRedo: boolean;
  clipboard: EditorObject | null;
}

// 3) runtimeStore — état de lecture exposé au JS (l'autorité reste le Runtime)
interface RuntimeStore {
  isPlaying: boolean;
  isLooping: boolean;
  playbackRate: number;
  durationMs: number;
  // currentTime n'est PAS ici (c'est un SharedValue) — voir plus bas
}

// 4) uiStore — état purement visuel
interface UiStore {
  openPanel: PanelId | null;
  timelineZoom: number;
  theme: Theme;
}

// 5) studioStore — étape courante du composant Studio (machine à états interne)
interface StudioStore {
  step: "capture" | "edit" | "preview";   // vue rendue par <MediaStudio />
  mode: "photo" | "video";                 // toggle (pilote l'éditeur)
}                                          // → 26-STUDIO-FLOW (pas de routeur)

// 6) jobStore — jobs d'export en arrière-plan (non-bloquants)
interface JobStore {
  jobsById: Record<string, ExportJob>;     // id → { status, progress, thumbnailUri, … }
  activeJobIds: string[];
}                                          // → 27-BACKGROUND-JOBS
```

### Pourquoi `currentTime` n'est pas dans Zustand

Le temps courant change à chaque frame (jusqu'à 60×/s). Le mettre dans Zustand
provoquerait un re-render React par frame. Il vit donc en `SharedValue` (UI thread)
et n'est lu qu'à la demande (`runtime.getCurrentTime()`) ou consommé en worklet :

```ts
// composant Timeline — réagit à la clock sans re-render React
const currentTime = useSharedValue(0);
useAnimatedReaction(
  () => runtime.clock.value,
  (t) => { currentTime.value = t; }      // tout reste sur l'UI thread
);
```

## Synchronisation ProjectManager ↔ stores ↔ EventBus

```ts
// branchement unique, à l'initialisation de l'éditeur
core.events.on("object:updated", (obj) => {
  projectStore.setState((s) => ({
    objectsById: { ...s.objectsById, [obj.id]: obj },
  }));
});
core.events.on("object:deleted", (id) => { /* retire de objectsById + trackIds */ });
core.events.on("project:loaded", (p) => projectStore.getState().hydrate(p));
core.commands.on("stack:changed", () =>
  editorStore.setState({ canUndo: core.commands.canUndo(), canRedo: core.commands.canRedo() })
);
```

L'UI **ne s'abonne jamais directement à l'EventBus** : elle lit Zustand via des
sélecteurs. L'EventBus est l'unique pont Core → stores.

## Patterns anti-re-render

- **Sélecteurs atomiques** : `useProjectStore((s) => s.objectsById[id])`, jamais
  l'objet store entier.
- **Indexation par id** : l'UI d'un clip ne re-render que si *son* objet change.
- **`useShallow`** pour les listes d'ids ; comparaisons stables.
- **Séparer `editorStore` de `projectStore`** : changer la sélection ne re-render
  pas les calques de contenu.
- **Gestes et drags** : pendant un geste, on mute le `SharedValue` (UI thread) ;
  on ne `commit` au CommandBus qu'au `onEnd` du geste (une seule mutation + un seul
  snapshot undo).

## Frontière worklet / JS

```ts
// Dans un worklet (UI thread), pour repasser en JS on passe explicitement :
const commit = (x: number, y: number) => {
  "worklet";
  runOnJS(execute)("object.update", { id, x, y });   // commit unique en fin de geste
};
```

- Le **Runtime** détient l'autorité de lecture ; `runtimeStore` n'est qu'un reflet
  pour l'UI. → [03-RUNTIME](./03-RUNTIME.md).
- Aucun objet JS non sérialisable ne traverse vers un worklet.

## Configuration

- Les stores sont **internes** ; l'intégrateur ne les manipule pas directement.
- Le mode **headless** ([12-CONFIGURATION](./12-CONFIGURATION.md)) expose ces stores
  via des hooks stables (`useEditor`, `useRuntime`, `useTimeline`) — l'UI par défaut
  consomme exactement ces mêmes hooks.

## Fonctionnalités avancées des stores

### Persistance des stores éphémères

Le SDK supporte la **persistance optionnelle des stores éphémères** (`editorStore`,
`uiStore`) entre sessions. La persistance est activée via un `StorageAdapter` dédié
injecté à l'init : l'intégrateur choisit quels stores persister (sélection, outil
actif, zoom de timeline, thème, etc.) et quelle clé de stockage utiliser. Par défaut,
ces stores sont éphémères ; la persistance s'active explicitement.

### Time-travel debugging des stores

Le SDK intègre un **mode time-travel debugging** des stores Zustand : chaque mutation
de store est enregistrée en parallèle du CommandBus et peut être rejouée pas à pas
dans les outils de développement. Ce mode, activé via `debug: { timeTravelStores: true }`
à l'init, complète l'undo au niveau Command en exposant l'état intermédiaire de
chaque store à chaque étape du flux unidirectionnel.

## Décisions liées

- [ADR-0005](./ADR/0005-state-zustand.md) — choix de Zustand.
- [ADR-0004](./ADR/0004-shared-clock-reanimated.md) — clock en SharedValue.
- [ADR-0007](./ADR/0007-mutations-commandbus-undo.md) — mutations via CommandBus.

## Cross-refs

- [01-ARCHITECTURE](./01-ARCHITECTURE.md) — le flux unidirectionnel global.
- [03-RUNTIME](./03-RUNTIME.md) — l'autorité de la clock.
- [05-TIMELINE](./05-TIMELINE.md) — consommation de la clock en lecture seule.
