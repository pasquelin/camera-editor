import { describe, expect, it } from "vitest";
import type {
  AudioObject,
  FilterObject,
  ImageObject,
  StickerObject,
  TextObject,
  VideoObject,
} from "../types/project";
import {
  audioObjectDefinition,
  builtinObjectDefinitions,
  filterObjectDefinition,
  imageObjectDefinition,
  stickerObjectDefinition,
  textObjectDefinition,
  videoObjectDefinition,
} from "./definitions";

describe("builtinObjectDefinitions", () => {
  it("expose exactement les 6 types built-in", () => {
    expect(builtinObjectDefinitions.map((d) => d.type).sort()).toEqual([
      "audio",
      "filter",
      "image",
      "sticker",
      "text",
      "video",
    ]);
  });

  it("chaque defaultValues() est validé par son propre validate()", () => {
    for (const def of builtinObjectDefinitions) {
      const value = def.defaultValues();
      expect(value.type).toBe(def.type);
      expect(def.validate(value)).toBe(true);
    }
  });

  it("validate() rejette un non-objet et un type erroné", () => {
    for (const def of builtinObjectDefinitions) {
      expect(def.validate(null)).toBe(false);
      expect(def.validate(42)).toBe(false);
      expect(def.validate({ ...def.defaultValues(), type: "nope" })).toBe(false);
    }
  });
});

describe("videoObjectDefinition", () => {
  it("produit un VideoObject par défaut cohérent", () => {
    const v = videoObjectDefinition.defaultValues() as VideoObject;
    expect(v.type).toBe("video");
    expect(v.source).toBe("");
    expect(v.speed).toBe(1);
    expect(v.volume).toBe(1);
    expect(v.muted).toBe(false);
    expect(v.reversed).toBe(false);
    expect(v.trim).toEqual({ start: 0, end: 0 });
    expect(v.scale).toBe(1);
    expect(v.opacity).toBe(1);
    expect(v.visible).toBe(true);
    expect(v.locked).toBe(false);
  });

  it("rejette une vitesse hors plage", () => {
    const v = videoObjectDefinition.defaultValues() as VideoObject;
    expect(videoObjectDefinition.validate({ ...v, speed: 99 })).toBe(false);
    expect(videoObjectDefinition.validate({ ...v, opacity: 2 })).toBe(false);
  });
});

describe("imageObjectDefinition", () => {
  it("produit un ImageObject par défaut", () => {
    const img = imageObjectDefinition.defaultValues() as ImageObject;
    expect(img.type).toBe("image");
    expect(img.source).toBe("");
    expect(img.crop).toEqual({ x: 0, y: 0, width: 0, height: 0 });
  });
});

describe("textObjectDefinition", () => {
  it("produit un TextObject par défaut avec un style complet", () => {
    const t = textObjectDefinition.defaultValues() as TextObject;
    expect(t.type).toBe("text");
    expect(t.content).toBe("");
    expect(t.animation).toBeNull();
    expect(t.style.fontFamily).toBeTruthy();
    expect(t.style.align).toBe("center");
  });
});

describe("audioObjectDefinition", () => {
  it("produit un AudioObject par défaut", () => {
    const a = audioObjectDefinition.defaultValues() as AudioObject;
    expect(a.type).toBe("audio");
    expect(a.role).toBe("background");
    expect(a.volume).toBe(1);
    expect(a.loop).toBe(false);
  });

  it("rejette un volume audio hors plage [0,2]", () => {
    const a = audioObjectDefinition.defaultValues() as AudioObject;
    expect(audioObjectDefinition.validate({ ...a, volume: 3 })).toBe(false);
  });
});

describe("stickerObjectDefinition", () => {
  it("produit un StickerObject par défaut", () => {
    const s = stickerObjectDefinition.defaultValues() as StickerObject;
    expect(s.type).toBe("sticker");
    expect(s.format).toBe("png");
    expect(s.animation).toBeNull();
  });
});

describe("filterObjectDefinition", () => {
  it("produit un FilterObject par défaut", () => {
    const f = filterObjectDefinition.defaultValues() as FilterObject;
    expect(f.type).toBe("filter");
    expect(f.intensity).toBe(1);
    expect(f.params).toEqual({});
  });

  it("rejette une intensité hors plage [0,1]", () => {
    const f = filterObjectDefinition.defaultValues() as FilterObject;
    expect(filterObjectDefinition.validate({ ...f, intensity: 2 })).toBe(false);
  });
});
