/**
 * Machine de transport de lecture (headless). Le Runtime est l'unique autorité sur
 * l'état de lecture (playing/paused/ended), le loop et le playbackRate. La clock
 * réelle est une SharedValue Reanimated (UI thread) ; ici elle est abstraite par le
 * port `Clock`, et l'avancement est piloté par `tick(deltaMs)` (appelé par la
 * frame-loop native en production). Voir docs/03-RUNTIME.md.
 */

export type RuntimeState = "playing" | "paused" | "ended";

export type RuntimeEvent = "runtime:play" | "runtime:pause" | "runtime:ended" | "timeline:seeked";

/** Adaptateur sur la clock (SharedValue en production, en mémoire en test). */
export interface Clock {
  get(): number;
  set(value: number): void;
}

export interface Runtime {
  play(): void;
  pause(): void;
  seek(timeMs: number): void; // clampé à [0, duration]
  tick(deltaMs: number): void; // avancement réel (frame-loop / tests)
  getCurrentTime(): number;
  getDuration(): number;
  setDuration(durationMs: number): void;
  isPlaying(): boolean;
  getState(): RuntimeState;
  setLoop(enabled: boolean): void;
  isLooping(): boolean;
  setPlaybackRate(rate: number): void; // borné à rateRange
  getPlaybackRate(): number;
  on(event: RuntimeEvent, cb: () => void): () => void; // retourne unsubscribe
}

export interface RuntimeDeps {
  clock?: Clock;
  duration?: number; // ms, défaut 0
  playbackRate?: number; // défaut 1
  loop?: boolean; // défaut false
  rateRange?: readonly [number, number]; // défaut [0.25, 4]
}

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

/** Clock en mémoire (défaut hors RN). */
function memoryClock(): Clock {
  let value = 0;
  return { get: () => value, set: (v) => (value = v) };
}

export function createRuntime(deps: RuntimeDeps = {}): Runtime {
  const clock = deps.clock ?? memoryClock();
  const [rateMin, rateMax] = deps.rateRange ?? [0.25, 4];
  let duration = Math.max(0, deps.duration ?? 0);
  let rate = clamp(deps.playbackRate ?? 1, rateMin, rateMax);
  let loop = deps.loop ?? false;
  let playing = false;
  let ended = false;

  const listeners: Record<RuntimeEvent, Set<() => void>> = {
    "runtime:play": new Set(),
    "runtime:pause": new Set(),
    "runtime:ended": new Set(),
    "timeline:seeked": new Set(),
  };
  const emit = (event: RuntimeEvent): void => {
    for (const cb of listeners[event]) cb();
  };

  const atEnd = (): boolean => duration > 0 && clock.get() >= duration;

  return {
    play: () => {
      if (playing) return;
      if (ended || atEnd()) {
        clock.set(0); // relance depuis le début
        ended = false;
      }
      playing = true;
      emit("runtime:play");
    },

    pause: () => {
      if (!playing) return;
      playing = false;
      emit("runtime:pause");
    },

    seek: (timeMs) => {
      const t = clamp(timeMs, 0, duration);
      clock.set(t);
      if (t < duration) ended = false;
      emit("timeline:seeked");
    },

    tick: (deltaMs) => {
      if (!playing || deltaMs <= 0) return;
      const next = clock.get() + deltaMs * rate;
      if (duration > 0 && next >= duration) {
        if (loop) {
          clock.set(next % duration);
        } else {
          clock.set(duration);
          playing = false;
          ended = true;
          emit("runtime:ended");
        }
      } else {
        clock.set(next);
      }
    },

    getCurrentTime: () => clock.get(),
    getDuration: () => duration,
    setDuration: (durationMs) => {
      duration = Math.max(0, durationMs);
      if (clock.get() > duration) clock.set(duration);
    },
    isPlaying: () => playing,
    getState: () => (playing ? "playing" : ended ? "ended" : "paused"),
    setLoop: (enabled) => {
      loop = enabled;
    },
    isLooping: () => loop,
    setPlaybackRate: (value) => {
      rate = clamp(value, rateMin, rateMax);
    },
    getPlaybackRate: () => rate,
    on: (event, cb) => {
      listeners[event].add(cb);
      return () => listeners[event].delete(cb);
    },
  };
}
