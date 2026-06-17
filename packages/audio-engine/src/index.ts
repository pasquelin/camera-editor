/**
 * @media-studio/audio-engine — logique de mixage **headless** : enveloppe de gain
 * (volume + fade in/out), plan de mixage par piste et validation des rôles. Le
 * mixage natif réel (AVPlayer/ExoPlayer, resync clock) et le `mixdown` d'export sont
 * fournis par la couche native ; ici, le calcul pur consommé par l'export.
 * Voir docs/22-AUDIO-ENGINE.md.
 */
import type { AudioObject, Project } from "@media-studio/core";

/** Entrée d'un plan de mixage (résumé d'un AudioObject pour le mixeur). */
export interface AudioMixEntry {
  id: string;
  role: AudioObject["role"];
  source: string;
  startTime: number;
  endTime: number;
  volume: number;
  fadeIn: number;
  fadeOut: number;
  speed: number;
  loop: boolean;
  trim: { start: number; end: number };
}

/** Construit le plan de mixage de toutes les pistes audio du projet. */
export function buildAudioMixPlan(project: Project): AudioMixEntry[] {
  return project.tracks.audio.map((a) => ({
    id: a.id,
    role: a.role,
    source: a.source,
    startTime: a.startTime,
    endTime: a.endTime,
    volume: a.volume,
    fadeIn: a.fadeIn,
    fadeOut: a.fadeOut,
    speed: a.speed,
    loop: a.loop,
    trim: { start: a.trim.start, end: a.trim.end },
  }));
}

/**
 * Gain effectif d'une piste audio à un instant `timelineMs` : 0 hors de la région
 * [startTime, endTime] ; sinon `volume` modulé par le fade-in (depuis startTime) et
 * le fade-out (jusqu'à endTime). Le plus contraignant des deux fades s'applique.
 */
export function gainAt(clip: AudioMixEntry, timelineMs: number): number {
  if (timelineMs < clip.startTime || timelineMs > clip.endTime) return 0;
  const sinceStart = timelineMs - clip.startTime;
  const untilEnd = clip.endTime - timelineMs;
  const fadeIn = clip.fadeIn > 0 ? Math.min(1, sinceStart / clip.fadeIn) : 1;
  const fadeOut = clip.fadeOut > 0 ? Math.min(1, untilEnd / clip.fadeOut) : 1;
  return Math.max(0, clip.volume * Math.min(fadeIn, fadeOut));
}

/**
 * Valide la cardinalité des rôles audio (docs/22) : 1 `background`, 1 `voiceover`,
 * N `sfx`. Renvoie la liste des violations (vide si conforme).
 */
export function validateAudioRoles(project: Project): string[] {
  const counts: Record<AudioObject["role"], number> = { background: 0, voiceover: 0, sfx: 0 };
  for (const a of project.tracks.audio) counts[a.role] += 1;

  const issues: string[] = [];
  if (counts.background > 1) issues.push(`rôle "background" en double (${counts.background})`);
  if (counts.voiceover > 1) issues.push(`rôle "voiceover" en double (${counts.voiceover})`);
  return issues;
}

export type { AudioObject } from "@media-studio/core";
