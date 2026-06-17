/**
 * Définitions des types d'objets built-in (video, image, text, audio, sticker,
 * filter). Conformes à docs/02-PROJECT-SCHEMA.md. Le Core étant zéro-dépendance,
 * `validate` est écrit à la main (pas d'AJV) ; `schema` reste un littéral JSON
 * Schema descriptif, exploitable par un outillage externe.
 */
import type { ObjectDefinition, JSONSchema } from "../object-registry/ObjectRegistry";
import type {
  AudioObject,
  EditorObject,
  FilterObject,
  ImageObject,
  StickerObject,
  TextObject,
  TextStyle,
  VideoObject,
} from "../types/project";

/** Vitesses vidéo autorisées — docs/18-VIDEO-EDITOR.md. */
export const ALLOWED_VIDEO_SPEEDS = [0.25, 0.5, 1, 1.5, 2, 4] as const;

// ---- helpers de validation (sans dépendance) -------------------------------

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const isStr = (v: unknown): v is string => typeof v === "string";
const isBool = (v: unknown): v is boolean => typeof v === "boolean";
const inRange = (v: unknown, min: number, max: number): boolean => isNum(v) && v >= min && v <= max;
/** Appartenance à un ensemble de valeurs autorisées (avec narrowing). */
export const isOneOf = <T>(values: readonly T[], v: unknown): v is T =>
  (values as readonly unknown[]).includes(v);
const isRect = (v: unknown): boolean =>
  isObject(v) && isNum(v.x) && isNum(v.y) && isNum(v.width) && isNum(v.height);
const isRange = (v: unknown): boolean => isObject(v) && isNum(v.start) && isNum(v.end);

/** Valide la base commune à tout EditorObject pour un `type` attendu. */
function validateBase(v: unknown, type: string): v is Record<string, unknown> {
  return (
    isObject(v) &&
    v.type === type &&
    isStr(v.id) &&
    isNum(v.startTime) &&
    isNum(v.endTime) &&
    isNum(v.x) &&
    isNum(v.y) &&
    isNum(v.width) &&
    isNum(v.height) &&
    isNum(v.rotation) &&
    isNum(v.scale) &&
    v.scale >= 0 &&
    inRange(v.opacity, 0, 1) &&
    isBool(v.locked) &&
    isBool(v.visible)
  );
}

/** Champs de base par défaut, partagés par tous les types. */
function baseDefaults(type: string): EditorObject {
  return {
    id: "",
    type,
    startTime: 0,
    endTime: 0,
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    rotation: 0,
    scale: 1,
    opacity: 1,
    locked: false,
    visible: true,
  };
}

/** Schéma JSON Schema descriptif minimal d'un type (métadonnée). */
function describe(type: string, props: Record<string, unknown>): JSONSchema {
  return { $id: type, type: "object", properties: { type: { const: type }, ...props } };
}

// ---- video -----------------------------------------------------------------

export const videoObjectDefinition: ObjectDefinition<VideoObject> = {
  type: "video",
  schema: describe("video", {
    source: { type: "string" },
    speed: { enum: ALLOWED_VIDEO_SPEEDS },
    volume: { type: "number", minimum: 0, maximum: 1 },
  }),
  defaultValues: () => ({
    ...baseDefaults("video"),
    type: "video",
    source: "",
    trim: { start: 0, end: 0 },
    crop: { x: 0, y: 0, width: 0, height: 0 },
    speed: 1,
    volume: 1,
    muted: false,
    reversed: false,
  }),
  validate: (obj): boolean =>
    validateBase(obj, "video") &&
    isStr(obj.source) &&
    isRange(obj.trim) &&
    isRect(obj.crop) &&
    isOneOf(ALLOWED_VIDEO_SPEEDS, obj.speed) &&
    inRange(obj.volume, 0, 1) &&
    isBool(obj.muted) &&
    isBool(obj.reversed) &&
    (obj.cover === undefined || isNum(obj.cover)),
};

// ---- image -----------------------------------------------------------------

export const imageObjectDefinition: ObjectDefinition<ImageObject> = {
  type: "image",
  schema: describe("image", { source: { type: "string" } }),
  defaultValues: () => ({
    ...baseDefaults("image"),
    type: "image",
    source: "",
    crop: { x: 0, y: 0, width: 0, height: 0 },
    flipH: false,
    flipV: false,
  }),
  validate: (obj): boolean =>
    validateBase(obj, "image") &&
    isStr(obj.source) &&
    isRect(obj.crop) &&
    isBool(obj.flipH) &&
    isBool(obj.flipV),
};

// ---- text ------------------------------------------------------------------

export const TEXT_ANIMATIONS = [
  "fadeIn",
  "fadeOut",
  "slideUp",
  "slideDown",
  "slideLeft",
  "slideRight",
  "zoom",
  "bounce",
  "typewriter",
] as const;

const TEXT_ALIGNS = ["left", "center", "right"] as const;

function defaultTextStyle(): TextStyle {
  return {
    fontFamily: "Inter",
    fontSize: 24,
    color: "#ffffff",
    letterSpacingPx: 0,
    lineHeight: 1.2,
    align: "center",
    opacity: 1,
  };
}

function isTextStyle(v: unknown): boolean {
  return (
    isObject(v) &&
    isStr(v.fontFamily) &&
    isNum(v.fontSize) &&
    isStr(v.color) &&
    isNum(v.letterSpacingPx) &&
    isNum(v.lineHeight) &&
    isOneOf(TEXT_ALIGNS, v.align) &&
    inRange(v.opacity, 0, 1)
  );
}

export const textObjectDefinition: ObjectDefinition<TextObject> = {
  type: "text",
  schema: describe("text", { content: { type: "string" } }),
  defaultValues: () => ({
    ...baseDefaults("text"),
    type: "text",
    content: "",
    style: defaultTextStyle(),
    animation: null,
  }),
  validate: (obj): boolean =>
    validateBase(obj, "text") &&
    isStr(obj.content) &&
    isTextStyle(obj.style) &&
    (obj.animation === null || isOneOf(TEXT_ANIMATIONS, obj.animation)),
};

// ---- audio -----------------------------------------------------------------

const AUDIO_ROLES = ["background", "voiceover", "sfx"] as const;

export const audioObjectDefinition: ObjectDefinition<AudioObject> = {
  type: "audio",
  schema: describe("audio", {
    source: { type: "string" },
    role: { enum: AUDIO_ROLES },
    volume: { type: "number", minimum: 0, maximum: 2 },
  }),
  defaultValues: () => ({
    ...baseDefaults("audio"),
    type: "audio",
    source: "",
    role: "background",
    volume: 1,
    fadeIn: 0,
    fadeOut: 0,
    speed: 1,
    loop: false,
    trim: { start: 0, end: 0 },
  }),
  validate: (obj): boolean =>
    validateBase(obj, "audio") &&
    isStr(obj.source) &&
    isOneOf(AUDIO_ROLES, obj.role) &&
    inRange(obj.volume, 0, 2) &&
    isNum(obj.fadeIn) &&
    isNum(obj.fadeOut) &&
    inRange(obj.speed, 0.5, 2) &&
    isBool(obj.loop) &&
    isRange(obj.trim),
};

// ---- sticker ---------------------------------------------------------------

const STICKER_FORMATS = ["png", "svg", "gif", "lottie"] as const;
export const STICKER_ANIMATIONS = ["fadeIn", "fadeOut", "zoom", "bounce", "pulse", "spin"] as const;

export const stickerObjectDefinition: ObjectDefinition<StickerObject> = {
  type: "sticker",
  schema: describe("sticker", { source: { type: "string" }, format: { enum: STICKER_FORMATS } }),
  defaultValues: () => ({
    ...baseDefaults("sticker"),
    type: "sticker",
    source: "",
    format: "png",
    animation: null,
  }),
  validate: (obj): boolean =>
    validateBase(obj, "sticker") &&
    isStr(obj.source) &&
    isOneOf(STICKER_FORMATS, obj.format) &&
    (obj.animation === null || isOneOf(STICKER_ANIMATIONS, obj.animation)),
};

// ---- filter ----------------------------------------------------------------

export const filterObjectDefinition: ObjectDefinition<FilterObject> = {
  type: "filter",
  schema: describe("filter", {
    filterId: { type: "string" },
    intensity: { type: "number", minimum: 0, maximum: 1 },
  }),
  defaultValues: () => ({
    ...baseDefaults("filter"),
    type: "filter",
    filterId: "",
    intensity: 1,
    params: {},
  }),
  validate: (obj): boolean =>
    validateBase(obj, "filter") &&
    isStr(obj.filterId) &&
    inRange(obj.intensity, 0, 1) &&
    isObject(obj.params),
};

/** Toutes les définitions built-in, dans l'ordre d'enregistrement. */
export const builtinObjectDefinitions: ObjectDefinition[] = [
  videoObjectDefinition as ObjectDefinition,
  imageObjectDefinition as ObjectDefinition,
  textObjectDefinition as ObjectDefinition,
  audioObjectDefinition as ObjectDefinition,
  stickerObjectDefinition as ObjectDefinition,
  filterObjectDefinition as ObjectDefinition,
];
