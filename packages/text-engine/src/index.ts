/**
 * @media-studio/text-engine — styles prédéfinis, animations et Font Manager
 * (headless). Le rendu Skia/Reanimated est fourni par le renderer / l'UI.
 * Voir docs/19-TEXT-ENGINE.md.
 */
export { TEXT_PRESETS, resolveTextPreset, type TextPreset } from "./presets";
export { TEXT_ANIMATIONS, isTextAnimation } from "./animations";
export { createFontManager, type FontManager } from "./font-manager";
export type { TextStyle, TextAnimation } from "@media-studio/core";
