/**
 * Font Manager (headless) : registry des polices bundlées du SDK et résolution
 * d'un `fontFamily` vers le chemin du fichier chargé. Voir docs/19-TEXT-ENGINE.md.
 *
 * Hors périmètre de ce module (natif / async, fournis par l'hôte) :
 *  - `listSystem()` : polices système iOS/Android,
 *  - `loadFromPack()` : FontPacks distants via l'AssetManager.
 */

/** Registry de polices bundlées résolvables sans réseau. */
export interface FontManager {
  /** Enregistre (ou remplace) une police bundlée et son chemin d'asset. */
  registerBundled(name: string, assetPath: string): void;
  /** Résout un `fontFamily` vers le chemin enregistré, ou `null`. */
  resolve(fontFamily: string): string | null;
  /** Indique si un `fontFamily` est enregistré. */
  has(fontFamily: string): boolean;
  /** Liste les polices enregistrées. */
  list(): string[];
}

/** Crée un Font Manager headless vide. */
export function createFontManager(): FontManager {
  const byName = new Map<string, string>();
  return {
    registerBundled: (name, assetPath) => {
      byName.set(name, assetPath);
    },
    resolve: (fontFamily) => byName.get(fontFamily) ?? null,
    has: (fontFamily) => byName.has(fontFamily),
    list: () => [...byName.keys()],
  };
}
