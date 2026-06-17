import { AssetManager } from "../asset-manager/AssetManager";
import { CommandBus, type CommandFactory, type EditorContext } from "../command-bus/CommandBus";
import { EventBus } from "../event-bus/EventBus";
import { ObjectRegistry } from "../object-registry/ObjectRegistry";
import {
  PluginManager,
  type MediaStudioPlugin,
  type PluginVerifier,
} from "../plugin-manager/PluginManager";
import { ProjectManager } from "../project-manager/ProjectManager";
import { SchemaRegistry } from "../schema-registry/SchemaRegistry";
import type { EditorEventMap } from "../types/events";
import type { StorageAdapter } from "../types/storage";
import type { ObjectDefinition } from "../object-registry/ObjectRegistry";
import type { LicenseValidator } from "../types/license";
import { registerBuiltins } from "../builtins/registerBuiltins";

/** Dépendances injectées au Core. Aucune n'est requise (open-core sans I/O). */
export interface CoreDependencies {
  storage?: StorageAdapter;
  security?: PluginVerifier;
  /** Enregistre les types et commandes built-in au démarrage. Défaut : `true`. */
  builtins?: boolean;
  /** Validateur de licence injecté. Sans lui, périmètre open-source (aucun premium). */
  license?: LicenseValidator;
}

/**
 * Validateur par défaut : open-source, refuse toute capacité premium.
 * Miroir intentionnel de `createLicense("open-source")` du package licensing —
 * dupliqué ici car le Core ne doit dépendre d'aucun package (invariant open-core).
 */
const OPEN_SOURCE_LICENSE: LicenseValidator = {
  plan: "open-source",
  has: () => false,
};

/**
 * Agrège les modules du noyau et expose une façade (`execute`, `undo`, `on`…).
 * Voir docs/01-ARCHITECTURE.md.
 */
export class Core {
  readonly events: EventBus;
  readonly objects: ObjectRegistry;
  readonly schemas: SchemaRegistry;
  readonly assets: AssetManager;
  readonly project: ProjectManager;
  readonly commands: CommandBus;
  readonly plugins: PluginManager;
  /** Validateur de licence courant (injecté ou défaut open-source). */
  readonly license: LicenseValidator;

  constructor(deps: CoreDependencies = {}) {
    this.events = new EventBus();
    this.objects = new ObjectRegistry();
    this.schemas = new SchemaRegistry();
    this.assets = new AssetManager(this.events);
    this.project = new ProjectManager(this.events, deps.storage, this.schemas);

    const context: EditorContext = {
      project: this.project,
      objects: this.objects,
      events: this.events,
      assets: this.assets,
    };
    this.commands = new CommandBus(context);
    this.plugins = new PluginManager(this, deps.security);
    this.license = deps.license ?? OPEN_SOURCE_LICENSE;

    if (deps.builtins !== false) registerBuiltins(this);
  }

  execute(name: string, payload?: unknown): void {
    this.commands.execute(name, payload);
  }

  undo(): void {
    this.commands.undo();
  }

  redo(): void {
    this.commands.redo();
  }

  on<K extends keyof EditorEventMap>(
    event: K,
    listener: (payload: EditorEventMap[K]) => void,
  ): () => void {
    return this.events.on(event, listener);
  }

  registerCommand(name: string, factory: CommandFactory): void {
    this.commands.register(name, factory);
  }

  /** Enregistre un type d'objet (même API que les plugins). → docs/06-PLUGIN-API.md */
  registerObjectType(definition: ObjectDefinition): void {
    this.objects.register(definition.type, definition);
  }

  registerPlugin(plugin: MediaStudioPlugin): Promise<void> {
    return this.plugins.register(plugin);
  }
}
