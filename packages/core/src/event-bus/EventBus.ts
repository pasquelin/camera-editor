import type { EditorEventMap } from "../types/events";

type Listener<T> = (payload: T) => void;
type EmitArgs<T> = [T] extends [void] ? [] : [T];

/**
 * Bus d'événements typé, pub/sub. Communication découplée entre modules.
 * Voir docs/01-ARCHITECTURE.md (Annexe B) et docs/13-STATE-DATAFLOW.md.
 */
export class EventBus<Events = EditorEventMap> {
  private readonly listeners: { [K in keyof Events]?: Set<Listener<Events[K]>> } = {};

  /** Abonne un listener. Renvoie une fonction de désabonnement. */
  on<K extends keyof Events>(event: K, listener: Listener<Events[K]>): () => void {
    const set = (this.listeners[event] ??= new Set<Listener<Events[K]>>());
    set.add(listener);
    return () => this.off(event, listener);
  }

  off<K extends keyof Events>(event: K, listener: Listener<Events[K]>): void {
    this.listeners[event]?.delete(listener);
  }

  emit<K extends keyof Events>(event: K, ...args: EmitArgs<Events[K]>): void {
    const set = this.listeners[event];
    if (!set) return;
    const payload = (args as ReadonlyArray<unknown>)[0] as Events[K];
    for (const listener of set) listener(payload);
  }

  clear(): void {
    for (const key of Object.keys(this.listeners) as (keyof Events)[]) {
      delete this.listeners[key];
    }
  }
}
