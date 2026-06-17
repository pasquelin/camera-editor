import { describe, expect, it } from "vitest";
import { createFontManager } from "./font-manager";

describe("createFontManager", () => {
  it("résout une police bundlée enregistrée vers son chemin", () => {
    const fonts = createFontManager();
    fonts.registerBundled("Pacifico", "assets/fonts/Pacifico.ttf");
    expect(fonts.resolve("Pacifico")).toBe("assets/fonts/Pacifico.ttf");
    expect(fonts.has("Pacifico")).toBe(true);
  });

  it("retourne null pour une police inconnue", () => {
    const fonts = createFontManager();
    expect(fonts.resolve("Inconnue")).toBeNull();
    expect(fonts.has("Inconnue")).toBe(false);
  });

  it("list() énumère les polices enregistrées", () => {
    const fonts = createFontManager();
    fonts.registerBundled("Pacifico", "a.ttf");
    fonts.registerBundled("CourierPrime", "b.ttf");
    expect(fonts.list().sort()).toEqual(["CourierPrime", "Pacifico"]);
  });

  it("un nouvel enregistrement de même nom remplace le chemin", () => {
    const fonts = createFontManager();
    fonts.registerBundled("Pacifico", "old.ttf");
    fonts.registerBundled("Pacifico", "new.ttf");
    expect(fonts.resolve("Pacifico")).toBe("new.ttf");
    expect(fonts.list()).toHaveLength(1);
  });
});
