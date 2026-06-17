# 02 — Project Schema

## Purpose

Définir le **modèle de données** du SDK : la structure d'un projet, le catalogue
complet des objets éditables, leur enregistrement dans l'`ObjectRegistry`, et le
mécanisme de **versionnage / migration** via le `SchemaRegistry`. C'est le contrat
que sérialisent `ProjectManager.export()` et que valide l'import.

## Concepts

- **Project** — document JSON, source de vérité unique, versionné.
- **Track** — collection ordonnée d'objets d'un même domaine (video, audio, text…).
- **EditorObject** — unité éditable ; tous les objets partagent une base commune.
- **ObjectDefinition** — métadonnée enregistrée qui décrit comment créer, valider
  et migrer un type d'objet. C'est le point d'extension ouvert du modèle.
- **Snapshot** — copie immuable d'un `Project` pour undo/redo.

## Interfaces (TS)

### Structure du projet

```ts
interface Project {
  version: string;        // ex. "1.0.0" — pilote les migrations
  id: string;             // uuid
  createdAt: string;      // ISO8601
  updatedAt: string;      // ISO8601
  duration: number;       // ms, durée totale calculée
  aspectRatio: "9:16" | "16:9" | "1:1" | "4:3";
  tracks: {
    video: VideoObject[];
    audio: AudioObject[];
    text: TextObject[];
    sticker: StickerObject[];
    filter: FilterObject[];
  };
}
```

### Base commune

```ts
interface EditorObject {
  id: string;
  type: string;        // clé dans l'ObjectRegistry

  startTime: number;   // ms
  endTime: number;     // ms

  x: number;
  y: number;
  width: number;
  height: number;

  rotation: number;    // degrés
  scale: number;       // 1.0 = 100%
  opacity: number;     // 0–1

  locked: boolean;
  visible: boolean;
}
```

### Catalogue des objets built-in

```ts
interface VideoObject extends EditorObject {
  source: string;
  trim: { start: number; end: number };
  crop: { x: number; y: number; width: number; height: number };
  speed: number;       // 0.25–4.0
  volume: number;
  muted: boolean;
  reversed: boolean;
}

interface ImageObject extends EditorObject {
  source: string;
  crop: { x: number; y: number; width: number; height: number };
}

interface TextObject extends EditorObject {
  content: string;
  style: TextStyle;
  animation: TextAnimation | null;
}

interface StickerObject extends EditorObject {
  source: string;
  format: "png" | "svg" | "gif" | "lottie";
  animation: StickerAnimation | null;
}

interface AudioObject extends EditorObject {
  source: string;
  volume: number;      // 0–2
  fadeIn: number;      // ms
  fadeOut: number;     // ms
  speed: number;       // 0.5–2.0
  loop: boolean;
  trim: { start: number; end: number };
}

interface FilterObject extends EditorObject {
  filterId: string;
  intensity: number;   // 0–1
  params: Record<string, number>;
}
```

### Types de style et d'animation

```ts
interface TextStyle {
  fontFamily: string;
  fontSize: number;
  color: string;
  gradient?: { start: string; end: string; angle: number };
  stroke?: { color: string; width: number };
  background?: { color: string; padding: number; borderRadius: number };
  shadow?: { color: string; blur: number; offsetX: number; offsetY: number };
  letterSpacingPx: number;
  lineHeight: number;
  align: "left" | "center" | "right";
  opacity: number;
}

type TextAnimation =
  | "fadeIn" | "fadeOut"
  | "slideUp" | "slideDown" | "slideLeft" | "slideRight"
  | "zoom" | "bounce" | "typewriter";

// StickerAnimation : non énuméré dans le brief — valeurs inférées (à valider).
type StickerAnimation = "fadeIn" | "fadeOut" | "zoom" | "bounce" | "pulse" | "spin";

interface FilterParams {
  intensity: number;     // 0–1
  contrast: number;      // -1–1
  saturation: number;    // -1–1
  brightness: number;    // -1–1
  temperature: number;   // -1–1
}
```

> Note : `FilterObject.params` est un `Record<string, number>` libre (extensible
> par plugin) ; `FilterParams` est la **forme canonique** des params built-in.

## L'ObjectRegistry — point d'extension

```ts
interface ObjectDefinition {
  type: string;
  schema: JSONSchema;
  defaultValues: () => EditorObject;
  validate: (obj: unknown) => boolean;
  migrate?: Record<string, MigrateFunction>;
}

interface ObjectRegistry {
  register(type: string, definition: ObjectDefinition): void;
  get(type: string): ObjectDefinition | null;
  list(): string[];
}
```

Enregistrements built-in (V1) :

```ts
registry.register("video",   VideoObjectDefinition);
registry.register("image",   ImageObjectDefinition);
registry.register("text",    TextObjectDefinition);
registry.register("audio",   AudioObjectDefinition);
registry.register("sticker", StickerObjectDefinition);
registry.register("filter",  FilterObjectDefinition);
```

Extension par plugin (sans toucher au Core) :

```ts
registry.register("face-anchor", FaceAnchorObjectDefinition); // plugin face-tracking
registry.register("caption",     CaptionObjectDefinition);    // plugin ai
```

## Versionnage et migrations

> **Règle d'or** : toute modification d'une interface `EditorObject` existante
> **déclenche une migration enregistrée**. On ne casse jamais un projet sauvegardé.

```ts
type MigrateFunction = (project: Project) => Project;

interface SchemaRegistry {
  registerMigration(from: string, to: string, migrate: MigrateFunction): void;
  migrate(project: Project, targetVersion: string): Project;
}
```

Exemple — renommage d'un champ de style :

```ts
SchemaRegistry.registerMigration("1.0.0", "1.1.0", (project) => {
  project.tracks.text = project.tracks.text.map((obj) => ({
    ...obj,
    style: {
      ...obj.style,
      letterSpacingPx: obj.style.letterSpacing,
      letterSpacing: undefined,
    },
  }));
  return project;
});
```

À l'import, `ProjectManager` lit `project.version`, applique en chaîne les
migrations jusqu'à la version cible, puis valide via les `ObjectDefinition`.

## ProjectManager — capacités

```ts
interface ProjectManager {
  load(json: string): Project;          // parse + migrate + validate
  export(): string;                     // sérialise le projet courant
  save(): Promise<void>;                // persiste via StorageAdapter injecté
  snapshot(): Snapshot;                 // copie immuable pour undo
  restore(snapshot: Snapshot): void;
  get(): Readonly<Project>;
}
```

- **Persistance** : AsyncStorage / FileSystem, via `StorageAdapter` **injecté**
  (le Core ne connaît pas l'implémentation — cf. [01-ARCHITECTURE](./01-ARCHITECTURE.md)).
- **Snapshot** : utilisé par le CommandBus pour les opérations destructives
  (split, merge, reverse). → [ADR-0007](./ADR/0007-mutations-commandbus-undo.md).

## Configuration

- Les **types d'objets** sont configurables : un intégrateur ou un plugin enrichit
  le modèle via `ObjectRegistry.register` sans modifier le Core.
- `aspectRatio` est un paramètre de projet, exposé dans la config de création
  (cf. [12-CONFIGURATION](./12-CONFIGURATION.md)).

## Configuration

- `maxVideoTracks` : 3 par défaut, configurable via `config.limits`
  (appliqué à la création/insertion, pas au schéma JSON lui-même).
- `maxAudioTracks` : 5 par défaut, configurable via `config.limits`.
- `VideoObject.speed` : plage `[0.25, 4.0]` par défaut, ajustable via configuration.
- `AudioObject.speed` : plage `[0.5, 2.0]` par défaut, ajustable via configuration.
- `undoStackSize` : 50 états par défaut, configurable via `config.history`.
  → [12-CONFIGURATION](./12-CONFIGURATION.md).

## Décisions liées

- [ADR-0008](./ADR/0008-extensibility-object-schema-registry.md) — registries comme points d'extension.
- [ADR-0007](./ADR/0007-mutations-commandbus-undo.md) — snapshots et undo.

## Cross-refs

- [01-ARCHITECTURE](./01-ARCHITECTURE.md) — où vit le ProjectManager.
- [06-PLUGIN-API](./06-PLUGIN-API.md) — comment un plugin enregistre un type d'objet.
- [13-STATE-DATAFLOW](./13-STATE-DATAFLOW.md) — synchro projet ↔ stores.
