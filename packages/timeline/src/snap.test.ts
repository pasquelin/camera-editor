import { describe, expect, it } from "vitest";
import {
  createEmptyProject,
  videoObjectDefinition,
  audioObjectDefinition,
} from "@media-studio/core";
import type { AudioObject, Project, VideoObject } from "@media-studio/core";
import { collectSnapPoints, createSnapEngine, snapToPoints } from "./snap";

function vclip(start: number, end: number): VideoObject {
  return {
    ...videoObjectDefinition.defaultValues(),
    id: `v${start}`,
    startTime: start,
    endTime: end,
  };
}
function aclip(start: number, end: number): AudioObject {
  return {
    ...audioObjectDefinition.defaultValues(),
    id: `a${start}`,
    startTime: start,
    endTime: end,
  };
}

function makeProject(): Project {
  const project = createEmptyProject();
  project.duration = 5000;
  project.tracks.video.push(vclip(1000, 2000), vclip(3000, 4000));
  project.tracks.audio.push(aclip(500, 1500));
  return project;
}

describe("collectSnapPoints", () => {
  it("rassemble bords de clips + 0 + durée, triés et dédupliqués", () => {
    expect(collectSnapPoints(makeProject())).toEqual([0, 500, 1000, 1500, 2000, 3000, 4000, 5000]);
  });

  it("projet vide → [0, duration]", () => {
    const p = createEmptyProject();
    p.duration = 8000;
    expect(collectSnapPoints(p)).toEqual([0, 8000]);
  });
});

describe("snapToPoints", () => {
  const points = [0, 1000, 2000, 5000];

  it("accroche au point le plus proche dans le seuil", () => {
    expect(snapToPoints(1040, points, 100)).toBe(1000);
    expect(snapToPoints(1960, points, 100)).toBe(2000);
  });

  it("hors seuil : renvoie le candidat inchangé", () => {
    expect(snapToPoints(1500, points, 100)).toBe(1500);
  });

  it("choisit le plus proche en cas de candidats multiples", () => {
    expect(snapToPoints(1100, [1000, 1150], 200)).toBe(1150);
  });
});

describe("createSnapEngine", () => {
  it("activé : accroche selon les points du projet", () => {
    const engine = createSnapEngine({ thresholdMs: 80 });
    expect(engine.apply(1030, makeProject())).toBe(1000);
  });

  it("désactivé : renvoie le candidat inchangé", () => {
    const engine = createSnapEngine({ enabled: false });
    expect(engine.apply(1030, makeProject())).toBe(1030);
  });
});
