/**
 * Moteur de snap (magnétisme) de la timeline. Les points d'accroche sont les bords
 * de clips de toutes les pistes, 0 et la durée du projet. Le seuil est exprimé en
 * **ms** (purement headless) ; la conversion px→ms est à la charge de l'appelant via
 * `createTimeScale`. Voir docs/05-TIMELINE.md.
 */
import type { Project } from "@media-studio/core";

const DEFAULT_THRESHOLD_MS = 100;

/** Collecte les points d'accroche (triés, dédupliqués) : bords de clips, 0, durée. */
export function collectSnapPoints(project: Project): number[] {
  const points = new Set<number>([0, project.duration]);
  const t = project.tracks;
  for (const group of [t.video, t.audio, t.text, t.sticker, t.filter]) {
    for (const obj of group) {
      points.add(obj.startTime);
      points.add(obj.endTime);
    }
  }
  return [...points].sort((a, b) => a - b);
}

/** Accroche `candidateMs` au point le plus proche situé dans `thresholdMs`, sinon le renvoie tel quel. */
export function snapToPoints(
  candidateMs: number,
  points: readonly number[],
  thresholdMs: number,
): number {
  let best = candidateMs;
  let bestDist = Infinity;
  for (const point of points) {
    const dist = Math.abs(point - candidateMs);
    if (dist <= thresholdMs && dist < bestDist) {
      best = point;
      bestDist = dist;
    }
  }
  return best;
}

export interface SnapEngine {
  enabled: boolean;
  thresholdMs: number;
  points(project: Project): number[];
  apply(candidateMs: number, project: Project): number;
}

/** Crée un moteur de snap (désactivé → renvoie le candidat inchangé). */
export function createSnapEngine(
  opts: { enabled?: boolean; thresholdMs?: number } = {},
): SnapEngine {
  return {
    enabled: opts.enabled ?? true,
    thresholdMs: opts.thresholdMs ?? DEFAULT_THRESHOLD_MS,
    points(project) {
      return collectSnapPoints(project);
    },
    apply(candidateMs, project) {
      if (!this.enabled) return candidateMs;
      return snapToPoints(candidateMs, collectSnapPoints(project), this.thresholdMs);
    },
  };
}
