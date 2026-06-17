import type { EventBus } from "../event-bus/EventBus";
import type { SchemaRegistry } from "../schema-registry/SchemaRegistry";
import type { Project, Snapshot } from "../types/project";
import type { StorageAdapter } from "../types/storage";
import { deepClone } from "../utils/clone";
import { genId } from "../utils/id";
import { nowIso } from "../utils/time";

export const CURRENT_PROJECT_VERSION = "1.0.0";
const STORAGE_KEY = "media-studio:project";

/** Crée un projet vide valide à la version courante. */
export function createEmptyProject(): Project {
  const now = nowIso();
  return {
    version: CURRENT_PROJECT_VERSION,
    id: genId(),
    createdAt: now,
    updatedAt: now,
    duration: 0,
    aspectRatio: "9:16",
    tracks: { video: [], audio: [], text: [], sticker: [], filter: [], transitions: [] },
  };
}

/**
 * Source de vérité unique du projet. Load/save/snapshot/migrate.
 * Voir docs/02-PROJECT-SCHEMA.md.
 */
export class ProjectManager {
  private project: Project;

  constructor(
    private readonly events: EventBus,
    private readonly storage?: StorageAdapter,
    private readonly schemas?: SchemaRegistry,
  ) {
    this.project = createEmptyProject();
  }

  get(): Readonly<Project> {
    return this.project;
  }

  setProject(project: Project): void {
    this.project = project;
    this.events.emit("project:loaded", this.project);
  }

  /** Parse + migre (si SchemaRegistry) vers la version courante. */
  load(json: string): Project {
    const parsed = JSON.parse(json) as Project;
    this.project = this.schemas
      ? this.schemas.migrate(parsed, CURRENT_PROJECT_VERSION)
      : parsed;
    this.events.emit("project:loaded", this.project);
    return this.project;
  }

  export(): string {
    return JSON.stringify(this.project);
  }

  async save(): Promise<void> {
    if (this.storage) await this.storage.write(STORAGE_KEY, this.export());
    this.events.emit("project:saved");
  }

  snapshot(): Snapshot {
    return deepClone(this.project);
  }

  restore(snapshot: Snapshot): void {
    this.project = deepClone(snapshot) as Project;
    this.events.emit("timeline:changed");
  }

  /** Applique une mutation au projet (utilisé par les commandes du CommandBus). */
  mutate(mutator: (project: Project) => void): void {
    mutator(this.project);
    this.project.updatedAt = nowIso();
    this.events.emit("timeline:changed");
  }
}
