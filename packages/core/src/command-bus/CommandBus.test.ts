import { describe, expect, it } from "vitest";
import { Core } from "../core/Core";
import type { TextObject } from "../types/project";
import type { Command, CommandFactory } from "./CommandBus";

function makeTextObject(id: string, content: string): TextObject {
  return {
    id,
    type: "text",
    startTime: 0,
    endTime: 1000,
    x: 0,
    y: 0,
    width: 100,
    height: 50,
    rotation: 0,
    scale: 1,
    opacity: 1,
    locked: false,
    visible: true,
    content,
    style: {
      fontFamily: "Inter",
      fontSize: 24,
      color: "#ffffff",
      letterSpacingPx: 0,
      lineHeight: 1.2,
      align: "center",
      opacity: 1,
    },
    animation: null,
  };
}

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
    const core = new Core();
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
    const core = new Core();
    core.registerCommand("text.create", createText);
    let count = 0;
    core.commands.on("stack:changed", () => {
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
