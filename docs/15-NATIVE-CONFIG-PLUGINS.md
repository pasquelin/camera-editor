# 15 — Native & Config Plugins

> **Statut : 🟡 planifié — Passe 3.** Périmètre figé ci-dessous.

## Purpose

Décrire la couche native du SDK (Expo Modules API, New Architecture), les **config
plugins** qui automatisent le setup natif sans `eject`, les fallbacks d'export par
plateforme, et le **Security Layer** (signatures, tamper detection).
→ [ADR-0006](./ADR/0006-native-expo-modules-new-arch.md).

## Périmètre (à détailler)

### Modules natifs (Expo Modules API)
- iOS (Swift) : AVFoundation (capture, lecture, export), Metal (effets GPU).
- Android (Kotlin) : Camera2, MediaCodec (encode/decode), OpenGL ES (effets GPU).
- Stack JS : Skia (2D), Reanimated (clock/gestes), `react-native-vision-camera`.
- Cible **New Architecture** (Fabric + TurboModules + JSI).

### Config plugins
- Un config plugin par module natif : permissions (caméra, micro, photothèque),
  capabilities iOS, dépendances Gradle/Pods, réglages New Arch.
- Objectif : `expo prebuild` génère tout ; **aucun `eject` manuel**.

### Security Layer (package `security`, injecté)
- License Validation (JWT, signature, expiration) ·
  Plugin Signature & Verification (avant `onRegister`) ·
  Tamper Detection (bundle) · ResourcePack Signature (avant install).

## Cross-refs

- [11-MONOREPO](./11-MONOREPO.md) — build des packages natifs (expo-module).
- [06-PLUGIN-API](./06-PLUGIN-API.md) · [08-ASSET-MANAGER](./08-ASSET-MANAGER.md) — vérifications de signature.
- [09-EXPORT-ENGINE](./09-EXPORT-ENGINE.md) — fallbacks natifs d'export.
