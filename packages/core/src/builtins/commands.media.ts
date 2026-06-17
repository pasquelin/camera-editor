/**
 * Commandes spécifiques image / text / sticker / audio.
 * Sémantique : docs/17, docs/19, docs/20, docs/22.
 */
import type { CommandFactory } from "../command-bus/CommandBus";
import type {
  AudioObject,
  ImageObject,
  StickerObject,
  TextObject,
  TextStyle,
} from "../types/project";
import { STICKER_ANIMATIONS, TEXT_ANIMATIONS, isOneOf } from "./definitions";
import { requireObject, snapshotCommand } from "./helpers";

// ---- image -----------------------------------------------------------------

export const cropCommand: CommandFactory = (payload) =>
  snapshotCommand("image.crop", (ctx) => {
    const p = payload as { objectId: string; crop: ImageObject["crop"] };
    const img = requireObject(
      ctx.project.get(),
      "video",
      p.objectId,
      "image.crop",
      "image",
    ) as ImageObject;
    return () => {
      img.crop = { ...p.crop };
    };
  });

// ---- text ------------------------------------------------------------------

export const styleCommand: CommandFactory = (payload) =>
  snapshotCommand("text.style", (ctx) => {
    const p = payload as { objectId: string; style: Partial<TextStyle> };
    const t = requireObject(
      ctx.project.get(),
      "text",
      p.objectId,
      "text.style",
      "text",
    ) as TextObject;
    return () => {
      t.style = { ...t.style, ...p.style };
    };
  });

export const textAnimateCommand: CommandFactory = (payload) =>
  snapshotCommand("text.animate", (ctx) => {
    const p = payload as { objectId: string; animation: string | null };
    const t = requireObject(
      ctx.project.get(),
      "text",
      p.objectId,
      "text.animate",
      "text",
    ) as TextObject;
    if (p.animation !== null && !isOneOf(TEXT_ANIMATIONS, p.animation)) {
      throw new Error(`text.animate: animation inconnue "${p.animation}"`);
    }
    return () => {
      t.animation = p.animation as TextObject["animation"];
    };
  });

// ---- sticker ---------------------------------------------------------------

export const stickerAnimateCommand: CommandFactory = (payload) =>
  snapshotCommand("sticker.animate", (ctx) => {
    const p = payload as { objectId: string; animation: string | null };
    const s = requireObject(
      ctx.project.get(),
      "sticker",
      p.objectId,
      "sticker.animate",
      "sticker",
    ) as StickerObject;
    if (p.animation !== null && !isOneOf(STICKER_ANIMATIONS, p.animation)) {
      throw new Error(`sticker.animate: animation inconnue "${p.animation}"`);
    }
    return () => {
      s.animation = p.animation as StickerObject["animation"];
    };
  });

// ---- audio -----------------------------------------------------------------

export const audioTrimCommand: CommandFactory = (payload) =>
  snapshotCommand("audio.trim", (ctx) => {
    const p = payload as { objectId: string; trim: { start: number; end: number } };
    const a = requireObject(
      ctx.project.get(),
      "audio",
      p.objectId,
      "audio.trim",
      "audio",
    ) as AudioObject;
    if (!p.trim || p.trim.start < 0 || p.trim.end <= p.trim.start) {
      throw new Error("audio.trim: fenêtre invalide (attendu 0 <= start < end)");
    }
    return () => {
      a.trim = { start: p.trim.start, end: p.trim.end };
      a.endTime = a.startTime + (a.trim.end - a.trim.start) / a.speed;
    };
  });

export const audioVolumeCommand: CommandFactory = (payload) =>
  snapshotCommand("audio.volume", (ctx) => {
    const p = payload as { objectId: string; volume: number };
    const a = requireObject(
      ctx.project.get(),
      "audio",
      p.objectId,
      "audio.volume",
      "audio",
    ) as AudioObject;
    if (typeof p.volume !== "number" || p.volume < 0 || p.volume > 2) {
      throw new Error("audio.volume: gain hors de [0, 2]");
    }
    return () => {
      a.volume = p.volume;
    };
  });

export const audioFadeCommand: CommandFactory = (payload) =>
  snapshotCommand("audio.fade", (ctx) => {
    const p = payload as { objectId: string; fadeIn?: number; fadeOut?: number };
    const a = requireObject(
      ctx.project.get(),
      "audio",
      p.objectId,
      "audio.fade",
      "audio",
    ) as AudioObject;
    if ((p.fadeIn !== undefined && p.fadeIn < 0) || (p.fadeOut !== undefined && p.fadeOut < 0)) {
      throw new Error("audio.fade: durées de fade négatives interdites");
    }
    return () => {
      if (p.fadeIn !== undefined) a.fadeIn = p.fadeIn;
      if (p.fadeOut !== undefined) a.fadeOut = p.fadeOut;
    };
  });
