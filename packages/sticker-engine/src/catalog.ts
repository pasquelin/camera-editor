/**
 * Catégories, formats et registry de stickers (headless). La doc n'énumère pas de
 * stickers built-in concrets : ils proviennent du bundle SDK ou de `StickerPack`
 * (AssetManager) enregistrés au runtime. Le registry est donc mutable.
 * Voir docs/20-STICKER-ENGINE.md.
 */
import type { StickerObject } from "@media-studio/core";

/** Formats de source supportés (= StickerObject["format"]). */
export type StickerFormat = StickerObject["format"];

export const STICKER_FORMATS: readonly StickerFormat[] = ["png", "svg", "gif", "lottie"];

/** Garde de type : `value` est-il un format de sticker connu ? */
export function isStickerFormat(value: unknown): value is StickerFormat {
  return (STICKER_FORMATS as readonly unknown[]).includes(value);
}

/** Catégories intégrées du catalogue de stickers (docs/20). */
export type StickerCategory =
  | "Emoji"
  | "Réactions"
  | "Love"
  | "Food"
  | "Travel"
  | "Funny"
  | "Shapes";

export const STICKER_CATEGORIES: readonly StickerCategory[] = [
  "Emoji",
  "Réactions",
  "Love",
  "Food",
  "Travel",
  "Funny",
  "Shapes",
];

/** Descripteur d'un sticker du catalogue (métadonnée, sans rendu natif). */
export interface StickerDescriptor {
  id: string;
  category: StickerCategory | (string & {});
  format: StickerFormat;
  source: string; // URI local / chemin bundle SDK
}

/** Seed initial du catalogue (stickers bundlés/packs déjà résolus). */
export interface StickerCatalogConfig {
  hidden?: readonly string[];
  initial?: readonly StickerDescriptor[];
}

/** Registry mutable de stickers (packs enregistrés au runtime). */
export interface StickerCatalog {
  register(descriptor: StickerDescriptor): void;
  unregister(id: string): boolean;
  list(): StickerDescriptor[];
  get(id: string): StickerDescriptor | null;
  has(id: string): boolean;
  byCategory(category: string): StickerDescriptor[];
}

/** Crée un registry de stickers, optionnellement amorcé (`initial` moins `hidden`). */
export function createStickerCatalog(config: StickerCatalogConfig = {}): StickerCatalog {
  const hidden = new Set(config.hidden ?? []);
  const byId = new Map<string, StickerDescriptor>();
  for (const sticker of config.initial ?? []) {
    if (!hidden.has(sticker.id)) byId.set(sticker.id, sticker);
  }

  const list = (): StickerDescriptor[] => [...byId.values()];
  return {
    register: (descriptor) => {
      byId.set(descriptor.id, descriptor);
    },
    unregister: (id) => byId.delete(id),
    list,
    get: (id) => byId.get(id) ?? null,
    has: (id) => byId.has(id),
    byCategory: (category) => list().filter((s) => s.category === category),
  };
}
