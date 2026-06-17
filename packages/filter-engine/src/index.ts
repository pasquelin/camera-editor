/**
 * @media-studio/filter-engine — catalogue de filtres, registry et résolution de
 * paramètres (headless). Le rendu natif (Skia/GLSL) est fourni par le renderer.
 * Voir docs/21-FILTER-ENGINE.md.
 */
export {
  BUILTIN_FILTERS,
  createFilterCatalog,
  type FilterCategory,
  type FilterDescriptor,
  type FilterCatalog,
  type FilterCatalogConfig,
} from "./catalog";
export { DEFAULT_FILTER_PARAMS, resolveFilterParams } from "./params";
export type { FilterParams } from "@media-studio/core";
