/**
 * Démo headless du SDK Media Studio — exécutable sans device ni UI.
 * Montre : projet + commandes built-in (undo/redo), licence et gating,
 * catalogue de filtres, transport runtime, et export en arrière-plan (JobQueue +
 * ExportRenderer avec encodeur natif simulé).
 *
 * Lancer : `pnpm -F @media-studio/example-headless start`
 */
import {
  createMediaStudio,
  createLicense,
  createFilterCatalog,
  createRuntime,
  createExportRenderer,
  createVideoEditor,
  createTransitionCatalog,
  buildAudioMixPlan,
  gainAt,
  DEFAULT_EXPORT_CONFIG,
  type NativeEncoder,
} from "@media-studio/sdk";

const delay = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));
const log = (label: string, value: unknown): void => console.log(`• ${label}:`, value);

/** Encodeur natif simulé (en prod : FFmpeg fork / AVFoundation / MediaCodec). */
const fakeEncoder: NativeEncoder = {
  async encode({ config, onProgress, signal }) {
    for (const p of [0.25, 0.5, 0.75, 1]) {
      if (signal.aborted) throw new Error("export annulé");
      onProgress(p);
      await delay(5);
    }
    return `file://exports/output.${config.format}`;
  },
};

async function main(): Promise<void> {
  console.log("\n=== Media Studio SDK — démo headless ===\n");

  // 1) Façade : Core + licence Pro + file d'export branchée sur l'encodeur simulé
  const license = createLicense("pro");
  const studio = createMediaStudio({
    license,
    exportRenderer: createExportRenderer({
      primary: fakeEncoder,
      license,
      onWarning: (w) => console.warn("  ⚠", w),
    }),
  });
  const { core } = studio;

  // 2) Commandes built-in (toutes via CommandBus → undo/redo)
  core.execute("video.create", {
    id: "v1",
    object: { source: "clip.mp4", startTime: 0, endTime: 5000, trim: { start: 0, end: 5000 } },
  });
  core.execute("text.create", { id: "t1", object: { content: "Bonjour 👋" } });
  core.execute("filter.create", { id: "f1", object: { filterId: "cinema-drama", intensity: 0.7 } });
  log(
    "objets piste vidéo",
    core.project.get().tracks.video.map((o) => o.id),
  );
  log(
    "objets piste texte",
    core.project.get().tracks.text.map((o) => o.id),
  );

  core.execute("video.split", { objectId: "v1", atTimeMs: 2000, newId: "v2" });
  log(
    "après split (clips vidéo)",
    core.project.get().tracks.video.map((o) => `${o.id}[${o.startTime}-${o.endTime}]`),
  );
  core.undo();
  log(
    "après undo (clips vidéo)",
    core.project.get().tracks.video.map((o) => o.id),
  );
  core.redo();
  log(
    "après redo (clips vidéo)",
    core.project.get().tracks.video.map((o) => o.id),
  );

  // 3) Licence & gating
  log("plan", core.license.plan);
  log("has(export.4k)", core.license.has("export.4k"));
  log("has(whitelabel)", core.license.has("whitelabel"));

  // 4) Catalogue de filtres
  const filters = createFilterCatalog();
  log("filtres au catalogue", filters.list().length);
  log(
    "filtres Cinema",
    filters.byCategory("Cinema").map((f) => f.name),
  );

  // 5) Runtime (transport)
  const rt = createRuntime({ duration: 5000 });
  rt.play();
  rt.tick(1500);
  log("runtime currentTime après tick 1500ms", rt.getCurrentTime());
  log("runtime state", rt.getState());

  // 5b) Contrôleur vidéo headless (ergonomie sur les commandes video.*)
  const video = createVideoEditor(core);
  video.setSpeed("v1", 2);
  video.mute("v1", true);
  log("via contrôleur — v1 speed/muted", {
    speed: (core.project.get().tracks.video[0] as { speed: number }).speed,
    muted: (core.project.get().tracks.video[0] as { muted: boolean }).muted,
  });

  // 5c) Transition entre deux clips
  core.execute("video.create", {
    id: "vb",
    object: { source: "b.mp4", startTime: 5000, endTime: 8000 },
  });
  core.execute("transition.set", {
    trackId: "track-1",
    clipAId: "v1",
    clipBId: "vb",
    transition: { type: "fade", durationMs: 500, easing: "easeInOut" },
  });
  log(
    "transitions",
    core.project
      .get()
      .tracks.transitions.map((t) => `${t.clipAId}→${t.clipBId}:${t.transition.type}`),
  );
  log("catalogue transitions", createTransitionCatalog().list().length);

  // 5d) Audio + plan de mixage headless
  core.execute("audio.create", {
    id: "bg",
    object: {
      source: "music.mp3",
      role: "background",
      startTime: 0,
      endTime: 8000,
      volume: 1,
      fadeIn: 1000,
      fadeOut: 1000,
    },
  });
  const mix = buildAudioMixPlan(core.project.get());
  log("plan de mix (pistes)", mix.length);
  log("gain @500ms (fade-in)", Number(gainAt(mix[0]!, 500).toFixed(2)));
  log("gain @4000ms (plein)", gainAt(mix[0]!, 4000));

  // 6) Export en arrière-plan (non-bloquant)
  const config = DEFAULT_EXPORT_CONFIG;
  const done = new Promise<string>((resolve) => {
    studio.jobs?.on("job:progress", (j) =>
      console.log(`  … export ${Math.round(j.progress * 100)}%`),
    );
    studio.jobs?.on("job:completed", (j) => resolve(j.outputUri ?? ""));
  });
  const job = studio.exportProject(config);
  log("job lancé", `${job.id} (${job.status})`);
  const uri = await done;
  log("export terminé", uri);

  console.log("\n✅ Démo headless OK — toute la chaîne fonctionne sans device.\n");
}

main().catch((err) => {
  console.error("❌ démo échouée:", err);
  process.exitCode = 1;
});
