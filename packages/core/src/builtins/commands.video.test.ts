import { beforeEach, describe, expect, it } from "vitest";
import { Core } from "../core/Core";
import type { VideoObject } from "../types/project";
import { registerBuiltins } from "./registerBuiltins";

function makeCore(): Core {
  const core = new Core({ builtins: false });
  registerBuiltins(core);
  return core;
}

function visual(core: Core): VideoObject[] {
  return core.project.get().tracks.video as VideoObject[];
}

describe("video.trim", () => {
  let core: Core;
  beforeEach(() => {
    core = makeCore();
    core.execute("video.create", { id: "v1", object: { source: "a.mp4", startTime: 0 } });
  });

  it("définit la fenêtre source et recalcule la durée timeline", () => {
    core.execute("video.trim", { objectId: "v1", trim: { start: 1000, end: 5000 } });
    const v = visual(core)[0]!;
    expect(v.trim).toEqual({ start: 1000, end: 5000 });
    expect(v.endTime).toBe(4000); // (5000-1000)/1
  });

  it("rejette une fenêtre invalide (end <= start)", () => {
    expect(() =>
      core.execute("video.trim", { objectId: "v1", trim: { start: 5000, end: 1000 } }),
    ).toThrow();
  });

  it("refuse de s'appliquer à une image de la piste visuelle", () => {
    core.execute("image.create", { id: "i1", object: { source: "p.jpg" } });
    expect(() =>
      core.execute("video.trim", { objectId: "i1", trim: { start: 0, end: 100 } }),
    ).toThrow();
  });
});

describe("video.speed", () => {
  let core: Core;
  beforeEach(() => {
    core = makeCore();
    core.execute("video.create", {
      id: "v1",
      object: { source: "a.mp4", startTime: 0, endTime: 4000, trim: { start: 0, end: 4000 } },
    });
  });

  it("applique une vitesse autorisée et répercute la durée timeline", () => {
    core.execute("video.speed", { objectId: "v1", speed: 2 });
    const v = visual(core)[0]!;
    expect(v.speed).toBe(2);
    expect(v.endTime).toBe(2000); // (4000-0)/2
  });

  it("rejette une vitesse hors de l'ensemble autorisé", () => {
    expect(() => core.execute("video.speed", { objectId: "v1", speed: 3 })).toThrow();
  });
});

describe("video.split", () => {
  let core: Core;
  beforeEach(() => {
    core = makeCore();
    core.execute("video.create", {
      id: "v1",
      object: {
        source: "a.mp4",
        startTime: 0,
        endTime: 10000,
        trim: { start: 0, end: 10000 },
        speed: 1,
      },
    });
  });

  it("coupe un clip en deux au timecode timeline indiqué", () => {
    core.execute("video.split", { objectId: "v1", atTimeMs: 4000, newId: "v2" });
    const clips = visual(core);
    expect(clips.map((c) => c.id)).toEqual(["v1", "v2"]);

    expect(clips[0]!.endTime).toBe(4000);
    expect(clips[0]!.trim).toEqual({ start: 0, end: 4000 });

    expect(clips[1]!.startTime).toBe(4000);
    expect(clips[1]!.endTime).toBe(10000);
    expect(clips[1]!.trim).toEqual({ start: 4000, end: 10000 });
    expect(clips[1]!.source).toBe("a.mp4");
  });

  it("respecte la précision minimale de 100 ms par rapport aux bords", () => {
    expect(() => core.execute("video.split", { objectId: "v1", atTimeMs: 50 })).toThrow();
    expect(() => core.execute("video.split", { objectId: "v1", atTimeMs: 9950 })).toThrow();
  });

  it("undo restaure le clip unique", () => {
    core.execute("video.split", { objectId: "v1", atTimeMs: 4000, newId: "v2" });
    expect(visual(core)).toHaveLength(2);
    core.undo();
    expect(visual(core)).toHaveLength(1);
    expect(visual(core)[0]!.trim).toEqual({ start: 0, end: 10000 });
  });
});

describe("video.merge", () => {
  let core: Core;
  beforeEach(() => {
    core = makeCore();
    core.execute("video.create", {
      id: "v1",
      object: {
        source: "a.mp4",
        startTime: 0,
        endTime: 10000,
        trim: { start: 0, end: 10000 },
        speed: 1,
      },
    });
    core.execute("video.split", { objectId: "v1", atTimeMs: 4000, newId: "v2" });
  });

  it("fusionne deux clips contigus (inverse du split)", () => {
    core.execute("video.merge", { objectIdA: "v1", objectIdB: "v2" });
    const clips = visual(core);
    expect(clips).toHaveLength(1);
    expect(clips[0]!.id).toBe("v1");
    expect(clips[0]!.trim).toEqual({ start: 0, end: 10000 });
    expect(clips[0]!.endTime).toBe(10000);
  });

  it("rejette la fusion de clips de sources différentes", () => {
    core.execute("video.create", { id: "v3", object: { source: "b.mp4", startTime: 10000 } });
    expect(() => core.execute("video.merge", { objectIdA: "v2", objectIdB: "v3" })).toThrow();
  });
});

describe("video.reverse / video.mute / video.cover", () => {
  let core: Core;
  beforeEach(() => {
    core = makeCore();
    core.execute("video.create", {
      id: "v1",
      object: { source: "a.mp4", trim: { start: 1000, end: 5000 } },
    });
  });

  it("reverse bascule l'attribut reversed", () => {
    core.execute("video.reverse", { objectId: "v1" });
    expect(visual(core)[0]!.reversed).toBe(true);
    core.execute("video.reverse", { objectId: "v1" });
    expect(visual(core)[0]!.reversed).toBe(false);
  });

  it("mute force l'état demandé", () => {
    core.execute("video.mute", { objectId: "v1", muted: true });
    expect(visual(core)[0]!.muted).toBe(true);
  });

  it("cover accepte une frame dans [trim.start, trim.end] et rejette hors plage", () => {
    core.execute("video.cover", { objectId: "v1", cover: 3000 });
    expect(visual(core)[0]!.cover).toBe(3000);
    expect(() => core.execute("video.cover", { objectId: "v1", cover: 6000 })).toThrow();
  });
});
