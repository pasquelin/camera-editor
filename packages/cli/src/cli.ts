/**
 * CLI `media-studio` — scaffolding et diagnostics. Sans dépendance externe (parsing
 * d'arguments manuel). Voir docs/25-DEVELOPER-DOCS.md.
 *
 *   media-studio info
 *   media-studio init [fichier.json]            # projet vide + étapes suivantes
 *   media-studio new-project [fichier.json]
 *   media-studio create-plugin <id> [fichier.ts]
 *   media-studio doctor
 */
import { writeFileSync } from "node:fs";
import { createEmptyProject } from "@media-studio/core";

const log = (...args: unknown[]): void => console.log(...args);

/** Écrit `content` dans `out` (avec message) ou l'affiche sur stdout. */
function writeOrLog(content: string, out?: string, message?: string): void {
  if (out) {
    writeFileSync(out, content);
    if (message) log(message);
  } else {
    log(content);
  }
}

/** Transforme un id (kebab/snake) en PascalCase pour un nom de classe. */
function toPascalCase(id: string): string {
  return id
    .replace(/[^a-zA-Z0-9]+(.)?/g, (_m, c: string) => (c ? c.toUpperCase() : ""))
    .replace(/^./, (c) => c.toUpperCase());
}

function info(): void {
  log("Media Studio SDK");
  log("  Point d'entrée : @media-studio/sdk (createMediaStudio)");
  log("  Couche React   : @media-studio/ui (MediaStudioProvider, <MediaStudio>)");
  log("  Moteurs        : filter/text/sticker/transition/audio-engine, runtime, timeline");
  log(
    "  Services       : licensing, background-jobs, export-engine, security, asset-manager, camera",
  );
}

function newProject(out?: string): void {
  const json = `${JSON.stringify(createEmptyProject(), null, 2)}\n`;
  writeOrLog(json, out, out && `Projet vide écrit dans ${out}`);
}

function init(out = "media-studio.project.json"): void {
  newProject(out);
  log("");
  log("Étapes suivantes :");
  log("  1. pnpm add @media-studio/sdk @media-studio/ui");
  log("  2. Monter <MediaStudioProvider> à la racine (voir docs/26-STUDIO-FLOW).");
  log("  3. media-studio doctor  # vérifier la config Expo / New Arch / Metro");
}

function createPlugin(id: string | undefined, out?: string): void {
  if (!id) {
    console.error("Usage : media-studio create-plugin <id> [fichier.ts]");
    process.exitCode = 1;
    return;
  }
  const template = `import type { MediaStudioPlugin, Core } from "@media-studio/core";

export class ${toPascalCase(id)}Plugin implements MediaStudioPlugin {
  id = "${id}";
  version = "1.0.0";

  onRegister(editor: Core): void {
    // editor.registerObjectType(...) / editor.registerCommand(...) / editor.on(...)
  }

  onDestroy(): void {
    // nettoyage
  }
}
`;
  writeOrLog(template, out, out && `Plugin "${id}" généré dans ${out}`);
}

function doctor(): void {
  log("media-studio doctor — checklist d'intégration Expo :");
  log("  [ ] New Architecture activée (app.json: expo.newArchEnabled = true)");
  log("  [ ] Metro configuré pour le monorepo (watchFolders + unstable_enableSymlinks)");
  log("  [ ] @media-studio/sdk installé ; MediaStudioProvider monté à la racine");
  log("  [ ] Pour l'export natif : module media-studio-export + dev build (run:ios/android)");
}

function main(argv: readonly string[]): void {
  const [command, ...rest] = argv;
  switch (command) {
    case "info":
      return info();
    case "init":
      return init(rest[0]);
    case "new-project":
      return newProject(rest[0]);
    case "create-plugin":
      return createPlugin(rest[0], rest[1]);
    case "doctor":
      return doctor();
    default:
      log(
        "Commandes : info | init [fichier] | new-project [fichier] | create-plugin <id> [fichier] | doctor",
      );
      if (command && command !== "help" && command !== "--help") process.exitCode = 1;
  }
}

main(process.argv.slice(2));
