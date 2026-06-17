import { describe, expect, it } from "vitest";
import { STICKER_ANIMATIONS, isStickerAnimation } from "./animations";

describe("STICKER_ANIMATIONS", () => {
  it("liste les 6 animations de sticker (docs/20 / docs/02)", () => {
    expect([...STICKER_ANIMATIONS]).toEqual([
      "fadeIn",
      "fadeOut",
      "zoom",
      "bounce",
      "pulse",
      "spin",
    ]);
  });
});

describe("isStickerAnimation", () => {
  it("reconnaît une animation valide, rejette le reste", () => {
    expect(isStickerAnimation("pulse")).toBe(true);
    expect(isStickerAnimation("spin")).toBe(true);
    expect(isStickerAnimation("typewriter")).toBe(false);
    expect(isStickerAnimation(null)).toBe(false);
  });
});
