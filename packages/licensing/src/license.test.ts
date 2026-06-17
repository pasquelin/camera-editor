import { describe, expect, it } from "vitest";
import type { Capability, LicensePlan } from "@media-studio/core";
import { PLAN_CAPABILITIES, createLicense } from "./license";

const ALL_PLANS: LicensePlan[] = ["open-source", "pro", "enterprise"];
const PREMIUM: Capability[] = [
  "export.4k",
  "export.h265",
  "effects.advanced",
  "plugins.premium",
  "whitelabel",
  "analytics",
];

describe("createLicense", () => {
  it("par défaut : plan open-source, aucune capacité premium", () => {
    const license = createLicense();
    expect(license.plan).toBe("open-source");
    for (const cap of PREMIUM) {
      expect(license.has(cap)).toBe(false);
    }
  });

  it("pro : export 4K/H.265, effets avancés, plugins premium ; pas whitelabel/analytics", () => {
    const license = createLicense("pro");
    expect(license.plan).toBe("pro");
    expect(license.has("export.4k")).toBe(true);
    expect(license.has("export.h265")).toBe(true);
    expect(license.has("effects.advanced")).toBe(true);
    expect(license.has("plugins.premium")).toBe(true);
    expect(license.has("whitelabel")).toBe(false);
    expect(license.has("analytics")).toBe(false);
  });

  it("enterprise : toutes les capacités", () => {
    const license = createLicense("enterprise");
    expect(license.plan).toBe("enterprise");
    for (const cap of PREMIUM) {
      expect(license.has(cap)).toBe(true);
    }
  });

  it("cohérence has(c) <=> c ∈ PLAN_CAPABILITIES[plan] pour chaque plan", () => {
    for (const plan of ALL_PLANS) {
      const license = createLicense(plan);
      for (const cap of PREMIUM) {
        expect(license.has(cap)).toBe(PLAN_CAPABILITIES[plan].includes(cap));
      }
    }
  });
});
