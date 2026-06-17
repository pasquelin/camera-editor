/**
 * Dégradation gracieuse de la config d'export selon la licence : 4K et H.265 sont
 * des tiers Pro ; sans droit on retombe en 1080p / H.264 + warning, jamais en crash.
 * Voir docs/09-EXPORT-ENGINE.md, docs/07-LICENSE-SYSTEM.md.
 */
import type { LicenseValidator } from "@media-studio/core";
import type { ExportConfig } from "@media-studio/background-jobs";

export interface ResolvedExportConfig {
  config: ExportConfig;
  warnings: string[];
}

/** Applique les contraintes de licence à une config d'export demandée. */
export function resolveExportConfig(
  requested: ExportConfig,
  license: LicenseValidator,
): ResolvedExportConfig {
  const warnings: string[] = [];
  let { resolution, codec } = requested;

  if (resolution === "4k" && !license.has("export.4k")) {
    resolution = "1080p";
    warnings.push("Export 4K nécessite un plan Pro — export en 1080p.");
  }
  if (codec === "h265" && !license.has("export.h265")) {
    codec = "h264";
    warnings.push("Le codec H.265 nécessite un plan Pro — encodage en H.264.");
  }

  return { config: { ...requested, resolution, codec }, warnings };
}
