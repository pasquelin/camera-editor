/**
 * Commandes de transition (jointures entre clips contigus d'une VideoTrack).
 * Stockées dans `project.tracks.transitions` (ClipJunction[]). Le rendu est assuré
 * par le Renderer / l'Export Engine ; ici, seule la mutation des données.
 * Voir docs/23-TRANSITION-ENGINE.md.
 */
import type { CommandFactory } from "../command-bus/CommandBus";
import type { ClipJunction, Transition } from "../types/project";
import { genId } from "../utils/id";
import { snapshotCommand } from "./helpers";

interface JunctionKey {
  trackId: string;
  clipAId: string;
  clipBId: string;
}

const matches = (j: ClipJunction, key: JunctionKey): boolean =>
  j.trackId === key.trackId && j.clipAId === key.clipAId && j.clipBId === key.clipBId;

/** `transition.set` — attache (ou remplace) une transition à une jointure. */
export const transitionSetCommand: CommandFactory = (payload) =>
  snapshotCommand("transition.set", () => {
    const p = payload as JunctionKey & { transition: Transition };
    return (project) => {
      const arr = project.tracks.transitions;
      const existing = arr.find((j) => matches(j, p));
      if (existing) {
        existing.transition = { ...p.transition };
      } else {
        arr.push({
          id: genId(),
          trackId: p.trackId,
          clipAId: p.clipAId,
          clipBId: p.clipBId,
          transition: { ...p.transition },
        });
      }
    };
  });

/** `transition.update` — modifie la durée/les options d'une transition existante. */
export const transitionUpdateCommand: CommandFactory = (payload) =>
  snapshotCommand("transition.update", (ctx) => {
    const p = payload as JunctionKey & { patch: Partial<Omit<Transition, "type">> };
    const junction = ctx.project.get().tracks.transitions.find((j) => matches(j, p));
    if (!junction) throw new Error("transition.update: jointure introuvable");
    return () => {
      Object.assign(junction.transition, p.patch);
    };
  });

/** `transition.remove` — supprime la transition ; la jointure redevient un cut. */
export const transitionRemoveCommand: CommandFactory = (payload) =>
  snapshotCommand("transition.remove", (ctx) => {
    const p = payload as JunctionKey;
    const arr = ctx.project.get().tracks.transitions;
    const idx = arr.findIndex((j) => matches(j, p));
    if (idx < 0) throw new Error("transition.remove: jointure introuvable");
    return (project) => {
      project.tracks.transitions.splice(idx, 1);
    };
  });
