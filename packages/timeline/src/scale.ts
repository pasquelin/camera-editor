/**
 * Conversion temps ↔ pixels de la timeline. `pxPerMs = basePxPerMs * zoom`.
 * Pure et sans état. Voir docs/05-TIMELINE.md.
 */
export interface TimeScale {
  readonly pxPerMs: number;
  pxOf(ms: number): number;
  msOf(px: number): number;
}

/** Crée une échelle temps↔pixels (basePxPerMs > 0, zoom > 0). */
export function createTimeScale(basePxPerMs: number, zoom: number): TimeScale {
  if (basePxPerMs <= 0) throw new Error("createTimeScale: basePxPerMs doit être > 0");
  if (zoom <= 0) throw new Error("createTimeScale: zoom doit être > 0");
  const pxPerMs = basePxPerMs * zoom;
  return {
    pxPerMs,
    pxOf: (ms) => ms * pxPerMs,
    msOf: (px) => px / pxPerMs,
  };
}
