/**
 * @media-studio/music-library — bibliothèque musicale libre de droits intégrée,
 * exposée comme `MusicSource` **remplaçable** (config.musicLibrary). Catalogue en
 * mémoire par défaut ; un intégrateur peut fournir sa propre source (API, plugin).
 * Voir docs/22-AUDIO-ENGINE.md.
 */

export type MusicCategory =
  | "Pop"
  | "Lo-Fi"
  | "Hip-Hop"
  | "Electronic"
  | "Corporate"
  | "Cinematic"
  | "Nature";

export const MUSIC_CATEGORIES: readonly MusicCategory[] = [
  "Pop",
  "Lo-Fi",
  "Hip-Hop",
  "Electronic",
  "Corporate",
  "Cinematic",
  "Nature",
];

export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  category: MusicCategory | (string & {});
  uri: string;
  durationMs: number;
}

/** Source musicale remplaçable (docs/22). */
export interface MusicSource {
  readonly categories: readonly string[];
  list(category?: string): Promise<MusicTrack[]>;
  get(trackId: string): Promise<MusicTrack>;
}

/**
 * Crée une `MusicSource` en mémoire à partir d'un catalogue de pistes. Les
 * catégories exposées sont déduites du catalogue (ou `MUSIC_CATEGORIES` si vide).
 */
export function createMusicLibrary(tracks: readonly MusicTrack[] = []): MusicSource {
  const byId = new Map(tracks.map((t) => [t.id, t]));
  const categories = tracks.length
    ? [...new Set(tracks.map((t) => t.category))]
    : [...MUSIC_CATEGORIES];

  return {
    categories,
    list: async (category) => {
      const all = [...byId.values()];
      return category === undefined ? all : all.filter((t) => t.category === category);
    },
    get: async (trackId) => {
      const track = byId.get(trackId);
      if (!track) throw new Error(`music-library: piste introuvable "${trackId}"`);
      return track;
    },
  };
}
