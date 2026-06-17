import type { EventBus } from "../event-bus/EventBus";
import type { Asset, AssetSource, AssetType } from "../types/assets";
import { genId } from "../utils/id";
import { nowIso } from "../utils/time";

/**
 * Service central de gestion des assets. Le Core ne fait pas d'I/O : la résolution
 * réelle (téléchargement, taille, MIME) est déléguée aux adapters/plugins.
 * Voir docs/08-ASSET-MANAGER.md.
 */
export class AssetManager {
  private readonly assets = new Map<string, Asset>();

  constructor(private readonly events: EventBus) {}

  async import(source: AssetSource): Promise<Asset> {
    const uri = resolveUri(source);
    const asset: Asset = {
      id: genId(),
      type: inferType(uri),
      uri,
      source,
      size: 0,
      createdAt: nowIso(),
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
    if (type === undefined) return [...this.assets.values()];
    const result: Asset[] = [];
    for (const asset of this.assets.values()) {
      if (asset.type === type) result.push(asset);
    }
    return result;
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

const EXTENSION_TYPES: Record<string, AssetType> = {
  mp4: "video",
  mov: "video",
  m4v: "video",
  webm: "video",
  mp3: "audio",
  wav: "audio",
  aac: "audio",
  m4a: "audio",
  caf: "audio",
  ttf: "font",
  otf: "font",
  woff: "font",
  woff2: "font",
  jpg: "image",
  jpeg: "image",
  png: "image",
  webp: "image",
  heic: "image",
};

/** Type déduit de l'extension de l'URI (best-effort) ; défaut "image". */
function inferType(uri: string): AssetType {
  const ext = uri.split("?")[0]?.split(".").pop()?.toLowerCase() ?? "";
  return EXTENSION_TYPES[ext] ?? "image";
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
