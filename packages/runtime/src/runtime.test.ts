import { describe, expect, it } from "vitest";
import { createRuntime } from "./runtime";

describe("Runtime — état initial", () => {
  it("paused à 0, durée fournie, pas en lecture", () => {
    const rt = createRuntime({ duration: 10_000 });
    expect(rt.getState()).toBe("paused");
    expect(rt.getCurrentTime()).toBe(0);
    expect(rt.getDuration()).toBe(10_000);
    expect(rt.isPlaying()).toBe(false);
  });
});

describe("Runtime — play / pause", () => {
  it("play passe en lecture et émet runtime:play", () => {
    const rt = createRuntime({ duration: 10_000 });
    let played = 0;
    rt.on("runtime:play", () => (played += 1));
    rt.play();
    expect(rt.isPlaying()).toBe(true);
    expect(rt.getState()).toBe("playing");
    expect(played).toBe(1);
    rt.play(); // idempotent
    expect(played).toBe(1);
  });

  it("pause fige la lecture et émet runtime:pause", () => {
    const rt = createRuntime({ duration: 10_000 });
    let paused = 0;
    rt.on("runtime:pause", () => (paused += 1));
    rt.play();
    rt.pause();
    expect(rt.isPlaying()).toBe(false);
    expect(rt.getState()).toBe("paused");
    expect(paused).toBe(1);
  });
});

describe("Runtime — tick (avancement)", () => {
  it("avance la clock de deltaMs * rate quand en lecture", () => {
    const rt = createRuntime({ duration: 10_000 });
    rt.play();
    rt.tick(1000);
    expect(rt.getCurrentTime()).toBe(1000);
    rt.setPlaybackRate(2);
    rt.tick(1000);
    expect(rt.getCurrentTime()).toBe(3000); // 1000 + 1000*2
  });

  it("n'avance pas en pause", () => {
    const rt = createRuntime({ duration: 10_000 });
    rt.tick(1000);
    expect(rt.getCurrentTime()).toBe(0);
  });
});

describe("Runtime — fin de lecture & loop", () => {
  it("sans loop : atteint duration, passe en ended, émet runtime:ended", () => {
    const rt = createRuntime({ duration: 1000 });
    let ended = 0;
    rt.on("runtime:ended", () => (ended += 1));
    rt.play();
    rt.tick(1500); // dépasse la durée
    expect(rt.getCurrentTime()).toBe(1000);
    expect(rt.getState()).toBe("ended");
    expect(rt.isPlaying()).toBe(false);
    expect(ended).toBe(1);
  });

  it("avec loop : reboucle sans s'arrêter", () => {
    const rt = createRuntime({ duration: 1000, loop: true });
    rt.play();
    rt.tick(1200);
    expect(rt.getCurrentTime()).toBe(200); // 1200 % 1000
    expect(rt.isPlaying()).toBe(true);
  });

  it("play depuis ended relance au début", () => {
    const rt = createRuntime({ duration: 1000 });
    rt.play();
    rt.tick(1000);
    expect(rt.getState()).toBe("ended");
    rt.play();
    expect(rt.getCurrentTime()).toBe(0);
    expect(rt.getState()).toBe("playing");
  });
});

describe("Runtime — seek", () => {
  it("clampe à [0, duration] et émet timeline:seeked sans changer playing", () => {
    const rt = createRuntime({ duration: 5000 });
    let seeked = 0;
    rt.on("timeline:seeked", () => (seeked += 1));
    rt.play();
    rt.seek(8000);
    expect(rt.getCurrentTime()).toBe(5000);
    rt.seek(-100);
    expect(rt.getCurrentTime()).toBe(0);
    expect(rt.isPlaying()).toBe(true); // seek ne change pas l'état
    expect(seeked).toBe(2);
  });

  it("seek depuis ended vers t<duration sort de l'état ended", () => {
    const rt = createRuntime({ duration: 1000 });
    rt.play();
    rt.tick(1000);
    expect(rt.getState()).toBe("ended");
    rt.seek(200);
    expect(rt.getState()).toBe("paused");
  });
});

describe("Runtime — playbackRate borné", () => {
  it("clampe le rate à [0.25, 4] par défaut", () => {
    const rt = createRuntime({ duration: 1000 });
    rt.setPlaybackRate(99);
    expect(rt.getPlaybackRate()).toBe(4);
    rt.setPlaybackRate(0.01);
    expect(rt.getPlaybackRate()).toBe(0.25);
  });
});
