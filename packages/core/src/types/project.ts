/**
 * Modèle de données du projet — voir docs/02-PROJECT-SCHEMA.md (source de vérité).
 */

export type AspectRatio = "9:16" | "16:9" | "1:1" | "4:3";

export interface EditorObject {
  id: string;
  type: string; // clé dans l'ObjectRegistry
  startTime: number; // ms
  endTime: number; // ms
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number; // degrés
  scale: number; // 1.0 = 100%
  opacity: number; // 0–1
  locked: boolean;
  visible: boolean;
}

export interface VideoObject extends EditorObject {
  type: "video";
  source: string;
  trim: { start: number; end: number };
  crop: { x: number; y: number; width: number; height: number };
  speed: number; // 0.25–4.0
  volume: number; // 0–1
  muted: boolean;
  reversed: boolean;
  cover?: number; // timecode (ms) de la frame de couverture
}

export interface ImageObject extends EditorObject {
  type: "image";
  source: string;
  crop: { x: number; y: number; width: number; height: number };
  flipH: boolean; // miroir horizontal
  flipV: boolean; // miroir vertical
}

export interface TextObject extends EditorObject {
  type: "text";
  content: string;
  style: TextStyle;
  animation: TextAnimation | null;
}

export interface StickerObject extends EditorObject {
  type: "sticker";
  source: string;
  format: "png" | "svg" | "gif" | "lottie";
  animation: StickerAnimation | null;
}

export interface AudioObject extends EditorObject {
  type: "audio";
  source: string;
  role: "background" | "voiceover" | "sfx";
  volume: number; // 0–2
  fadeIn: number; // ms
  fadeOut: number; // ms
  speed: number; // 0.5–2.0
  loop: boolean;
  trim: { start: number; end: number };
}

export interface FilterObject extends EditorObject {
  type: "filter";
  filterId: string;
  intensity: number; // 0–1
  params: Record<string, number>;
}

export interface TextStyle {
  fontFamily: string;
  fontSize: number;
  color: string;
  gradient?: { start: string; end: string; angle: number };
  stroke?: { color: string; width: number };
  background?: { color: string; padding: number; borderRadius: number };
  shadow?: { color: string; blur: number; offsetX: number; offsetY: number };
  letterSpacingPx: number;
  lineHeight: number;
  align: "left" | "center" | "right";
  opacity: number;
}

export type TextAnimation =
  | "fadeIn"
  | "fadeOut"
  | "slideUp"
  | "slideDown"
  | "slideLeft"
  | "slideRight"
  | "zoom"
  | "bounce"
  | "typewriter";

export type StickerAnimation = "fadeIn" | "fadeOut" | "zoom" | "bounce" | "pulse" | "spin";

export interface FilterParams {
  intensity: number; // 0–1
  contrast: number; // -1–1
  saturation: number; // -1–1
  brightness: number; // -1–1
  temperature: number; // -1–1
}

export interface Transition {
  // built-in (camelCase) ou id d'un TransitionPack
  type:
    | "cut"
    | "fade"
    | "zoom"
    | "slideUp"
    | "slideDown"
    | "slideLeft"
    | "slideRight"
    | "blur"
    | "dissolve"
    | (string & {});
  durationMs: number;
  easing?: "linear" | "easeIn" | "easeOut" | "easeInOut";
}

export interface ClipJunction {
  id: string;
  trackId: string;
  clipAId: string; // clip sortant
  clipBId: string; // clip entrant
  transition: Transition;
}

export interface ProjectTracks {
  // La piste visuelle accueille clips vidéo ET images fixes (cf. docs/05-TIMELINE.md :
  // un VideoTrack contient VideoObject + ImageObject).
  video: (VideoObject | ImageObject)[];
  audio: AudioObject[];
  text: TextObject[];
  sticker: StickerObject[];
  filter: FilterObject[];
  transitions: ClipJunction[];
}

export interface Project {
  version: string;
  id: string;
  createdAt: string; // ISO8601
  updatedAt: string; // ISO8601
  duration: number; // ms
  aspectRatio: AspectRatio;
  tracks: ProjectTracks;
}

/** Copie immuable d'un projet, utilisée pour undo/redo. */
export type Snapshot = Readonly<Project>;
