/**
 * Catalogue des animations de sticker (entrée/sortie de scène), indépendantes de
 * l'animation propre au format (Lottie/GIF). Le type `StickerAnimation` est défini
 * dans @media-studio/core. Voir docs/20-STICKER-ENGINE.md.
 */
import type { StickerAnimation } from "@media-studio/core";

/** Animations de sticker disponibles (docs/20 / docs/02). */
export const STICKER_ANIMATIONS: readonly StickerAnimation[] = [
  "fadeIn",
  "fadeOut",
  "zoom",
  "bounce",
  "pulse",
  "spin",
];

/** Garde de type : `value` est-il une `StickerAnimation` connue ? */
export function isStickerAnimation(value: unknown): value is StickerAnimation {
  return (STICKER_ANIMATIONS as readonly unknown[]).includes(value);
}
