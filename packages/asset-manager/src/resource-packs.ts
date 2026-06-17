/**
 * Registry de ResourcePack et gating par licence (headless). Le téléchargement et
 * le cache réels sont assurés par le Core (`AssetManager`) et des adapters d'I/O ;
 * ici, la logique pure de catalogue de packs et d'accès selon le plan.
 * Voir docs/08-ASSET-MANAGER.md, docs/07-LICENSE-SYSTEM.md.
 */
import type { Asset, LicenseValidator, ResourcePack } from "@media-studio/core";

/** Un pack est accessible si son niveau de licence est couvert par le plan courant. */
export function isPackAccessible(pack: ResourcePack, license: LicenseValidator): boolean {
  switch (pack.license) {
    case "free":
      return true;
    case "pro":
      return license.plan === "pro" || license.plan === "enterprise";
    case "enterprise":
      return license.plan === "enterprise";
    default:
      return false;
  }
}

export interface ResourcePackRegistry {
  register(pack: ResourcePack): void;
  unregister(id: string): boolean;
  get(id: string): ResourcePack | null;
  list(): ResourcePack[];
  /** Packs accessibles sous une licence donnée. */
  accessible(license: LicenseValidator): ResourcePack[];
  /** Résout un asset par id à travers tous les packs enregistrés. */
  resolveAsset(assetId: string): Asset | null;
}

/** Crée un registry de ResourcePack (catalogue en mémoire). */
export function createResourcePackRegistry(
  initial: readonly ResourcePack[] = [],
): ResourcePackRegistry {
  const byId = new Map<string, ResourcePack>();
  for (const pack of initial) byId.set(pack.id, pack);

  return {
    register: (pack) => {
      byId.set(pack.id, pack);
    },
    unregister: (id) => byId.delete(id),
    get: (id) => byId.get(id) ?? null,
    list: () => [...byId.values()],
    accessible: (license) => [...byId.values()].filter((p) => isPackAccessible(p, license)),
    resolveAsset: (assetId) => {
      for (const pack of byId.values()) {
        const asset = pack.assets.find((a) => a.id === assetId);
        if (asset) return asset;
      }
      return null;
    },
  };
}
