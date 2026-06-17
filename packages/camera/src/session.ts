/**
 * Session de capture headless : gère l'état optique (facing/flash/ratio/zoom/
 * exposition, bornés) et intègre chaque capture au projet via le CommandBus
 * (image.create / video.create). L'enregistrement segmenté positionne les clips à
 * la suite des clips vidéo déjà présents (vérité du projet). La caméra ne mute
 * jamais le projet directement. Voir docs/16-CAMERA.md, ADR-0007.
 */
import type { Core, Project } from "@media-studio/core";
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

/** Fin de la piste vidéo (max endTime), point de départ du prochain segment. */
function nextVideoStart(project: Readonly<Project>): number {
  let end = 0;
  for (const clip of project.tracks.video) if (clip.endTime > end) end = clip.endTime;
  return end;
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
  /** Intègre un segment vidéo au projet (→ video.create), à la suite de la piste. */
  addClip(capture: VideoCapture, id?: string): string;
}

/** Crée une session de capture liée à un Core. */
export function createCameraSession(core: Core, config: CameraConfig = {}): CameraSession {
  let facing: CameraFacing = config.defaultFacing ?? "back";
  let flash: FlashMode = config.defaultFlash ?? "auto";
  let ratio: CameraRatio = config.defaultRatio ?? "9:16";
  let exposure = 0;
  let seq = 0;
  const captured: string[] = [];

  const nextId = (prefix: string): string => `${prefix}-${(seq += 1)}`;

  /** Corps commun : capacité, id, dispatch CommandBus, suivi. */
  const addCapture = (
    prefix: string,
    command: string,
    object: Record<string, unknown>,
    id?: string,
  ): string => {
    if (config.maxSegments !== undefined && captured.length >= config.maxSegments) {
      throw new Error(`camera: nombre maximal de segments atteint (${config.maxSegments})`);
    }
    const captureId = id ?? nextId(prefix);
    core.execute(command, { id: captureId, object });
    captured.push(captureId);
    return captureId;
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

    addPhoto: (capture, id) =>
      addCapture(
        "photo",
        "image.create",
        { source: capture.uri, width: capture.width, height: capture.height },
        id,
      ),

    addClip: (capture, id) => {
      const startTime = nextVideoStart(core.project.get());
      return addCapture(
        "clip",
        "video.create",
        {
          source: capture.uri,
          width: capture.width,
          height: capture.height,
          startTime,
          endTime: startTime + capture.durationMs,
          trim: { start: 0, end: capture.durationMs },
        },
        id,
      );
    },
  };
}
