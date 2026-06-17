/**
 * Styles de texte prédéfinis et leur résolution. Un preset est un raccourci nommé
 * qui résout un `TextStyle` complet ; un override partiel peut substituer n'importe
 * quel champ. Voir docs/19-TEXT-ENGINE.md.
 */
import type { TextStyle } from "@media-studio/core";

export type TextPreset =
  | "Classic"
  | "Minimal"
  | "Bold"
  | "Elegant"
  | "Neon"
  | "Handwriting"
  | "Typewriter";

/** Mapping preset → TextStyle complet (charte par défaut du SDK, docs/19). */
export const TEXT_PRESETS: Record<TextPreset, TextStyle> = {
  Classic: {
    fontFamily: "System",
    fontSize: 32,
    color: "#FFFFFF",
    letterSpacingPx: 0,
    lineHeight: 1.2,
    align: "center",
    opacity: 1,
  },
  Minimal: {
    fontFamily: "System",
    fontSize: 24,
    color: "#FFFFFF",
    letterSpacingPx: 1,
    lineHeight: 1.4,
    align: "center",
    opacity: 0.85,
  },
  Bold: {
    fontFamily: "System",
    fontSize: 48,
    color: "#FFFFFF",
    stroke: { color: "#000000", width: 3 },
    letterSpacingPx: 0,
    lineHeight: 1.1,
    align: "center",
    opacity: 1,
  },
  Elegant: {
    fontFamily: "Georgia",
    fontSize: 30,
    color: "#F5F0E8",
    letterSpacingPx: 4,
    lineHeight: 1.5,
    align: "center",
    opacity: 1,
  },
  Neon: {
    fontFamily: "System",
    fontSize: 36,
    color: "#00FFCC",
    shadow: { color: "#00FFCC", blur: 16, offsetX: 0, offsetY: 0 },
    background: { color: "rgba(0,0,0,0.4)", padding: 8, borderRadius: 4 },
    letterSpacingPx: 2,
    lineHeight: 1.2,
    align: "center",
    opacity: 1,
  },
  Handwriting: {
    fontFamily: "Pacifico",
    fontSize: 34,
    color: "#FFFFFF",
    letterSpacingPx: 1,
    lineHeight: 1.6,
    align: "center",
    opacity: 1,
  },
  Typewriter: {
    fontFamily: "CourierPrime",
    fontSize: 28,
    color: "#F0E8D0",
    letterSpacingPx: 0,
    lineHeight: 1.3,
    align: "left",
    opacity: 1,
  },
};

/** Résout un preset en `TextStyle`, avec override partiel optionnel par-dessus. */
export function resolveTextPreset(
  preset: TextPreset,
  override: Partial<TextStyle> = {},
): TextStyle {
  return { ...TEXT_PRESETS[preset], ...override };
}
