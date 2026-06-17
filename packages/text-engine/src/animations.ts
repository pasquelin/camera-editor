/**
 * Catalogue des animations de texte (entrée/sortie). Le rendu (worklet Reanimated)
 * est fourni par la couche UI ; ici seul le catalogue + le garde de type. Voir
 * docs/19-TEXT-ENGINE.md. Le type `TextAnimation` est défini dans @media-studio/core.
 */
import type { TextAnimation } from "@media-studio/core";

/** Animations de texte disponibles (docs/19), dans l'ordre du catalogue. */
export const TEXT_ANIMATIONS: readonly TextAnimation[] = [
  "fadeIn",
  "fadeOut",
  "slideUp",
  "slideDown",
  "slideLeft",
  "slideRight",
  "zoom",
  "bounce",
  "typewriter",
];

/** Garde de type : `value` est-il une `TextAnimation` connue ? */
export function isTextAnimation(value: unknown): value is TextAnimation {
  return (TEXT_ANIMATIONS as readonly unknown[]).includes(value);
}
