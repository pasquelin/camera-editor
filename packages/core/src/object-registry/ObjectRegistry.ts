import type { EditorObject } from "../types/project";
import type { MigrateFunction } from "../schema-registry/SchemaRegistry";

export type JSONSchema = Record<string, unknown>;

export interface ObjectDefinition<T extends EditorObject = EditorObject> {
  type: string;
  schema: JSONSchema;
  defaultValues: () => T;
  validate: (obj: unknown) => boolean;
  migrate?: Record<string, MigrateFunction>;
}

/**
 * Registre des types d'objets éditables (built-in + plugins). Point d'extension
 * ouvert du modèle. Voir docs/02-PROJECT-SCHEMA.md et docs/06-PLUGIN-API.md.
 */
export class ObjectRegistry {
  private readonly definitions = new Map<string, ObjectDefinition>();

  register(type: string, definition: ObjectDefinition): void {
    if (this.definitions.has(type)) {
      throw new Error(`ObjectRegistry: type déjà enregistré: "${type}"`);
    }
    this.definitions.set(type, definition);
  }

  get(type: string): ObjectDefinition | null {
    return this.definitions.get(type) ?? null;
  }

  list(): string[] {
    return [...this.definitions.keys()];
  }
}
