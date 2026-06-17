/**
 * @media-studio/core — noyau pur du SDK Media Studio.
 * Voir docs/01-ARCHITECTURE.md et docs/02-PROJECT-SCHEMA.md.
 */

// Façade et modules (valeurs)
export { Core } from "./core/Core";
export { EventBus } from "./event-bus/EventBus";
export { ObjectRegistry } from "./object-registry/ObjectRegistry";
export { SchemaRegistry } from "./schema-registry/SchemaRegistry";
export { CommandBus, DEFAULT_UNDO_STACK_SIZE } from "./command-bus/CommandBus";
export {
  ProjectManager,
  createEmptyProject,
  CURRENT_PROJECT_VERSION,
} from "./project-manager/ProjectManager";
export { PluginManager } from "./plugin-manager/PluginManager";
export { AssetManager } from "./asset-manager/AssetManager";
export { genId } from "./utils/id";
export { deepClone } from "./utils/clone";

// Built-in (types d'objets + commandes). « built-in = plugin » : enregistrés via
// l'API publique, réutilisables et remplaçables. Voir docs/02 et docs/06.
export { registerBuiltins } from "./builtins/registerBuiltins";
export {
  builtinObjectDefinitions,
  videoObjectDefinition,
  imageObjectDefinition,
  textObjectDefinition,
  audioObjectDefinition,
  stickerObjectDefinition,
  filterObjectDefinition,
  ALLOWED_VIDEO_SPEEDS,
} from "./builtins/definitions";

// Contrats (types)
export type { CoreDependencies } from "./core/Core";
export type { Command, CommandFactory, EditorContext } from "./command-bus/CommandBus";
export type { ObjectDefinition, JSONSchema } from "./object-registry/ObjectRegistry";
export type { MigrateFunction } from "./schema-registry/SchemaRegistry";
export type { MediaStudioPlugin, PluginVerifier } from "./plugin-manager/PluginManager";
export type * from "./types";
