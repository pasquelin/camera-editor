/**
 * Fabriques de commandes built-in (CommandFactory). Conventions de payload :
 *   create : { id?: string; object?: Partial<T> }
 *   update : { objectId: string; patch: Partial<T> }
 *   delete : { objectId: string }
 * Les verbes spécifiques (trim, split, style…) sont définis dans commands.*.ts.
 */
import type { CommandFactory } from "../command-bus/CommandBus";
import type { EditorObject } from "../types/project";
import { genId } from "../utils/id";
import {
  type BuiltinObjectType,
  TRACK_OF_TYPE,
  requireObject,
  snapshotCommand,
  trackArray,
} from "./helpers";

interface CreatePayload {
  id?: string;
  object?: Record<string, unknown>;
}
interface UpdatePayload {
  objectId: string;
  patch?: Record<string, unknown>;
}
interface DeletePayload {
  objectId: string;
}

/** `<type>.create` — construit depuis defaultValues() + overrides, puis ajoute. */
export function createCommand(type: BuiltinObjectType): CommandFactory {
  const trackKey = TRACK_OF_TYPE[type];
  return (payload): ReturnType<typeof snapshotCommand> => {
    const p = (payload ?? {}) as CreatePayload;
    return snapshotCommand(`${type}.create`, (ctx) => {
      const def = ctx.objects.get(type);
      if (!def) throw new Error(`${type}.create: type non enregistré`);
      const obj = {
        ...def.defaultValues(),
        ...(p.object ?? {}),
        type,
        id: p.id ?? genId(),
      } as EditorObject;
      ctx.project.mutate((project) => {
        trackArray(project, trackKey).push(obj);
      });
    });
  };
}

/** `<type>.update` — fusion superficielle d'un patch (id/type protégés). */
export function updateCommand(type: BuiltinObjectType): CommandFactory {
  const trackKey = TRACK_OF_TYPE[type];
  return (payload): ReturnType<typeof snapshotCommand> => {
    const p = payload as UpdatePayload;
    return snapshotCommand(`${type}.update`, (ctx) => {
      requireObject(ctx.project.get(), trackKey, p.objectId, `${type}.update`);
      ctx.project.mutate((project) => {
        const obj = trackArray(project, trackKey).find((o) => o.id === p.objectId);
        if (!obj) return;
        Object.assign(obj, p.patch ?? {}, { id: obj.id, type: obj.type });
      });
    });
  };
}

/** `<type>.delete` — retire l'objet ciblé de sa piste. */
export function deleteCommand(type: BuiltinObjectType): CommandFactory {
  const trackKey = TRACK_OF_TYPE[type];
  return (payload): ReturnType<typeof snapshotCommand> => {
    const p = payload as DeletePayload;
    return snapshotCommand(`${type}.delete`, (ctx) => {
      requireObject(ctx.project.get(), trackKey, p.objectId, `${type}.delete`);
      ctx.project.mutate((project) => {
        const arr = trackArray(project, trackKey);
        const idx = arr.findIndex((o) => o.id === p.objectId);
        if (idx >= 0) arr.splice(idx, 1);
      });
    });
  };
}
