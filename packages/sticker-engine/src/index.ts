/**
 * @media-studio/sticker-engine — catégories, formats, animations et registry de
 * stickers (headless). Le rendu (Skia/SVG/GIF/Lottie) et les gestes Reanimated sont
 * fournis par le renderer / l'UI. Voir docs/20-STICKER-ENGINE.md.
 */
export {
  STICKER_FORMATS,
  isStickerFormat,
  STICKER_CATEGORIES,
  createStickerCatalog,
  type StickerFormat,
  type StickerCategory,
  type StickerDescriptor,
  type StickerCatalog,
  type StickerCatalogConfig,
} from "./catalog";
export { STICKER_ANIMATIONS, isStickerAnimation } from "./animations";
export type { StickerAnimation } from "@media-studio/core";
