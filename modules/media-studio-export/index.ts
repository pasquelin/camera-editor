/**
 * Module natif d'export (Expo Modules API) implémentant le port `NativeEncoder` du
 * SDK. Backend : FFmpeg fork (principal) + fallback natif AVFoundation/MediaCodec.
 *
 * Usage :
 *   import { nativeEncoder } from "media-studio-export";
 *   import { createExportRenderer } from "@media-studio/sdk";
 *   const exportRenderer = createExportRenderer({ primary: nativeEncoder, license });
 *
 * Nécessite un dev build (npx expo run:ios|android) — indisponible en Expo Go.
 * Voir docs/09-EXPORT-ENGINE.md, docs/15-NATIVE-CONFIG-PLUGINS.md, ADR-0002.
 */
import { requireNativeModule } from "expo-modules-core";
import type { NativeEncoder } from "@media-studio/sdk";

interface MediaStudioExportNative {
  /** Lance un encodage ; émet "onProgress" (0–1) et résout l'URI. */
  encode(projectJson: string, configJson: string): Promise<string>;
  cancel(): void;
  addListener(event: "onProgress", cb: (e: { progress: number }) => void): { remove(): void };
}

const native = requireNativeModule<MediaStudioExportNative>("MediaStudioExportModule");

/** Adaptateur du module natif vers le port `NativeEncoder` (snapshot + signal). */
export const nativeEncoder: NativeEncoder = {
  async encode({ project, config, onProgress, signal }) {
    const sub = native.addListener("onProgress", (e) => onProgress(e.progress));
    const onAbort = (): void => native.cancel();
    signal.addEventListener("abort", onAbort);
    try {
      return await native.encode(JSON.stringify(project), JSON.stringify(config));
    } finally {
      sub.remove();
      signal.removeEventListener("abort", onAbort);
    }
  },
};
