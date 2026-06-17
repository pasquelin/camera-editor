package expo.modules.mediastudioexport

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

// Module natif d'export (Android). Backend cible : FFmpeg fork (principal) +
// fallback MediaCodec/MediaMuxer. Émet "onProgress" (0–1), résout l'URI.
// Voir docs/09-EXPORT-ENGINE.md, ADR-0002.
class MediaStudioExportModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("MediaStudioExportModule")

    Events("onProgress")

    AsyncFunction("encode") { projectJson: String, configJson: String, promise: expo.modules.kotlin.Promise ->
      // TODO(prod): décoder projectJson/configJson, composer/encoder via FFmpeg
      // (ou MediaCodec en fallback), émettre sendEvent("onProgress", mapOf("progress" to p)),
      // puis promise.resolve(outputUri) / promise.reject(...).
      promise.reject("E_NOT_IMPLEMENTED", "Backend d'encodage natif à intégrer (FFmpeg/MediaCodec).", null)
    }

    Function("cancel") {
      // TODO(prod): annuler proprement l'export en cours.
    }
  }
}
