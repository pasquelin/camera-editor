import { describe, expect, it } from "vitest";
import { Core } from "../core/Core";
import type { ImageObject, TextObject, VideoObject } from "../types/project";
import { registerBuiltins } from "./registerBuiltins";

function makeCore(): Core {
  const core = new Core({ builtins: false });
  registerBuiltins(core);
  return core;
}

describe("registerBuiltins", () => {
  it("enregistre les 6 types et les commandes built-in", () => {
    const core = makeCore();
    expect(core.objects.list().sort()).toEqual([
      "audio",
      "filter",
      "image",
      "sticker",
      "text",
      "video",
    ]);
    expect(core.commands.canUndo()).toBe(false);
  });
});

describe("commandes génériques create/update/delete", () => {
  it("text.create ajoute, undo retire, redo rejoue (snapshot)", () => {
    const core = makeCore();
    core.execute("text.create", { id: "t1", object: { content: "Hello" } });

    const text = core.project.get().tracks.text;
    expect(text).toHaveLength(1);
    expect(text[0]?.id).toBe("t1");
    expect((text[0] as TextObject).content).toBe("Hello");

    core.undo();
    expect(core.project.get().tracks.text).toHaveLength(0);

    core.redo();
    expect(core.project.get().tracks.text).toHaveLength(1);
    expect(core.project.get().tracks.text[0]?.id).toBe("t1");
  });

  it("create attribue un id quand aucun n'est fourni", () => {
    const core = makeCore();
    core.execute("text.create", { object: { content: "auto" } });
    const obj = core.project.get().tracks.text[0];
    expect(obj?.id).toBeTruthy();
    expect(typeof obj?.id).toBe("string");
  });

  it("update applique un patch partiel sans toucher au reste", () => {
    const core = makeCore();
    core.execute("text.create", { id: "t1", object: { content: "v1" } });
    core.execute("text.update", { objectId: "t1", patch: { content: "v2", x: 50 } });

    const obj = core.project.get().tracks.text[0] as TextObject;
    expect(obj.content).toBe("v2");
    expect(obj.x).toBe(50);
    expect(obj.opacity).toBe(1); // inchangé

    core.undo();
    expect((core.project.get().tracks.text[0] as TextObject).content).toBe("v1");
  });

  it("delete retire l'objet ciblé, undo le restaure", () => {
    const core = makeCore();
    core.execute("text.create", { id: "t1", object: { content: "x" } });
    core.execute("text.delete", { objectId: "t1" });
    expect(core.project.get().tracks.text).toHaveLength(0);

    core.undo();
    expect(core.project.get().tracks.text).toHaveLength(1);
  });

  it("update/delete sur un id inconnu lève une erreur et ne pollue pas l'historique", () => {
    const core = makeCore();
    expect(() => core.execute("text.update", { objectId: "nope", patch: {} })).toThrow();
    expect(() => core.execute("text.delete", { objectId: "nope" })).toThrow();
    expect(core.commands.canUndo()).toBe(false);
  });

  it("video.create et image.create cohabitent sur la piste vidéo", () => {
    const core = makeCore();
    core.execute("video.create", { id: "v1", object: { source: "a.mp4" } });
    core.execute("image.create", { id: "i1", object: { source: "b.jpg" } });

    const visual = core.project.get().tracks.video;
    expect(visual.map((o) => o.id)).toEqual(["v1", "i1"]);
    expect(visual.map((o) => o.type)).toEqual(["video", "image"]);
    expect((visual[0] as VideoObject).source).toBe("a.mp4");
    expect((visual[1] as ImageObject).source).toBe("b.jpg");
  });

  it("filter.create / filter.update / filter.delete (chemin générique)", () => {
    const core = makeCore();
    core.execute("filter.create", { id: "f1", object: { filterId: "vivid", intensity: 0.5 } });
    core.execute("filter.update", { objectId: "f1", patch: { intensity: 0.8 } });
    expect(core.project.get().tracks.filter[0]?.intensity).toBe(0.8);
    core.execute("filter.delete", { objectId: "f1" });
    expect(core.project.get().tracks.filter).toHaveLength(0);
  });
});
