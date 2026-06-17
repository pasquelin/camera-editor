import { describe, expect, it } from "vitest";
import { BUILTIN_FILTERS, createFilterCatalog } from "./catalog";

describe("BUILTIN_FILTERS", () => {
  it("contient les 17 filtres du catalogue (docs/21)", () => {
    expect(BUILTIN_FILTERS).toHaveLength(17);
  });

  it("couvre les 5 catégories", () => {
    const categories = new Set(BUILTIN_FILTERS.map((f) => f.category));
    expect([...categories].sort()).toEqual([
      "Beauty",
      "Black & White",
      "Cinema",
      "Social",
      "Vintage",
    ]);
  });

  it("a des ids uniques et non vides", () => {
    const ids = BUILTIN_FILTERS.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.every((id) => id.length > 0)).toBe(true);
  });
});

describe("createFilterCatalog", () => {
  it("sans config : expose tous les built-in", () => {
    const catalog = createFilterCatalog();
    expect(catalog.list()).toHaveLength(17);
    expect(catalog.has("cinema-drama")).toBe(true);
    expect(catalog.get("cinema-drama")?.name).toBe("Drama");
    expect(catalog.get("inconnu")).toBeNull();
  });

  it("byCategory filtre par catégorie", () => {
    const catalog = createFilterCatalog();
    const social = catalog.byCategory("Social");
    expect(social.map((f) => f.id).sort()).toEqual([
      "social-dream",
      "social-neon",
      "social-reels",
      "social-tiktok",
    ]);
  });

  it("hidden masque des filtres built-in", () => {
    const catalog = createFilterCatalog({ hidden: ["social-tiktok", "social-reels"] });
    expect(catalog.has("social-tiktok")).toBe(false);
    expect(catalog.has("social-neon")).toBe(true);
    expect(catalog.list()).toHaveLength(15);
  });

  it("custom ajoute un filtre", () => {
    const catalog = createFilterCatalog({
      custom: [{ id: "brand-sunset", name: "Sunset Brand", category: "Social" }],
    });
    expect(catalog.has("brand-sunset")).toBe(true);
    expect(catalog.list()).toHaveLength(18);
    expect(catalog.byCategory("Social").some((f) => f.id === "brand-sunset")).toBe(true);
  });

  it("custom remplace un built-in de même id", () => {
    const catalog = createFilterCatalog({
      custom: [{ id: "cinema-drama", name: "Drama Custom", category: "Cinema" }],
    });
    expect(catalog.list()).toHaveLength(17);
    expect(catalog.get("cinema-drama")?.name).toBe("Drama Custom");
  });
});
