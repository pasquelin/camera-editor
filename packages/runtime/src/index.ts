/**
 * @media-studio/runtime — machine de transport de lecture (headless).
 * La clock réelle (SharedValue Reanimated) et la frame-loop (useFrameCallback)
 * sont câblées par la couche RN ; ici, logique pure pilotée par `tick()`.
 * Voir docs/03-RUNTIME.md.
 */
export {
  createRuntime,
  type Runtime,
  type RuntimeDeps,
  type RuntimeState,
  type RuntimeEvent,
  type Clock,
} from "./runtime";
