import type { EditorObject, TextObject } from "../types/project";

/** Fabrique partagée d'un EditorObject de base pour les tests. */
export function baseEditorObject(overrides: Partial<EditorObject> = {}): EditorObject {
  return {
    id: "x",
    type: "text",
    startTime: 0,
    endTime: 1000,
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    rotation: 0,
    scale: 1,
    opacity: 1,
    locked: false,
    visible: true,
    ...overrides,
  };
}

export function makeTextObject(id: string, content: string): TextObject {
  return {
    ...baseEditorObject({ id }),
    type: "text",
    content,
    style: {
      fontFamily: "Inter",
      fontSize: 24,
      color: "#ffffff",
      letterSpacingPx: 0,
      lineHeight: 1.2,
      align: "center",
      opacity: 1,
    },
    animation: null,
  };
}
