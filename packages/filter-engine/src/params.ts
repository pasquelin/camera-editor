/**
 * Résolution des paramètres de filtre (headless, pure). `intensity` pilote
 * l'interpolation original↔effet (0–1) ; contrast/saturation/brightness/
 * temperature sont des ajustements additionnels (-1–1). Voir docs/02 et docs/21.
 */
import type { FilterParams } from "@media-studio/core";

/** Paramètres par défaut : effet à pleine puissance, aucun ajustement. */
export const DEFAULT_FILTER_PARAMS: FilterParams = {
  intensity: 1,
  contrast: 0,
  saturation: 0,
  brightness: 0,
  temperature: 0,
};

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

/**
 * Applique les défauts puis clamp : `intensity` dans [0, 1], les ajustements
 * (contrast/saturation/brightness/temperature) dans [-1, 1].
 */
export function resolveFilterParams(partial: Partial<FilterParams> = {}): FilterParams {
  const merged = { ...DEFAULT_FILTER_PARAMS, ...partial };
  return {
    intensity: clamp(merged.intensity, 0, 1),
    contrast: clamp(merged.contrast, -1, 1),
    saturation: clamp(merged.saturation, -1, 1),
    brightness: clamp(merged.brightness, -1, 1),
    temperature: clamp(merged.temperature, -1, 1),
  };
}
