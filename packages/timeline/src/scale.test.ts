import { describe, expect, it } from "vitest";
import { createTimeScale } from "./scale";

describe("createTimeScale", () => {
  it("pxPerMs = basePxPerMs * zoom", () => {
    const scale = createTimeScale(0.1, 2);
    expect(scale.pxPerMs).toBeCloseTo(0.2);
  });

  it("pxOf / msOf font un aller-retour", () => {
    const scale = createTimeScale(0.1, 1);
    expect(scale.pxOf(1000)).toBeCloseTo(100);
    expect(scale.msOf(100)).toBeCloseTo(1000);
  });

  it("le zoom change l'échelle", () => {
    const base = createTimeScale(0.1, 1);
    const zoomed = createTimeScale(0.1, 4);
    expect(zoomed.pxOf(1000)).toBeCloseTo(base.pxOf(1000) * 4);
  });

  it("rejette basePxPerMs ou zoom <= 0", () => {
    expect(() => createTimeScale(0, 1)).toThrow();
    expect(() => createTimeScale(0.1, 0)).toThrow();
  });
});
