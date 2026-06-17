import { describe, expect, it } from "vitest";
import { Core } from "../core/Core";
import type { AudioObject, ImageObject, StickerObject, TextObject } from "../types/project";
import { registerBuiltins } from "./registerBuiltins";

function makeCore(): Core {
  const core = new Core({ builtins: false });
  registerBuiltins(core);
  return core;
}

describe("image.crop", () => {
  it("définit le crop d'une image", () => {
    const core = makeCore();
    core.execute("image.create", { id: "i1", object: { source: "p.jpg" } });
    core.execute("image.crop", { objectId: "i1", crop: { x: 1, y: 2, width: 3, height: 4 } });
    const img = core.project.get().tracks.video[0] as ImageObject;
    expect(img.crop).toEqual({ x: 1, y: 2, width: 3, height: 4 });
  });

  it("rejette un objet vidéo", () => {
    const core = makeCore();
    core.execute("video.create", { id: "v1", object: { source: "a.mp4" } });
    expect(() =>
      core.execute("image.crop", { objectId: "v1", crop: { x: 0, y: 0, width: 1, height: 1 } }),
    ).toThrow();
  });
});

describe("text.style / text.animate", () => {
  it("text.style fusionne le style sans écraser les champs absents", () => {
    const core = makeCore();
    core.execute("text.create", { id: "t1", object: { content: "hi" } });
    core.execute("text.style", { objectId: "t1", style: { fontSize: 48, color: "#000000" } });
    const t = core.project.get().tracks.text[0] as TextObject;
    expect(t.style.fontSize).toBe(48);
    expect(t.style.color).toBe("#000000");
    expect(t.style.align).toBe("center"); // inchangé
  });

  it("text.animate accepte une animation connue ou null, rejette l'inconnue", () => {
    const core = makeCore();
    core.execute("text.create", { id: "t1", object: { content: "hi" } });
    core.execute("text.animate", { objectId: "t1", animation: "zoom" });
    expect((core.project.get().tracks.text[0] as TextObject).animation).toBe("zoom");
    core.execute("text.animate", { objectId: "t1", animation: null });
    expect((core.project.get().tracks.text[0] as TextObject).animation).toBeNull();
    expect(() => core.execute("text.animate", { objectId: "t1", animation: "nope" })).toThrow();
  });
});

describe("sticker.animate", () => {
  it("accepte une animation de sticker connue, rejette l'inconnue", () => {
    const core = makeCore();
    core.execute("sticker.create", { id: "s1", object: { source: "s.png" } });
    core.execute("sticker.animate", { objectId: "s1", animation: "pulse" });
    expect((core.project.get().tracks.sticker[0] as StickerObject).animation).toBe("pulse");
    expect(() =>
      core.execute("sticker.animate", { objectId: "s1", animation: "zoomzoom" }),
    ).toThrow();
  });
});

describe("audio.trim / audio.volume / audio.fade", () => {
  function coreWithAudio(): Core {
    const core = makeCore();
    core.execute("audio.create", { id: "a1", object: { source: "m.mp3", speed: 1 } });
    return core;
  }

  it("audio.trim définit la fenêtre et recalcule la durée timeline", () => {
    const core = coreWithAudio();
    core.execute("audio.trim", { objectId: "a1", trim: { start: 1000, end: 5000 } });
    const a = core.project.get().tracks.audio[0] as AudioObject;
    expect(a.trim).toEqual({ start: 1000, end: 5000 });
    expect(a.endTime).toBe(4000);
  });

  it("audio.volume applique un gain dans [0,2], rejette hors plage", () => {
    const core = coreWithAudio();
    core.execute("audio.volume", { objectId: "a1", volume: 1.5 });
    expect((core.project.get().tracks.audio[0] as AudioObject).volume).toBe(1.5);
    expect(() => core.execute("audio.volume", { objectId: "a1", volume: 3 })).toThrow();
  });

  it("audio.fade configure fadeIn/fadeOut, rejette les valeurs négatives", () => {
    const core = coreWithAudio();
    core.execute("audio.fade", { objectId: "a1", fadeIn: 200, fadeOut: 300 });
    const a = core.project.get().tracks.audio[0] as AudioObject;
    expect(a.fadeIn).toBe(200);
    expect(a.fadeOut).toBe(300);
    expect(() => core.execute("audio.fade", { objectId: "a1", fadeIn: -1 })).toThrow();
  });
});
