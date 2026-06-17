/**
 * Briques partagées par les commandes built-in. Toutes les commandes built-in
 * adoptent l'undo par **snapshot uniforme** : on capture le projet avant la
 * mutation, l'undo restaure ce snapshot. Simple et robuste (cf. ADR-0007).
 */
import type { Command, EditorContext } from "../command-bus/CommandBus";
import type { EditorObject, Project, ProjectTracks, Snapshot } from "../types/project";

/** Pistes pouvant contenir des EditorObject (transitions exclues). */
export type ObjectTrackKey = "video" | "audio" | "text" | "sticker" | "filter";

/** Piste de destination de chaque type d'objet built-in. */
export const TRACK_OF_TYPE = {
  video: "video",
  image: "video", // les images vivent sur la piste visuelle (cf. 05-TIMELINE)
  text: "text",
  audio: "audio",
  sticker: "sticker",
  filter: "filter",
} as const satisfies Record<string, ObjectTrackKey>;

export type BuiltinObjectType = keyof typeof TRACK_OF_TYPE;

/** Accès typé à un tableau de piste comme `EditorObject[]`. */
export function trackArray(project: Project, key: ObjectTrackKey): EditorObject[] {
  return project.tracks[key as keyof ProjectTracks] as unknown as EditorObject[];
}

/** Récupère un objet par id dans une piste, ou lève une erreur explicite. */
export function requireObject(
  project: Readonly<Project>,
  key: ObjectTrackKey,
  objectId: string,
  command: string,
): EditorObject {
  const found = trackArray(project as Project, key).find((o) => o.id === objectId);
  if (!found) {
    throw new Error(`${command}: objet introuvable "${objectId}" dans la piste "${key}"`);
  }
  return found;
}

/**
 * Construit une commande à undo par snapshot. `apply` effectue la validation
 * puis la mutation ; s'il lève avant toute mutation, l'historique n'est pas
 * pollué (le CommandBus n'empile la commande qu'après un execute réussi).
 */
export function snapshotCommand(id: string, apply: (ctx: EditorContext) => void): Command {
  let before: Snapshot | null = null;
  return {
    id,
    execute(ctx) {
      const snap = ctx.project.snapshot();
      apply(ctx);
      before = snap;
    },
    undo(ctx) {
      if (before) ctx.project.restore(before);
    },
  };
}
