/**
 * Enregistre les types et commandes built-in sur un Core, en utilisant
 * STRICTEMENT l'API publique (registerObjectType / registerCommand) — la même
 * que celle offerte aux plugins. « built-in = plugin » (cf. docs/06-PLUGIN-API.md).
 */
import type { Core } from "../core/Core";
import { createCommand, deleteCommand, updateCommand } from "./commands";
import {
  coverCommand,
  mergeCommand,
  muteCommand,
  reverseCommand,
  speedCommand,
  splitCommand,
  trimCommand,
} from "./commands.video";
import {
  audioFadeCommand,
  audioTrimCommand,
  audioVolumeCommand,
  cropCommand,
  stickerAnimateCommand,
  styleCommand,
  textAnimateCommand,
} from "./commands.media";
import { builtinObjectDefinitions } from "./definitions";
import type { BuiltinObjectType } from "./helpers";

const BUILTIN_TYPES: BuiltinObjectType[] = ["video", "image", "text", "audio", "sticker", "filter"];

export function registerBuiltins(core: Core): void {
  for (const def of builtinObjectDefinitions) {
    core.registerObjectType(def);
  }
  for (const type of BUILTIN_TYPES) {
    core.registerCommand(`${type}.create`, createCommand(type));
    core.registerCommand(`${type}.update`, updateCommand(type));
    core.registerCommand(`${type}.delete`, deleteCommand(type));
  }

  // Commandes vidéo spécifiques (docs/18-VIDEO-EDITOR.md).
  core.registerCommand("video.trim", trimCommand);
  core.registerCommand("video.split", splitCommand);
  core.registerCommand("video.merge", mergeCommand);
  core.registerCommand("video.reverse", reverseCommand);
  core.registerCommand("video.speed", speedCommand);
  core.registerCommand("video.mute", muteCommand);
  core.registerCommand("video.cover", coverCommand);

  // Commandes image / text / sticker / audio (docs/17, 19, 20, 22).
  core.registerCommand("image.crop", cropCommand);
  core.registerCommand("text.style", styleCommand);
  core.registerCommand("text.animate", textAnimateCommand);
  core.registerCommand("sticker.animate", stickerAnimateCommand);
  core.registerCommand("audio.trim", audioTrimCommand);
  core.registerCommand("audio.volume", audioVolumeCommand);
  core.registerCommand("audio.fade", audioFadeCommand);
}
