import type { AssetManager } from "../asset-manager/AssetManager";
import type { EventBus } from "../event-bus/EventBus";
import type { ObjectRegistry } from "../object-registry/ObjectRegistry";
import type { ProjectManager } from "../project-manager/ProjectManager";

/** Contexte fourni à chaque commande lors de son exécution. */
export interface EditorContext {
  project: ProjectManager;
  objects: ObjectRegistry;
  events: EventBus;
  assets: AssetManager;
}

export interface Command {
  id: string;
  execute(context: EditorContext): void;
  undo(context: EditorContext): void;
}

export type CommandFactory = (payload: unknown) => Command;

export const DEFAULT_UNDO_STACK_SIZE = 50;

/**
 * Toutes les mutations du projet passent par le CommandBus (undo/redo, snapshots).
 * Voir docs/01-ARCHITECTURE.md (Annexe A) et docs/ADR/0007-mutations-commandbus-undo.md.
 */
export class CommandBus {
  private readonly factories = new Map<string, CommandFactory>();
  private readonly undoStack: Command[] = [];
  private readonly redoStack: Command[] = [];
  private readonly stackListeners = new Set<() => void>();

  constructor(
    private readonly context: EditorContext,
    private readonly maxUndo: number = DEFAULT_UNDO_STACK_SIZE,
  ) {}

  /** Enregistre une fabrique de commande sous un nom `namespace.verb`. */
  register(name: string, factory: CommandFactory): void {
    if (this.factories.has(name)) {
      throw new Error(`CommandBus: commande déjà enregistrée: "${name}"`);
    }
    this.factories.set(name, factory);
  }

  execute(name: string, payload?: unknown): void {
    const factory = this.factories.get(name);
    if (!factory) throw new Error(`CommandBus: commande inconnue: "${name}"`);
    const command = factory(payload);
    command.execute(this.context);
    this.undoStack.push(command);
    if (this.undoStack.length > this.maxUndo) this.undoStack.shift();
    this.redoStack.length = 0;
    this.emitStackChanged();
  }

  undo(): void {
    const command = this.undoStack.pop();
    if (!command) return;
    command.undo(this.context);
    this.redoStack.push(command);
    this.emitStackChanged();
  }

  redo(): void {
    const command = this.redoStack.pop();
    if (!command) return;
    command.execute(this.context);
    this.undoStack.push(command);
    this.emitStackChanged();
  }

  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  /** S'abonne aux changements de pile (undo/redo). Voir docs/13-STATE-DATAFLOW.md. */
  on(event: "stack:changed", listener: () => void): () => void {
    void event;
    this.stackListeners.add(listener);
    return () => {
      this.stackListeners.delete(listener);
    };
  }

  private emitStackChanged(): void {
    for (const listener of this.stackListeners) listener();
  }
}
