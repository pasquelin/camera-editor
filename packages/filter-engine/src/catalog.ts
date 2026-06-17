/**
 * Catalogue de filtres et registry headless. Métadonnées uniquement : le rendu
 * natif (Skia `applySkia`, shaders GLSL) est attaché plus tard par le renderer,
 * indexé par `id`. Voir docs/21-FILTER-ENGINE.md.
 */

export type FilterCategory = "Vintage" | "Cinema" | "Beauty" | "Black & White" | "Social";

/** Descripteur d'un filtre du catalogue (métadonnée, sans rendu natif). */
export interface FilterDescriptor {
  id: string;
  name: string;
  category: FilterCategory | (string & {});
}

/** Catalogue intégré — 17 filtres en 5 catégories (docs/21-FILTER-ENGINE.md). */
export const BUILTIN_FILTERS: readonly FilterDescriptor[] = [
  // Vintage
  { id: "vintage-sepia", name: "Sepia", category: "Vintage" },
  { id: "vintage-retro", name: "Retro", category: "Vintage" },
  { id: "vintage-old-film", name: "Old Film", category: "Vintage" },
  { id: "vintage-dust", name: "Dust", category: "Vintage" },
  // Cinema
  { id: "cinema-drama", name: "Drama", category: "Cinema" },
  { id: "cinema-hollywood", name: "Hollywood", category: "Cinema" },
  { id: "cinema-teal-orange", name: "Teal & Orange", category: "Cinema" },
  // Beauty
  { id: "beauty-glow", name: "Glow", category: "Beauty" },
  { id: "beauty-smooth", name: "Smooth", category: "Beauty" },
  { id: "beauty-bright", name: "Bright", category: "Beauty" },
  // Black & White
  { id: "bw-classic", name: "Classic", category: "Black & White" },
  { id: "bw-contrast", name: "Contrast", category: "Black & White" },
  { id: "bw-film-noir", name: "Film Noir", category: "Black & White" },
  // Social
  { id: "social-tiktok", name: "TikTok", category: "Social" },
  { id: "social-reels", name: "Reels", category: "Social" },
  { id: "social-neon", name: "Neon", category: "Social" },
  { id: "social-dream", name: "Dream", category: "Social" },
];

/** Configuration du catalogue — masquage et filtres custom (docs/12, docs/21). */
export interface FilterCatalogConfig {
  hidden?: readonly string[];
  custom?: readonly FilterDescriptor[];
}

/** Catalogue interrogeable de filtres (built-in masqués/étendus par config). */
export interface FilterCatalog {
  list(): FilterDescriptor[];
  get(id: string): FilterDescriptor | null;
  has(id: string): boolean;
  byCategory(category: string): FilterDescriptor[];
}

/**
 * Construit un catalogue à partir des built-in, masqués par `hidden` puis
 * complétés/remplacés par `custom` (un custom de même id écrase le built-in).
 */
export function createFilterCatalog(config: FilterCatalogConfig = {}): FilterCatalog {
  const hidden = new Set(config.hidden ?? []);
  const byId = new Map<string, FilterDescriptor>();

  for (const filter of BUILTIN_FILTERS) {
    if (!hidden.has(filter.id)) byId.set(filter.id, filter);
  }
  for (const filter of config.custom ?? []) {
    byId.set(filter.id, filter);
  }

  const list = (): FilterDescriptor[] => [...byId.values()];
  return {
    list,
    get: (id) => byId.get(id) ?? null,
    has: (id) => byId.has(id),
    byCategory: (category) => list().filter((f) => f.category === category),
  };
}
