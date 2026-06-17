import { describe, expect, it } from "vitest";
import { TEXT_PRESETS, resolveTextPreset, type TextPreset } from "./presets";

const ALL: TextPreset[] = [
  "Classic",
  "Minimal",
  "Bold",
  "Elegant",
  "Neon",
  "Handwriting",
  "Typewriter",
];

describe("TEXT_PRESETS", () => {
  it("expose les 7 styles prédéfinis (docs/19)", () => {
    expect(Object.keys(TEXT_PRESETS).sort()).toEqual([...ALL].sort());
  });

  it("chaque preset est un TextStyle complet (champs requis)", () => {
    for (const name of ALL) {
      const s = TEXT_PRESETS[name];
      expect(typeof s.fontFamily).toBe("string");
      expect(typeof s.fontSize).toBe("number");
      expect(typeof s.color).toBe("string");
      expect(typeof s.letterSpacingPx).toBe("number");
      expect(typeof s.lineHeight).toBe("number");
      expect(["left", "center", "right"]).toContain(s.align);
      expect(typeof s.opacity).toBe("number");
    }
  });
});

describe("resolveTextPreset", () => {
  it("résout le style de base d'un preset", () => {
    const bold = resolveTextPreset("Bold");
    expect(bold.fontSize).toBe(48);
    expect(bold.stroke).toEqual({ color: "#000000", width: 3 });
  });

  it("fusionne un override par-dessus le preset", () => {
    const s = resolveTextPreset("Classic", { color: "#FF0000", fontSize: 50 });
    expect(s.color).toBe("#FF0000");
    expect(s.fontSize).toBe(50);
    expect(s.align).toBe("center"); // inchangé
  });

  it("ne mute pas le preset d'origine", () => {
    resolveTextPreset("Classic", { color: "#000000" });
    expect(TEXT_PRESETS.Classic.color).toBe("#FFFFFF");
  });
});
