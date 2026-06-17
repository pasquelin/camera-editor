/**
 * Adapters injectés dans le Core. Le Core ne fait aucun I/O lui-même : il délègue
 * via ces interfaces (docs/01-ARCHITECTURE.md).
 */

export interface StorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

export interface NetworkAdapter {
  fetch(url: string): Promise<ArrayBuffer>;
}
