import { describe, expect, it } from "vitest";
import { TEXT_ANIMATIONS, isTextAnimation } from "./animations";

describe("TEXT_ANIMATIONS", () => {
  it("liste les 9 animations de texte (docs/19)", () => {
    expect([...TEXT_ANIMATIONS]).toEqual([
      "fadeIn",
      "fadeOut",
      "slideUp",
      "slideDown",
      "slideLeft",
      "slideRight",
      "zoom",
      "bounce",
      "typewriter",
    ]);
  });
});

describe("isTextAnimation", () => {
  it("reconnaît une animation valide", () => {
    expect(isTextAnimation("typewriter")).toBe(true);
    expect(isTextAnimation("zoom")).toBe(true);
  });

  it("rejette une valeur inconnue ou non-string", () => {
    expect(isTextAnimation("nope")).toBe(false);
    expect(isTextAnimation(null)).toBe(false);
    expect(isTextAnimation(42)).toBe(false);
  });
});
