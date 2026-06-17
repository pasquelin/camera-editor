import { describe, expect, it } from "vitest";
import { EventBus } from "../event-bus/EventBus";
import { SchemaRegistry } from "../schema-registry/SchemaRegistry";
import { createEmptyProject, ProjectManager } from "./ProjectManager";

describe("ProjectManager", () => {
  it("crée un projet vide valide", () => {
    const pm = new ProjectManager(new EventBus());
    const project = pm.get();
    expect(project.version).toBe("1.0.0");
    expect(project.tracks.video).toEqual([]);
    expect(project.tracks.transitions).toEqual([]);
  });

  it("export / load roundtrip conserve l'id", () => {
    const pm = new ProjectManager(new EventBus());
    const json = pm.export();
    const pm2 = new ProjectManager(new EventBus());
    const loaded = pm2.load(json);
    expect(loaded.id).toBe(pm.get().id);
  });

  it("snapshot est isolé du projet vivant ; restore revient en arrière", () => {
    const pm = new ProjectManager(new EventBus());
    const snapshot = pm.snapshot();
    pm.mutate((project) => {
      project.duration = 5000;
    });
    expect(pm.get().duration).toBe(5000);
    expect(snapshot.duration).toBe(0);
    pm.restore(snapshot);
    expect(pm.get().duration).toBe(0);
  });

  it("applique les migrations via SchemaRegistry au load", () => {
    const schemas = new SchemaRegistry();
    schemas.registerMigration("0.9.0", "1.0.0", (project) => ({ ...project, duration: 999 }));
    const pm = new ProjectManager(new EventBus(), undefined, schemas);
    const legacy = JSON.stringify({ ...createEmptyProject(), version: "0.9.0", duration: 0 });
    const loaded = pm.load(legacy);
    expect(loaded.version).toBe("1.0.0");
    expect(loaded.duration).toBe(999);
  });
});
