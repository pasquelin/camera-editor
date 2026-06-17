import { describe, expect, it } from "vitest";
import { Core } from "./Core";
import type { LicenseValidator } from "../types/license";

describe("Core.license", () => {
  it("sans licence injectée : défaut open-source, aucune capacité premium", () => {
    const core = new Core();
    expect(core.license.plan).toBe("open-source");
    expect(core.license.has("plugins.premium")).toBe(false);
    expect(core.license.has("export.4k")).toBe(false);
  });

  it("avec une licence injectée : expose le plan et les capacités fournies", () => {
    const proLicense: LicenseValidator = {
      plan: "pro",
      has: (cap) => cap === "export.4k" || cap === "plugins.premium",
    };
    const core = new Core({ license: proLicense });
    expect(core.license.plan).toBe("pro");
    expect(core.license.has("export.4k")).toBe(true);
    expect(core.license.has("plugins.premium")).toBe(true);
    expect(core.license.has("whitelabel")).toBe(false);
  });
});
