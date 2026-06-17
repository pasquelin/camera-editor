import { describe, expect, it } from "vitest";
import { baseEditorObject } from "../test-utils/fixtures";
import { ObjectRegistry, type ObjectDefinition } from "./ObjectRegistry";

const definition: ObjectDefinition = {
  type: "text",
  schema: {},
  defaultValues: () => baseEditorObject(),
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
