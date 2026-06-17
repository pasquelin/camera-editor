/**
 * Petite Map nommée avec garde anti-doublon, mutualisée par les registres du Core
 * (ObjectRegistry, fabriques du CommandBus, PluginManager). Centralise la politique
 * « un enregistrement par clé ».
 */
export class RegistryMap<V> {
  private readonly entries = new Map<string, V>();

  set(key: string, value: V, label = "RegistryMap"): void {
    if (this.entries.has(key)) {
      throw new Error(`${label}: "${key}" déjà enregistré`);
    }
    this.entries.set(key, value);
  }

  get(key: string): V | null {
    return this.entries.get(key) ?? null;
  }

  has(key: string): boolean {
    return this.entries.has(key);
  }

  delete(key: string): boolean {
    return this.entries.delete(key);
  }

  keys(): string[] {
    return [...this.entries.keys()];
  }

  values(): V[] {
    return [...this.entries.values()];
  }
}
