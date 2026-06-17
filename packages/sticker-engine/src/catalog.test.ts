import { describe, expect, it } from "vitest";
import {
  STICKER_CATEGORIES,
  STICKER_FORMATS,
  createStickerCatalog,
  isStickerFormat,
  type StickerDescriptor,
} from "./catalog";

const PNG = (id: string, category: string): StickerDescriptor => ({
  id,
  category,
  format: "png",
  source: `${id}.png`,
});

describe("STICKER_CATEGORIES / STICKER_FORMATS", () => {
  it("expose les 7 catégories (docs/20)", () => {
    expect([...STICKER_CATEGORIES]).toEqual([
      "Emoji",
      "Réactions",
      "Love",
      "Food",
      "Travel",
      "Funny",
      "Shapes",
    ]);
  });

  it("expose les 4 formats et isStickerFormat", () => {
    expect([...STICKER_FORMATS]).toEqual(["png", "svg", "gif", "lottie"]);
    expect(isStickerFormat("lottie")).toBe(true);
    expect(isStickerFormat("webp")).toBe(false);
    expect(isStickerFormat(null)).toBe(false);
  });
});

describe("createStickerCatalog", () => {
  it("vide par défaut", () => {
    const catalog = createStickerCatalog();
    expect(catalog.list()).toEqual([]);
    expect(catalog.get("x")).toBeNull();
  });

  it("register ajoute un sticker, get/has/byCategory le retrouvent", () => {
    const catalog = createStickerCatalog();
    catalog.register(PNG("heart", "Love"));
    expect(catalog.has("heart")).toBe(true);
    expect(catalog.get("heart")?.source).toBe("heart.png");
    expect(catalog.byCategory("Love").map((s) => s.id)).toEqual(["heart"]);
    expect(catalog.byCategory("Food")).toEqual([]);
  });

  it("register de même id remplace", () => {
    const catalog = createStickerCatalog();
    catalog.register(PNG("fire", "Réactions"));
    catalog.register({ ...PNG("fire", "Réactions"), source: "fire-v2.png" });
    expect(catalog.list()).toHaveLength(1);
    expect(catalog.get("fire")?.source).toBe("fire-v2.png");
  });

  it("unregister retire un sticker", () => {
    const catalog = createStickerCatalog();
    catalog.register(PNG("star", "Shapes"));
    expect(catalog.unregister("star")).toBe(true);
    expect(catalog.has("star")).toBe(false);
    expect(catalog.unregister("star")).toBe(false);
  });

  it("amorçage initial moins hidden", () => {
    const catalog = createStickerCatalog({
      initial: [PNG("a", "Emoji"), PNG("b", "Emoji")],
      hidden: ["b"],
    });
    expect(catalog.list().map((s) => s.id)).toEqual(["a"]);
  });
});
