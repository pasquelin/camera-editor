/**
 * @media-studio/export-engine — pipeline d'export offline (headless). Dégradation
 * de config selon licence et sélection moteur principal/fallback. Le backend natif
 * (FFmpeg / AVFoundation / MediaCodec) est injecté via le port `NativeEncoder`.
 * Voir docs/09-EXPORT-ENGINE.md.
 */
export { resolveExportConfig, type ResolvedExportConfig } from "./config";
export {
  createExportRenderer,
  type NativeEncoder,
  type ExportRendererDeps,
} from "./export-renderer";
export type {
  ExportConfig,
  ExportRenderer,
  ExportRenderInput,
} from "@media-studio/background-jobs";
