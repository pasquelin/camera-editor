/**
 * Encodeur de démo compatible Expo Go (aucun module natif). Simule la progression
 * d'un export et résout un URI factice. En production, remplacer par le module natif
 * `NativeEncoder` (FFmpeg fork / AVFoundation / MediaCodec) — voir docs/09 et le
 * scaffold `modules/media-studio-export`.
 */
import type { NativeEncoder } from "@media-studio/sdk";

const delay = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

export const demoEncoder: NativeEncoder = {
  async encode({ config, onProgress, signal }) {
    for (let p = 0.1; p <= 1; p += 0.1) {
      if (signal.aborted) throw new Error("export annulé");
      onProgress(Math.min(1, p));
      await delay(150);
    }
    return `file://demo-exports/output-${Date.now()}.${config.format}`;
  },
};
