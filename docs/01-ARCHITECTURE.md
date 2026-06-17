# 01 — Architecture

## Purpose

Décrire les couches du SDK, les **règles de dépendances** qui les gouvernent, et le
**flux de données** d'une mutation. C'est le document qui garantit que le système
reste découplé et maintenable dans le temps.

## Concepts

### Vue en couches

```
┌─────────────────────────────────────────────┐
│                    UI                        │  ← remplaçable, zéro logique métier
└────────────────────┬────────────────────────┘
                     │
┌────────────────────▼────────────────────────┐
│                  Runtime                     │  ← play · pause · seek · clock · sync
│  orchestre : Timeline + Renderer + Audio     │
└──────┬──────────────┬───────────────┬────────┘
       │              │               │
┌──────▼──────┐ ┌─────▼──────┐ ┌──────▼─────┐
│  Timeline   │ │  Renderer  │ │   Audio    │
│             │ │ Preview /  │ │   Engine   │
│             │ │  Export    │ │            │
└──────┬──────┘ └─────┬──────┘ └──────┬─────┘
       │              │               │
┌──────▼──────────────▼───────────────▼───────┐
│                    Core                      │  ← aucune dépendance externe
│  ProjectManager · CommandBus · EventBus      │
│  PluginManager · ObjectRegistry              │
│  SchemaRegistry · AssetManager               │
└──────────────────────────────────────────────┘
```

### Règles de dépendances (invariants)

> Ces règles sont **vérifiables statiquement** (cf. frontières d'import,
> [11-MONOREPO](./11-MONOREPO.md)). Une violation = un build cassé.

1. **Core ne dépend de rien.** Aucune dépendance npm externe, aucune UI, aucun
   accès réseau (délégué via interfaces). C'est le seul package qui n'importe
   personne d'autre du monorepo.
2. **Tous les plugins dépendent du Core**, jamais l'inverse.
3. **Le Runtime orchestre** Timeline / Renderer / Audio mais **ne dépend pas de
   l'UI** et ne contient **aucune logique de rendu**.
4. **L'UI ne contient aucune logique métier.** Elle lit l'état et émet des
   commandes ; elle est entièrement remplaçable.
5. **Toute mutation passe par le CommandBus.** Aucun module ne mute le projet
   directement.

### Modules du Core

| Module | Responsabilité |
|--------|----------------|
| `ProjectManager` | Source de vérité unique du projet (load/save/snapshot/migrate). |
| `CommandBus` | Exécute les commandes, gère undo/redo. |
| `EventBus` | Communication découplée entre modules (pub/sub). |
| `PluginManager` | Enregistre/détruit les plugins (avec vérif. signature). |
| `ObjectRegistry` | Registre des types d'objets éditables (built-in + plugins). |
| `SchemaRegistry` | Migrations de schéma entre versions de projet. |
| `AssetManager` | Import, cache et cycle de vie des assets. |

Détails des contrats : [02-PROJECT-SCHEMA](./02-PROJECT-SCHEMA.md).

## Interfaces (TS)

### Le Core est sans dépendance et sans I/O

Les capacités « externes » (réseau, stockage, licence, sécurité) sont **injectées**
au Core via interfaces — jamais importées :

```ts
interface CoreDependencies {
  storage: StorageAdapter;        // AsyncStorage / FileSystem injecté
  license?: LicenseValidator;     // injecté par @media-studio/licensing
  security?: SecurityLayer;       // injecté par @media-studio/security
  network?: NetworkAdapter;       // injecté ; le Core ne fait jamais de fetch
}

class Core {
  readonly project: ProjectManager;
  readonly commands: CommandBus;
  readonly events: EventBus;
  readonly plugins: PluginManager;
  readonly objects: ObjectRegistry;
  readonly schemas: SchemaRegistry;
  readonly assets: AssetManager;

  constructor(deps: CoreDependencies) {}
}
```

### Le contexte d'exécution d'une commande

```ts
interface EditorContext {
  project: ProjectManager;
  objects: ObjectRegistry;
  events: EventBus;
  assets: AssetManager;
}

interface Command {
  id: string;
  execute(context: EditorContext): void;
  undo(context: EditorContext): void;
}
```

## Flux de données — une mutation de bout en bout

Le flux est **unidirectionnel**. Exemple : l'utilisateur ajoute un texte.

```
UI  ──execute("text.create", payload)──▶  CommandBus
CommandBus ──snapshot + cmd.execute()──▶  ProjectManager   (source de vérité muté)
ProjectManager ───────────────────────▶  EventBus.emit("object:updated", obj)
EventBus ──▶ Renderer (invalidate)  ──▶ recompose le calque
EventBus ──▶ Zustand stores         ──▶ re-render ciblé de l'UI
```

- Le **CommandBus** prend un snapshot avant les opérations destructives, empile la
  commande (`undoStack`, taille configurable — défaut 50), et délègue l'application à `ProjectManager`.
- Le **ProjectManager** est la seule source de vérité ; il émet les événements.
- Les abonnés (Renderer, stores Zustand, Timeline) réagissent en lecture seule.
  → mapping état/réactivité détaillé dans [13-STATE-DATAFLOW](./13-STATE-DATAFLOW.md).

## Configuration

L'architecture rend le paramétrage possible par **construction** :

- Chaque couche est un point de substitution (UI remplaçable, Renderer
  attachable/détachable, dépendances du Core injectées).
- Les **registries** (Object / Schema) sont les points d'extension ouverts : un
  plugin ajoute un type d'objet ou une migration sans toucher au Core.
- Les **capability flags** du composant racine activent/désactivent des sous-arbres
  entiers de l'architecture (ex. `enableTimeline={false}` ne monte jamais la couche
  Timeline). → [12-CONFIGURATION](./12-CONFIGURATION.md).

## Architecture RN / Expo

- **Modèle de threads** : logique JS (Core, stores), **UI thread** (Reanimated
  worklets — clock, gestes), **thread natif** (vidéo, GPU, encode/decode). La clock
  vit sur l'UI thread (`SharedValue`) pour rester fluide. → [03-RUNTIME](./03-RUNTIME.md).
- **New Architecture** (Fabric + TurboModules) ciblée pour tous les modules natifs.
  → [ADR-0006](./ADR/0006-native-expo-modules-new-arch.md).
- **Expo Modules API** pour le natif (Swift/Kotlin) + **config plugins** pour le
  setup, afin de rester *managed-compatible* (pas d'`eject` forcé).
  → [15-NATIVE-CONFIG-PLUGINS](./15-NATIVE-CONFIG-PLUGINS.md).

### Graphe de dépendances des packages (simplifié)

```
sdk ──▶ ui ──▶ runtime ──▶ {timeline, renderer/*, audio-engine}
                  └────────────────▶ core ◀──── (tout le monde)
plugins (dépôts séparés) ──────────▶ core
licensing / security ──(injectés)──▶ core
```

## Annexe A — Catalogue des commandes (CommandBus)

Toutes les mutations passent par ces namespaces. Un plugin en ajoute via
`registerCommand`. → [ADR-0007](./ADR/0007-mutations-commandbus-undo.md).

| Namespace  | Commandes |
|------------|-----------|
| `video`    | create, update, trim, split, merge, delete, reverse, speed |
| `image`    | create, update, crop, delete |
| `text`     | create, update, style, animate, delete |
| `sticker`  | create, update, animate, delete |
| `audio`    | create, update, trim, volume, fade, delete |
| `filter`   | create, update, delete |
| `project`  | save, load, export, reset |
| `timeline` | seek, zoom, snap |
| `asset`    | import, delete, cache |

API : `editor.execute(command, payload)`, `editor.undo()`, `editor.redo()`.
Stacks `undoStack` / `redoStack` ; snapshot avant opération destructive ;
seek/zoom **non enregistrés** (preview).

## Annexe B — Catalogue des événements (EventBus)

Communication découplée ; l'UI lit via les stores, jamais l'EventBus directement
(→ [13-STATE-DATAFLOW](./13-STATE-DATAFLOW.md)).

```ts
editor.on("object:selected",   (obj: EditorObject) => {});
editor.on("object:updated",    (obj: EditorObject) => {});
editor.on("object:deleted",    (id: string) => {});
editor.on("timeline:changed",  () => {});
editor.on("timeline:seeked",   (timeMs: number) => {});
editor.on("project:saved",     () => {});
editor.on("project:loaded",    (project: Project) => {});
editor.on("runtime:play",      () => {});
editor.on("runtime:pause",     () => {});
editor.on("export:started",    () => {});
editor.on("export:progress",   (pct: number) => {});
editor.on("export:completed",  (uri: string) => {});
editor.on("export:failed",     (err: Error) => {});
editor.on("asset:imported",    (asset: Asset) => {});
editor.on("license:validated", () => {});
editor.on("license:expired",   () => {});
```

## Décisions liées

- [ADR-0007](./ADR/0007-mutations-commandbus-undo.md) — mutations via CommandBus.
- [ADR-0008](./ADR/0008-extensibility-object-schema-registry.md) — extensibilité par registries.
- [ADR-0010](./ADR/0010-preview-export-pipeline-split.md) — séparation Preview/Export.
- [ADR-0006](./ADR/0006-native-expo-modules-new-arch.md) — Expo Modules API + New Arch.

## Cross-refs

- [02-PROJECT-SCHEMA](./02-PROJECT-SCHEMA.md) — le modèle de données manipulé.
- [03-RUNTIME](./03-RUNTIME.md) — l'orchestration de la lecture.
- [13-STATE-DATAFLOW](./13-STATE-DATAFLOW.md) — réactivité et frontières d'état.
- [11-MONOREPO](./11-MONOREPO.md) — application des frontières de dépendances.
