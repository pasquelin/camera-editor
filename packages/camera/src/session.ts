/**
 * Session de capture headless : gère l'état optique (facing/flash/ratio/zoom/
 * exposition, bornés) et intègre chaque capture au projet via le CommandBus
 * (image.create / video.create). L'enregistrement segmenté positionne les clips en
 * séquence sur la piste visuelle. La caméra ne mute jamais le projet directement.
 * Voir docs/16-CAMERA.md, ADR-0007.
 */
import type { Core } from "@media-studio/core";
import type {
  CameraConfig,
  CameraFacing,
  CameraRatio,
  FlashMode,
  PhotoCapture,
  PointOfInterest,
  VideoCapture,
} from "./types";

const clamp = (v: number, min: number, max: number): number => Math.min(max, Math.max(min, v));

/** Borne une compensation EV à [-2, 2] par pas de 0.1 (docs/16). */
export function clampExposure(ev: number): number {
  return clamp(Math.round(ev * 10) / 10, -2, 2);
}

/** Borne un zoom à la plage [minZoom, maxZoom] du device. */
export function clampZoom(scale: number, minZoom: number, maxZoom: number): number {
  return clamp(scale, minZoom, maxZoom);
}

/** Borne un point d'intérêt (focus) au carré normalisé [0,1]². */
export function clampPointOfInterest(point: PointOfInterest): PointOfInterest {
  return { x: clamp(point.x, 0, 1), y: clamp(point.y, 0, 1) };
}

export interface CameraSession {
  readonly facing: CameraFacing;
  readonly flash: FlashMode;
  readonly ratio: CameraRatio;
  readonly exposure: number;
  /** Ids des clips/photos créés pendant la session, dans l'ordre de capture. */
  readonly captured: readonly string[];

  switchCamera(facing?: CameraFacing): void;
  setFlash(mode: FlashMode): void;
  setRatio(ratio: CameraRatio): void;
  setExposure(ev: number): void;
  focus(point: PointOfInterest): PointOfInterest;

  /** Intègre une photo capturée au projet (→ image.create). Retourne son id. */
  addPhoto(capture: PhotoCapture, id?: string): string;
  /** Intègre un segment vidéo au projet (→ video.create), positionné en séquence. */
  addClip(capture: VideoCapture, id?: string): string;
}

let seq = 0;
const nextId = (prefix: string): string => `${prefix}-${(seq += 1)}`;

/** Crée une session de capture liée à un Core. */
export function createCameraSession(core: Core, config: CameraConfig = {}): CameraSession {
  let facing: CameraFacing = config.defaultFacing ?? "back";
  let flash: FlashMode = config.defaultFlash ?? "auto";
  let ratio: CameraRatio = config.defaultRatio ?? "9:16";
  let exposure = 0;
  const captured: string[] = [];
  let nextStartMs = 0; // position du prochain clip sur la timeline (séquence)

  const ensureCapacity = (): void => {
    if (config.maxSegments !== undefined && captured.length >= config.maxSegments) {
      throw new Error(`camera: nombre maximal de segments atteint (${config.maxSegments})`);
    }
  };

  return {
    get facing() {
      return facing;
    },
    get flash() {
      return flash;
    },
    get ratio() {
      return ratio;
    },
    get exposure() {
      return exposure;
    },
    get captured() {
      return captured;
    },

    switchCamera: (next) => {
      facing = next ?? (facing === "back" ? "front" : "back");
    },
    setFlash: (mode) => {
      flash = mode;
    },
    setRatio: (next) => {
      ratio = next;
    },
    setExposure: (ev) => {
      exposure = clampExposure(ev);
    },
    focus: (point) => clampPointOfInterest(point),

    addPhoto: (capture, id) => {
      ensureCapacity();
      const photoId = id ?? nextId("photo");
      core.execute("image.create", {
        id: photoId,
        object: {
          source: capture.uri,
          width: capture.width,
          height: capture.height,
        },
      });
      captured.push(photoId);
      return photoId;
    },

    addClip: (capture, id) => {
      ensureCapacity();
      const clipId = id ?? nextId("clip");
      const startTime = nextStartMs;
      const endTime = startTime + capture.durationMs;
      core.execute("video.create", {
        id: clipId,
        object: {
          source: capture.uri,
          width: capture.width,
          height: capture.height,
          startTime,
          endTime,
          trim: { start: 0, end: capture.durationMs },
        },
      });
      nextStartMs = endTime;
      captured.push(clipId);
      return clipId;
    },
  };
}
