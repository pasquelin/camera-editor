/**
 * Commandes vidéo spécifiques (trim, split, merge, reverse, speed, mute, cover).
 * Sémantique : docs/18-VIDEO-EDITOR.md. Ne s'appliquent qu'aux clips `video`
 * (les images de la piste visuelle sont rejetées).
 */
import type { CommandFactory } from "../command-bus/CommandBus";
import type { Project, VideoObject } from "../types/project";
import { deepClone } from "../utils/clone";
import { genId } from "../utils/id";
import { ALLOWED_VIDEO_SPEEDS } from "./definitions";
import { requireObject, snapshotCommand, trackArray } from "./helpers";

/** Précision minimale d'un split par rapport aux bords du clip (ms). */
const MIN_SPLIT_MARGIN_MS = 100;

/** Durée occupée sur la timeline : (trim.end - trim.start) / speed. */
function timelineDuration(v: VideoObject): number {
  return (v.trim.end - v.trim.start) / v.speed;
}

/** Pré-validation : l'objet existe et est bien un clip vidéo. */
function requireVideo(project: Readonly<Project>, objectId: string, command: string): VideoObject {
  const obj = requireObject(project, "video", objectId, command);
  if (obj.type !== "video") {
    throw new Error(`${command}: "${objectId}" n'est pas un clip vidéo`);
  }
  return obj as VideoObject;
}

/** Référence vivante d'un clip vidéo dans le projet en cours de mutation. */
function videoRef(project: Project, objectId: string): VideoObject {
  const v = trackArray(project, "video").find((o) => o.id === objectId);
  if (!v || v.type !== "video") throw new Error(`video: clip introuvable "${objectId}"`);
  return v as VideoObject;
}

export const trimCommand: CommandFactory = (payload) => {
  const p = payload as { objectId: string; trim: { start: number; end: number } };
  return snapshotCommand("video.trim", (ctx) => {
    requireVideo(ctx.project.get(), p.objectId, "video.trim");
    if (!p.trim || p.trim.start < 0 || p.trim.end <= p.trim.start) {
      throw new Error("video.trim: fenêtre invalide (attendu 0 <= start < end)");
    }
    ctx.project.mutate((project) => {
      const v = videoRef(project, p.objectId);
      v.trim = { start: p.trim.start, end: p.trim.end };
      v.endTime = v.startTime + timelineDuration(v);
    });
  });
};

export const speedCommand: CommandFactory = (payload) => {
  const p = payload as { objectId: string; speed: number };
  return snapshotCommand("video.speed", (ctx) => {
    requireVideo(ctx.project.get(), p.objectId, "video.speed");
    if (!(ALLOWED_VIDEO_SPEEDS as readonly number[]).includes(p.speed)) {
      throw new Error(`video.speed: vitesse non autorisée "${p.speed}"`);
    }
    ctx.project.mutate((project) => {
      const v = videoRef(project, p.objectId);
      v.speed = p.speed;
      v.endTime = v.startTime + timelineDuration(v);
    });
  });
};

export const splitCommand: CommandFactory = (payload) => {
  const p = payload as { objectId: string; atTimeMs: number; newId?: string };
  return snapshotCommand("video.split", (ctx) => {
    const src = requireVideo(ctx.project.get(), p.objectId, "video.split");
    if (
      p.atTimeMs - src.startTime < MIN_SPLIT_MARGIN_MS ||
      src.endTime - p.atTimeMs < MIN_SPLIT_MARGIN_MS
    ) {
      throw new Error("video.split: précision minimale de 100 ms par rapport aux bords");
    }
    const newId = p.newId ?? genId();
    ctx.project.mutate((project) => {
      const arr = trackArray(project, "video");
      const a = videoRef(project, p.objectId);
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
    });
  });
};

export const mergeCommand: CommandFactory = (payload) => {
  const p = payload as { objectIdA: string; objectIdB: string };
  return snapshotCommand("video.merge", (ctx) => {
    const a = requireVideo(ctx.project.get(), p.objectIdA, "video.merge");
    const b = requireVideo(ctx.project.get(), p.objectIdB, "video.merge");
    if (a.source !== b.source) throw new Error("video.merge: sources différentes");
    if (a.endTime !== b.startTime) throw new Error("video.merge: clips non contigus (timeline)");
    if (a.trim.end !== b.trim.start) throw new Error("video.merge: fenêtres source non contiguës");
    ctx.project.mutate((project) => {
      const arr = trackArray(project, "video");
      const ra = videoRef(project, p.objectIdA);
      const rb = videoRef(project, p.objectIdB);
      ra.trim = { start: ra.trim.start, end: rb.trim.end };
      ra.endTime = rb.endTime;
      arr.splice(arr.indexOf(rb), 1);
    });
  });
};

export const reverseCommand: CommandFactory = (payload) => {
  const p = payload as { objectId: string; reversed?: boolean };
  return snapshotCommand("video.reverse", (ctx) => {
    requireVideo(ctx.project.get(), p.objectId, "video.reverse");
    ctx.project.mutate((project) => {
      const v = videoRef(project, p.objectId);
      v.reversed = p.reversed ?? !v.reversed;
    });
  });
};

export const muteCommand: CommandFactory = (payload) => {
  const p = payload as { objectId: string; muted?: boolean };
  return snapshotCommand("video.mute", (ctx) => {
    requireVideo(ctx.project.get(), p.objectId, "video.mute");
    ctx.project.mutate((project) => {
      const v = videoRef(project, p.objectId);
      v.muted = p.muted ?? !v.muted;
    });
  });
};

export const coverCommand: CommandFactory = (payload) => {
  const p = payload as { objectId: string; cover: number };
  return snapshotCommand("video.cover", (ctx) => {
    const v = requireVideo(ctx.project.get(), p.objectId, "video.cover");
    if (p.cover < v.trim.start || p.cover > v.trim.end) {
      throw new Error("video.cover: frame hors de [trim.start, trim.end]");
    }
    ctx.project.mutate((project) => {
      videoRef(project, p.objectId).cover = p.cover;
    });
  });
};
