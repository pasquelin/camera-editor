/**
 * Commandes vidéo spécifiques (trim, split, merge, reverse, speed, mute, cover).
 * Sémantique : docs/18-VIDEO-EDITOR.md. Ne s'appliquent qu'aux clips `video`
 * (les images de la piste visuelle sont rejetées).
 */
import type { CommandFactory } from "../command-bus/CommandBus";
import type { Project, VideoObject } from "../types/project";
import { deepClone } from "../utils/clone";
import { genId } from "../utils/id";
import { ALLOWED_VIDEO_SPEEDS, isOneOf } from "./definitions";
import { requireObject, snapshotCommand, trackArray } from "./helpers";

/** Précision minimale d'un split par rapport aux bords du clip (ms). */
const MIN_SPLIT_MARGIN_MS = 100;

/** Durée occupée sur la timeline : (trim.end - trim.start) / speed. */
function timelineDuration(v: VideoObject): number {
  return (v.trim.end - v.trim.start) / v.speed;
}

/** Réf vivante d'un clip vidéo (existence + type vérifiés). */
function requireVideo(project: Readonly<Project>, objectId: string, command: string): VideoObject {
  return requireObject(project, "video", objectId, command, "video") as VideoObject;
}

export const trimCommand: CommandFactory = (payload) =>
  snapshotCommand("video.trim", (ctx) => {
    const p = payload as { objectId: string; trim: { start: number; end: number } };
    const v = requireVideo(ctx.project.get(), p.objectId, "video.trim");
    if (!p.trim || p.trim.start < 0 || p.trim.end <= p.trim.start) {
      throw new Error("video.trim: fenêtre invalide (attendu 0 <= start < end)");
    }
    return () => {
      v.trim = { start: p.trim.start, end: p.trim.end };
      v.endTime = v.startTime + timelineDuration(v);
    };
  });

export const speedCommand: CommandFactory = (payload) =>
  snapshotCommand("video.speed", (ctx) => {
    const p = payload as { objectId: string; speed: number };
    const v = requireVideo(ctx.project.get(), p.objectId, "video.speed");
    if (!isOneOf(ALLOWED_VIDEO_SPEEDS, p.speed)) {
      throw new Error(`video.speed: vitesse non autorisée "${p.speed}"`);
    }
    return () => {
      v.speed = p.speed;
      v.endTime = v.startTime + timelineDuration(v);
    };
  });

export const splitCommand: CommandFactory = (payload) =>
  snapshotCommand("video.split", (ctx) => {
    const p = payload as { objectId: string; atTimeMs: number; newId?: string };
    const project = ctx.project.get();
    const a = requireVideo(project, p.objectId, "video.split");
    if (
      p.atTimeMs - a.startTime < MIN_SPLIT_MARGIN_MS ||
      a.endTime - p.atTimeMs < MIN_SPLIT_MARGIN_MS
    ) {
      throw new Error("video.split: précision minimale de 100 ms par rapport aux bords");
    }
    const newId = p.newId ?? genId();
    const arr = trackArray(project, "video");
    return () => {
      const splitSource = a.trim.start + (p.atTimeMs - a.startTime) * a.speed;
      const b: VideoObject = {
        ...deepClone(a),
        id: newId,
        startTime: p.atTimeMs,
        endTime: a.endTime,
        trim: { start: splitSource, end: a.trim.end },
      };
      a.endTime = p.atTimeMs;
      a.trim = { start: a.trim.start, end: splitSource };
      arr.splice(arr.indexOf(a) + 1, 0, b);
    };
  });

export const mergeCommand: CommandFactory = (payload) =>
  snapshotCommand("video.merge", (ctx) => {
    const p = payload as { objectIdA: string; objectIdB: string };
    const project = ctx.project.get();
    const a = requireVideo(project, p.objectIdA, "video.merge");
    const b = requireVideo(project, p.objectIdB, "video.merge");
    if (a.source !== b.source) throw new Error("video.merge: sources différentes");
    if (a.endTime !== b.startTime) throw new Error("video.merge: clips non contigus (timeline)");
    if (a.trim.end !== b.trim.start) throw new Error("video.merge: fenêtres source non contiguës");
    const arr = trackArray(project, "video");
    return () => {
      a.trim = { start: a.trim.start, end: b.trim.end };
      a.endTime = b.endTime;
      arr.splice(arr.indexOf(b), 1);
    };
  });

export const reverseCommand: CommandFactory = (payload) =>
  snapshotCommand("video.reverse", (ctx) => {
    const p = payload as { objectId: string; reversed?: boolean };
    const v = requireVideo(ctx.project.get(), p.objectId, "video.reverse");
    return () => {
      v.reversed = p.reversed ?? !v.reversed;
    };
  });

export const muteCommand: CommandFactory = (payload) =>
  snapshotCommand("video.mute", (ctx) => {
    const p = payload as { objectId: string; muted?: boolean };
    const v = requireVideo(ctx.project.get(), p.objectId, "video.mute");
    return () => {
      v.muted = p.muted ?? !v.muted;
    };
  });

export const coverCommand: CommandFactory = (payload) =>
  snapshotCommand("video.cover", (ctx) => {
    const p = payload as { objectId: string; cover: number };
    const v = requireVideo(ctx.project.get(), p.objectId, "video.cover");
    if (p.cover < v.trim.start || p.cover > v.trim.end) {
      throw new Error("video.cover: frame hors de [trim.start, trim.end]");
    }
    return () => {
      v.cover = p.cover;
    };
  });
