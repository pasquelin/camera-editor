import { describe, expect, it } from "vitest";
import { DEFAULT_FILTER_PARAMS, resolveFilterParams } from "./params";

describe("DEFAULT_FILTER_PARAMS", () => {
  it("intensity à 1, ajustements à 0", () => {
    expect(DEFAULT_FILTER_PARAMS).toEqual({
      intensity: 1,
      contrast: 0,
      saturation: 0,
      brightness: 0,
      temperature: 0,
    });
  });
});

describe("resolveFilterParams", () => {
  it("sans argument : retourne les défauts", () => {
    expect(resolveFilterParams()).toEqual(DEFAULT_FILTER_PARAMS);
  });

  it("fusionne un partiel par-dessus les défauts", () => {
    expect(resolveFilterParams({ contrast: 0.2, temperature: -0.1 })).toEqual({
      intensity: 1,
      contrast: 0.2,
      saturation: 0,
      brightness: 0,
      temperature: -0.1,
    });
  });

  it("clamp intensity dans [0, 1]", () => {
    expect(resolveFilterParams({ intensity: 2 }).intensity).toBe(1);
    expect(resolveFilterParams({ intensity: -0.5 }).intensity).toBe(0);
  });

  it("clamp les ajustements dans [-1, 1]", () => {
    expect(resolveFilterParams({ contrast: 5 }).contrast).toBe(1);
    expect(resolveFilterParams({ saturation: -3 }).saturation).toBe(-1);
    expect(resolveFilterParams({ brightness: 0.5 }).brightness).toBe(0.5);
  });

  it("ne mute pas DEFAULT_FILTER_PARAMS", () => {
    resolveFilterParams({ contrast: 0.9 });
    expect(DEFAULT_FILTER_PARAMS.contrast).toBe(0);
  });
});
