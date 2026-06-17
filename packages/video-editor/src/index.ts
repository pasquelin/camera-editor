/**
 * @media-studio/video-editor — contrôleur headless d'édition vidéo. API typée et
 * ergonomique au-dessus des commandes `video.*` du Core (toutes via CommandBus →
 * undo/redo). L'UI `<VideoEditor />` est un consommateur optionnel.
 * Voir docs/18-VIDEO-EDITOR.md.
 */
import type { Core, VideoObject } from "@media-studio/core";

export interface VideoEditorController {
  create(object?: Partial<VideoObject>, id?: string): void;
  update(objectId: string, patch: Partial<VideoObject>): void;
  remove(objectId: string): void;
  trim(objectId: string, trim: { start: number; end: number }): void;
  split(objectId: string, atTimeMs: number, newId?: string): void;
  merge(objectIdA: string, objectIdB: string): void;
  reverse(objectId: string, reversed?: boolean): void;
  setSpeed(objectId: string, speed: number): void;
  mute(objectId: string, muted?: boolean): void;
  setCover(objectId: string, cover: number): void;
  undo(): void;
  redo(): void;
  canUndo(): boolean;
  canRedo(): boolean;
}

/** Crée un contrôleur d'édition vidéo lié à un Core. */
export function createVideoEditor(core: Core): VideoEditorController {
  return {
    create: (object, id) => core.execute("video.create", { id, object }),
    update: (objectId, patch) => core.execute("video.update", { objectId, patch }),
    remove: (objectId) => core.execute("video.delete", { objectId }),
    trim: (objectId, trim) => core.execute("video.trim", { objectId, trim }),
    split: (objectId, atTimeMs, newId) =>
      core.execute("video.split", { objectId, atTimeMs, newId }),
    merge: (objectIdA, objectIdB) => core.execute("video.merge", { objectIdA, objectIdB }),
    reverse: (objectId, reversed) => core.execute("video.reverse", { objectId, reversed }),
    setSpeed: (objectId, speed) => core.execute("video.speed", { objectId, speed }),
    mute: (objectId, muted) => core.execute("video.mute", { objectId, muted }),
    setCover: (objectId, cover) => core.execute("video.cover", { objectId, cover }),
    undo: () => core.undo(),
    redo: () => core.redo(),
    canUndo: () => core.commands.canUndo(),
    canRedo: () => core.commands.canRedo(),
  };
}
