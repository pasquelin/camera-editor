/**
 * Adapters injectés dans le Core. Le Core ne fait aucun I/O lui-même : il délègue
 * via ces interfaces (docs/01-ARCHITECTURE.md).
 */

export interface StorageAdapter {
  read(key: string): Promise<string | null>;
  write(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
}

export interface NetworkAdapter {
  fetch(url: string): Promise<ArrayBuffer>;
}
