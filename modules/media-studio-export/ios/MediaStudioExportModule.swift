import ExpoModulesCore

// Module natif d'export (iOS). Backend cible : FFmpeg fork (principal) + fallback
// AVFoundation (AVAssetExportSession). Émet "onProgress" (0–1), résout l'URI.
// Voir docs/09-EXPORT-ENGINE.md, ADR-0002.
public class MediaStudioExportModule: Module {
  public func definition() -> ModuleDefinition {
    Name("MediaStudioExportModule")

    Events("onProgress")

    AsyncFunction("encode") { (projectJson: String, configJson: String, promise: Promise) in
      // TODO(prod): décoder projectJson/configJson, composer les pistes, appliquer
      // filtres/transitions (shaders), mixer l'audio, encoder via FFmpeg (ou
      // AVAssetExportSession en fallback), en émettant self.sendEvent("onProgress",
      // ["progress": p]) puis promise.resolve(outputURI) / promise.reject(...).
      promise.reject("E_NOT_IMPLEMENTED", "Backend d'encodage natif à intégrer (FFmpeg/AVFoundation).")
    }

    Function("cancel") {
      // TODO(prod): annuler proprement l'export en cours.
    }
  }
}
