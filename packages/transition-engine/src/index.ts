/**
 * @media-studio/transition-engine — catalogue de transitions, easings et contrainte
 * d'overlap (headless). Le rendu (preview simplifié / export qualité max) est assuré
 * par le Renderer / l'Export Engine ; les mutations passent par les commandes
 * `transition.*` du Core. Voir docs/23-TRANSITION-ENGINE.md.
 */
import type { Transition } from "@media-studio/core";

/** Type built-in d'une transition (= valeurs camelCase de `Transition.type`). */
export type BuiltinTransitionType =
  | "cut"
  | "fade"
  | "zoom"
  | "slideUp"
  | "slideDown"
  | "slideLeft"
  | "slideRight"
  | "blur"
  | "dissolve";

/** Easing supporté (= `Transition.easing`). */
export type TransitionEasing = NonNullable<Transition["easing"]>;

export const TRANSITION_EASINGS: readonly TransitionEasing[] = [
  "linear",
  "easeIn",
  "easeOut",
  "easeInOut",
];

/** Descripteur d'une transition du catalogue (métadonnée, sans rendu natif). */
export interface TransitionDescriptor {
  type: BuiltinTransitionType | (string & {});
  name: string;
  description: string;
}

/** Catalogue intégré — 9 transitions (docs/23). `cut` ignore `durationMs`. */
export const BUILTIN_TRANSITIONS: readonly TransitionDescriptor[] = [
  { type: "cut", name: "Cut", description: "Coupe franche, sans interpolation (durée = 0)." },
  { type: "fade", name: "Fade", description: "Fondu enchaîné (blanc ou noir)." },
  { type: "zoom", name: "Zoom", description: "Zoom progressif entre A et B." },
  { type: "slideUp", name: "Slide Up", description: "B entre par le bas, A sort par le haut." },
  { type: "slideDown", name: "Slide Down", description: "B entre par le haut, A sort par le bas." },
  {
    type: "slideLeft",
    name: "Slide Left",
    description: "B entre par la droite, A sort par la gauche.",
  },
  {
    type: "slideRight",
    name: "Slide Right",
    description: "B entre par la gauche, A sort par la droite.",
  },
  { type: "blur", name: "Blur", description: "Les deux clips se flouent progressivement." },
  { type: "dissolve", name: "Dissolve", description: "Fondu croisé (opacités croisées)." },
];

export interface TransitionCatalogConfig {
  hidden?: readonly string[];
  custom?: readonly TransitionDescriptor[];
}

export interface TransitionCatalog {
  list(): TransitionDescriptor[];
  get(type: string): TransitionDescriptor | null;
  has(type: string): boolean;
}

/** Crée un catalogue de transitions (built-in masqués/étendus par config). */
export function createTransitionCatalog(config: TransitionCatalogConfig = {}): TransitionCatalog {
  const hidden = new Set(config.hidden ?? []);
  const byType = new Map<string, TransitionDescriptor>();
  for (const t of BUILTIN_TRANSITIONS) if (!hidden.has(t.type)) byType.set(t.type, t);
  for (const t of config.custom ?? []) byType.set(t.type, t);

  return {
    list: () => [...byType.values()],
    get: (type) => byType.get(type) ?? null,
    has: (type) => byType.has(type),
  };
}

/** Garde de type : `value` est-il un easing connu ? */
export function isTransitionEasing(value: unknown): value is TransitionEasing {
  return (TRANSITION_EASINGS as readonly unknown[]).includes(value);
}

/**
 * Durée maximale d'une transition entre deux clips : l'overlap symétrique ne peut
 * dépasser la moitié de la durée trimée du clip le plus court (docs/23).
 */
export function maxTransitionDurationMs(clipADurationMs: number, clipBDurationMs: number): number {
  return Math.max(0, Math.min(clipADurationMs, clipBDurationMs) / 2);
}

export type { Transition } from "@media-studio/core";
