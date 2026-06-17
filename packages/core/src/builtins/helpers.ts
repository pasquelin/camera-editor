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

/** Mutateur appliqué au projet vivant (via ProjectManager.mutate). */
export type Mutator = (project: Project) => void;

/** Accès typé à un tableau de piste comme `EditorObject[]`. */
export function trackArray(project: Readonly<Project>, key: ObjectTrackKey): EditorObject[] {
  return project.tracks[key as keyof ProjectTracks] as unknown as EditorObject[];
}

/**
 * Récupère la **référence vivante** d'un objet par id (et type attendu) dans une
 * piste, ou lève une erreur explicite. La référence renvoyée appartient au projet
 * en cours et peut être mutée directement dans le mutateur.
 */
export function requireObject(
  project: Readonly<Project>,
  key: ObjectTrackKey,
  objectId: string,
  command: string,
  expectedType?: string,
): EditorObject {
  const found = trackArray(project, key).find((o) => o.id === objectId);
  if (!found) {
    throw new Error(`${command}: objet introuvable "${objectId}" dans la piste "${key}"`);
  }
  if (expectedType !== undefined && found.type !== expectedType) {
    throw new Error(`${command}: "${objectId}" n'est pas un objet "${expectedType}"`);
  }
  return found;
}

/**
 * Construit une commande à undo par snapshot. `prepare` valide la requête (il
 * peut lever) PUIS renvoie le mutateur à appliquer. La validation se déroule
 * **avant** la capture du snapshot : une requête invalide ne clone donc jamais
 * le projet et n'empile rien (le CommandBus n'enregistre qu'après un execute
 * réussi).
 */
export function snapshotCommand(id: string, prepare: (ctx: EditorContext) => Mutator): Command {
  let before: Snapshot | null = null;
  return {
    id,
    execute(ctx) {
      const mutate = prepare(ctx);
      before = ctx.project.snapshot();
      ctx.project.mutate(mutate);
    },
    undo(ctx) {
      if (before) ctx.project.restore(before);
    },
  };
}
