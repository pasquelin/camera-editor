/**
 * @media-studio/asset-manager — façade Asset Manager. Le cœur (import/cache/list)
 * vit dans `@media-studio/core` (`AssetManager`) ; ce package ajoute le registry de
 * ResourcePack et le gating par licence (headless). Voir docs/08-ASSET-MANAGER.md.
 */
export {
  isPackAccessible,
  createResourcePackRegistry,
  type ResourcePackRegistry,
} from "./resource-packs";
export { AssetManager } from "@media-studio/core";
export type { Asset, AssetSource, AssetType, ResourcePack } from "@media-studio/core";
