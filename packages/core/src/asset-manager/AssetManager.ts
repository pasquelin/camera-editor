import type { EventBus } from "../event-bus/EventBus";
import type { Asset, AssetSource, AssetType } from "../types/assets";
import { genId } from "../utils/id";

/**
 * Service central de gestion des assets. Le Core ne fait pas d'I/O : la résolution
 * réelle (téléchargement, taille, MIME) est déléguée aux adapters/plugins.
 * Voir docs/08-ASSET-MANAGER.md.
 */
export class AssetManager {
  private readonly assets = new Map<string, Asset>();

  constructor(private readonly events: EventBus) {}

  async import(source: AssetSource): Promise<Asset> {
    const asset: Asset = {
      id: genId(),
      type: inferType(source),
      uri: resolveUri(source),
      source,
      size: 0,
      createdAt: new Date().toISOString(),
    };
    this.assets.set(asset.id, asset);
    this.events.emit("asset:imported", asset);
    return asset;
  }

  async cache(asset: Asset): Promise<void> {
    this.assets.set(asset.id, asset);
  }

  get(id: string): Asset | null {
    return this.assets.get(id) ?? null;
  }

  list(type?: AssetType): Asset[] {
    const all = [...this.assets.values()];
    return type ? all.filter((a) => a.type === type) : all;
  }

  async delete(id: string): Promise<void> {
    this.assets.delete(id);
  }

  async clearCache(): Promise<void> {
    this.assets.clear();
  }

  async getSize(): Promise<number> {
    let total = 0;
    for (const asset of this.assets.values()) total += asset.size;
    return total;
  }
}

function inferType(source: AssetSource): AssetType {
  // Placeholder : la résolution réelle du type sera fournie par l'adapter d'import.
  void source;
  return "image";
}

function resolveUri(source: AssetSource): string {
  switch (source.kind) {
    case "local":
      return source.path;
    case "remote":
      return source.url;
    case "marketplace":
      return `marketplace://${source.packId}/${source.assetId}`;
  }
}
