/**
 * Implémentation de l'ExportRenderer (port consommé par la JobQueue). Encapsule le
 * choix du backend : moteur principal (FFmpeg fork) avec fallback natif
 * (AVFoundation / MediaCodec). Applique la dégradation licence avant rendu.
 * Le backend réel est injecté (port `NativeEncoder`). Voir docs/09, docs/27, ADR-0002.
 */
import type { LicenseValidator, Project } from "@media-studio/core";
import type {
  ExportConfig,
  ExportRenderer,
  ExportRenderInput,
} from "@media-studio/background-jobs";
import { resolveExportConfig } from "./config";

/** Backend d'encodage natif (FFmpeg fork ou fallback plateforme). */
export interface NativeEncoder {
  encode(input: {
    project: Project;
    config: ExportConfig;
    onProgress: (progress: number) => void;
    signal: AbortSignal;
  }): Promise<string>; // résout l'URI du fichier produit
}

export interface ExportRendererDeps {
  /** Moteur principal (FFmpeg fork). */
  primary: NativeEncoder;
  /** Fallback natif optionnel (AVFoundation / MediaCodec) si le principal échoue. */
  fallback?: NativeEncoder;
  /** Licence pour la dégradation 4K/H.265 (défaut : open-source). */
  license?: LicenseValidator;
  /** Notifié des dégradations de config (warnings). */
  onWarning?: (message: string) => void;
}

const OPEN_SOURCE: LicenseValidator = { plan: "open-source", has: () => false };

/** Crée un ExportRenderer branchable sur `createJobQueue({ renderer })`. */
export function createExportRenderer(deps: ExportRendererDeps): ExportRenderer {
  const license = deps.license ?? OPEN_SOURCE;

  return {
    render: async (input: ExportRenderInput): Promise<string> => {
      const { config, warnings } = resolveExportConfig(input.config, license);
      for (const w of warnings) deps.onWarning?.(w);

      const encoderInput = {
        project: input.project,
        config,
        onProgress: input.onProgress,
        signal: input.signal,
      };

      try {
        return await deps.primary.encode(encoderInput);
      } catch (err) {
        if (input.signal.aborted || !deps.fallback) throw err;
        return await deps.fallback.encode(encoderInput);
      }
    },
  };
}
