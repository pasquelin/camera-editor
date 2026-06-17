/**
 * CLI `media-studio` — scaffolding et diagnostics. Sans dépendance externe (parsing
 * d'arguments manuel). Voir docs/25-DEVELOPER-DOCS.md.
 *
 *   media-studio info
 *   media-studio new-project [fichier.json]
 *   media-studio create-plugin <id> [fichier.ts]
 *   media-studio doctor
 */
import { writeFileSync } from "node:fs";
import { createEmptyProject } from "@media-studio/core";

const log = (...args: unknown[]): void => console.log(...args);

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
  const json = JSON.stringify(createEmptyProject(), null, 2);
  if (out) {
    writeFileSync(out, json + "\n");
    log(`Projet vide écrit dans ${out}`);
  } else {
    log(json);
  }
}

function createPlugin(id: string | undefined, out?: string): void {
  if (!id) {
    console.error("Usage : media-studio create-plugin <id> [fichier.ts]");
    process.exitCode = 1;
    return;
  }
  const className = id
    .replace(/[^a-zA-Z0-9]+(.)?/g, (_m, c: string) => (c ? c.toUpperCase() : ""))
    .replace(/^./, (c) => c.toUpperCase());
  const template = `import type { MediaStudioPlugin, Core } from "@media-studio/core";

export class ${className}Plugin implements MediaStudioPlugin {
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
  if (out) {
    writeFileSync(out, template);
    log(`Plugin "${id}" généré dans ${out}`);
  } else {
    log(template);
  }
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
    case "new-project":
      return newProject(rest[0]);
    case "create-plugin":
      return createPlugin(rest[0], rest[1]);
    case "doctor":
      return doctor();
    default:
      log("Commandes : info | new-project [fichier] | create-plugin <id> [fichier] | doctor");
      if (command && command !== "help" && command !== "--help") process.exitCode = 1;
  }
}

main(process.argv.slice(2));
