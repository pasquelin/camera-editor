import type { Project } from "../types/project";

export type MigrateFunction = (project: Project) => Project;

interface Migration {
  from: string;
  to: string;
  migrate: MigrateFunction;
}

/**
 * Migrations de schéma entre versions de projet. Voir docs/02-PROJECT-SCHEMA.md.
 */
export class SchemaRegistry {
  private readonly migrations: Migration[] = [];

  registerMigration(from: string, to: string, migrate: MigrateFunction): void {
    this.migrations.push({ from, to, migrate });
  }

  /** Applique en chaîne les migrations jusqu'à `targetVersion`. */
  migrate(project: Project, targetVersion: string): Project {
    let current = project;
    const visited = new Set<string>();
    while (current.version !== targetVersion) {
      if (visited.has(current.version)) {
        throw new Error(`SchemaRegistry: boucle de migration à la version "${current.version}"`);
      }
      visited.add(current.version);
      const next = this.migrations.find((m) => m.from === current.version);
      if (!next) {
        throw new Error(
          `SchemaRegistry: aucune migration depuis "${current.version}" vers "${targetVersion}"`,
        );
      }
      // La migration produit le contenu cible ; le registre fait foi pour la version.
      current = { ...next.migrate(current), version: next.to };
    }
    return current;
  }
}
