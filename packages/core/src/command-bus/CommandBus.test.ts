import { describe, expect, it } from "vitest";
import { Core } from "../core/Core";
import { makeTextObject } from "../test-utils/fixtures";
import type { Command, CommandFactory } from "./CommandBus";

const createText: CommandFactory = (payload): Command => {
  const { id, content } = payload as { id: string; content: string };
  return {
    id: "text.create",
    execute(ctx) {
      ctx.project.mutate((project) => {
        project.tracks.text.push(makeTextObject(id, content));
      });
    },
    undo(ctx) {
      ctx.project.mutate((project) => {
        project.tracks.text = project.tracks.text.filter((obj) => obj.id !== id);
      });
    },
  };
};

describe("CommandBus", () => {
  it("execute applique, undo révoque, redo rejoue", () => {
    const core = new Core({ builtins: false });
    core.registerCommand("text.create", createText);

    core.execute("text.create", { id: "t1", content: "Hello" });
    expect(core.project.get().tracks.text).toHaveLength(1);
    expect(core.commands.canUndo()).toBe(true);

    core.undo();
    expect(core.project.get().tracks.text).toHaveLength(0);
    expect(core.commands.canRedo()).toBe(true);

    core.redo();
    expect(core.project.get().tracks.text).toHaveLength(1);
  });

  it("émet stack:changed à l'exécution", () => {
    const core = new Core({ builtins: false });
    core.registerCommand("text.create", createText);
    let count = 0;
    core.on("stack:changed", () => {
      count += 1;
    });
    core.execute("text.create", { id: "t1", content: "Hi" });
    expect(count).toBe(1);
  });

  it("une commande inconnue lève une erreur", () => {
    const core = new Core();
    expect(() => core.execute("nope.boom")).toThrow();
  });
});
