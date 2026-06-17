/**
 * Commandes spécifiques image / text / sticker / audio.
 * Sémantique : docs/17, docs/19, docs/20, docs/22.
 */
import type { CommandFactory } from "../command-bus/CommandBus";
import type {
  AudioObject,
  EditorObject,
  ImageObject,
  Project,
  StickerObject,
  TextObject,
  TextStyle,
} from "../types/project";
import { STICKER_ANIMATION_VALUES, TEXT_ANIMATION_VALUES } from "./definitions";
import { type ObjectTrackKey, requireObject, snapshotCommand, trackArray } from "./helpers";

/** Pré-validation typée : l'objet existe et a le bon `type`. */
function requireTyped(
  project: Readonly<Project>,
  key: ObjectTrackKey,
  objectId: string,
  type: string,
  command: string,
): EditorObject {
  const obj = requireObject(project, key, objectId, command);
  if (obj.type !== type) throw new Error(`${command}: "${objectId}" n'est pas un objet "${type}"`);
  return obj;
}

/** Référence vivante typée dans le projet en cours de mutation. */
function refOf(project: Project, key: ObjectTrackKey, objectId: string): EditorObject {
  const obj = trackArray(project, key).find((o) => o.id === objectId);
  if (!obj) throw new Error(`commande: objet introuvable "${objectId}"`);
  return obj;
}

// ---- image -----------------------------------------------------------------

export const cropCommand: CommandFactory = (payload) => {
  const p = payload as { objectId: string; crop: ImageObject["crop"] };
  return snapshotCommand("image.crop", (ctx) => {
    requireTyped(ctx.project.get(), "video", p.objectId, "image", "image.crop");
    ctx.project.mutate((project) => {
      const img = refOf(project, "video", p.objectId) as ImageObject;
      img.crop = { ...p.crop };
    });
  });
};

// ---- text ------------------------------------------------------------------

export const styleCommand: CommandFactory = (payload) => {
  const p = payload as { objectId: string; style: Partial<TextStyle> };
  return snapshotCommand("text.style", (ctx) => {
    requireTyped(ctx.project.get(), "text", p.objectId, "text", "text.style");
    ctx.project.mutate((project) => {
      const t = refOf(project, "text", p.objectId) as TextObject;
      t.style = { ...t.style, ...p.style };
    });
  });
};

export const textAnimateCommand: CommandFactory = (payload) => {
  const p = payload as { objectId: string; animation: string | null };
  return snapshotCommand("text.animate", (ctx) => {
    requireTyped(ctx.project.get(), "text", p.objectId, "text", "text.animate");
    if (
      p.animation !== null &&
      !(TEXT_ANIMATION_VALUES as readonly string[]).includes(p.animation)
    ) {
      throw new Error(`text.animate: animation inconnue "${p.animation}"`);
    }
    ctx.project.mutate((project) => {
      (refOf(project, "text", p.objectId) as TextObject).animation =
        p.animation as TextObject["animation"];
    });
  });
};

// ---- sticker ---------------------------------------------------------------

export const stickerAnimateCommand: CommandFactory = (payload) => {
  const p = payload as { objectId: string; animation: string | null };
  return snapshotCommand("sticker.animate", (ctx) => {
    requireTyped(ctx.project.get(), "sticker", p.objectId, "sticker", "sticker.animate");
    if (
      p.animation !== null &&
      !(STICKER_ANIMATION_VALUES as readonly string[]).includes(p.animation)
    ) {
      throw new Error(`sticker.animate: animation inconnue "${p.animation}"`);
    }
    ctx.project.mutate((project) => {
      (refOf(project, "sticker", p.objectId) as StickerObject).animation =
        p.animation as StickerObject["animation"];
    });
  });
};

// ---- audio -----------------------------------------------------------------

export const audioTrimCommand: CommandFactory = (payload) => {
  const p = payload as { objectId: string; trim: { start: number; end: number } };
  return snapshotCommand("audio.trim", (ctx) => {
    requireTyped(ctx.project.get(), "audio", p.objectId, "audio", "audio.trim");
    if (!p.trim || p.trim.start < 0 || p.trim.end <= p.trim.start) {
      throw new Error("audio.trim: fenêtre invalide (attendu 0 <= start < end)");
    }
    ctx.project.mutate((project) => {
      const a = refOf(project, "audio", p.objectId) as AudioObject;
      a.trim = { start: p.trim.start, end: p.trim.end };
      a.endTime = a.startTime + (a.trim.end - a.trim.start) / a.speed;
    });
  });
};

export const audioVolumeCommand: CommandFactory = (payload) => {
  const p = payload as { objectId: string; volume: number };
  return snapshotCommand("audio.volume", (ctx) => {
    requireTyped(ctx.project.get(), "audio", p.objectId, "audio", "audio.volume");
    if (typeof p.volume !== "number" || p.volume < 0 || p.volume > 2) {
      throw new Error("audio.volume: gain hors de [0, 2]");
    }
    ctx.project.mutate((project) => {
      (refOf(project, "audio", p.objectId) as AudioObject).volume = p.volume;
    });
  });
};

export const audioFadeCommand: CommandFactory = (payload) => {
  const p = payload as { objectId: string; fadeIn?: number; fadeOut?: number };
  return snapshotCommand("audio.fade", (ctx) => {
    requireTyped(ctx.project.get(), "audio", p.objectId, "audio", "audio.fade");
    if ((p.fadeIn !== undefined && p.fadeIn < 0) || (p.fadeOut !== undefined && p.fadeOut < 0)) {
      throw new Error("audio.fade: durées de fade négatives interdites");
    }
    ctx.project.mutate((project) => {
      const a = refOf(project, "audio", p.objectId) as AudioObject;
      if (p.fadeIn !== undefined) a.fadeIn = p.fadeIn;
      if (p.fadeOut !== undefined) a.fadeOut = p.fadeOut;
    });
  });
};
