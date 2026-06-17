import { describe, expect, it } from "vitest";
import { Core } from "../core/Core";
import type { ObjectDefinition } from "../object-registry/ObjectRegistry";
import { baseEditorObject } from "../test-utils/fixtures";

describe("auto-câblage des built-in au démarrage du Core", () => {
  it("new Core() enregistre types + commandes built-in par défaut", () => {
    const core = new Core();
    expect(core.objects.list().sort()).toEqual([
      "audio",
      "filter",
      "image",
      "sticker",
      "text",
      "video",
    ]);
    core.execute("text.create", { id: "t1", object: { content: "ok" } });
    expect(core.project.get().tracks.text).toHaveLength(1);
  });

  it("new Core({ builtins: false }) laisse un Core nu", () => {
    const core = new Core({ builtins: false });
    expect(core.objects.list()).toEqual([]);
    expect(() => core.execute("text.create", {})).toThrow();
  });

  it("un type tiers s'enregistre via la même API publique, à côté des built-in", () => {
    const core = new Core();
    const captionDefinition: ObjectDefinition = {
      type: "caption",
      schema: {},
      defaultValues: () => baseEditorObject({ type: "caption" }),
      validate: () => true,
    };
    core.registerObjectType(captionDefinition);
    expect(core.objects.get("caption")).toBe(captionDefinition);
    // les built-in coexistent
    expect(core.objects.get("video")?.type).toBe("video");
  });
});
