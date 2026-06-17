import { describe, expect, it } from "vitest";
import type { EditorObject } from "../types/project";
import { ObjectRegistry, type ObjectDefinition } from "./ObjectRegistry";

const baseObject = (): EditorObject => ({
  id: "x",
  type: "text",
  startTime: 0,
  endTime: 1000,
  x: 0,
  y: 0,
  width: 100,
  height: 100,
  rotation: 0,
  scale: 1,
  opacity: 1,
  locked: false,
  visible: true,
});

const definition: ObjectDefinition = {
  type: "text",
  schema: {},
  defaultValues: baseObject,
  validate: () => true,
};

describe("ObjectRegistry", () => {
  it("register + get + list", () => {
    const registry = new ObjectRegistry();
    registry.register("text", definition);
    expect(registry.get("text")).toBe(definition);
    expect(registry.list()).toEqual(["text"]);
    expect(registry.get("unknown")).toBeNull();
  });

  it("rejette un type déjà enregistré", () => {
    const registry = new ObjectRegistry();
    registry.register("text", definition);
    expect(() => registry.register("text", definition)).toThrow();
  });
});
