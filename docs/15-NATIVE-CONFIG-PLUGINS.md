# 15 — Native & Config Plugins

> **Statut : ✅ stable.**

## Purpose

Décrire la **couche native** du SDK (Expo Modules API, New Architecture), les **config
plugins** qui automatisent le setup natif sans `eject`, les **fallbacks d'export** par
plateforme, et le **Security Layer** (signatures, tamper detection).
→ [ADR-0006](./ADR/0006-native-expo-modules-new-arch.md).

## Concepts

### Modules natifs (Expo Modules API)

| Plateforme | Langage | APIs natives |
|-----------|---------|--------------|
| **iOS** | Swift | AVFoundation (capture, lecture, export), Metal (effets GPU) |
| **Android** | Kotlin | Camera2, MediaCodec (encode/decode), OpenGL ES (effets GPU) |

Stack JS associée : **Skia** (2D), **Reanimated** (clock/gestes),
`react-native-vision-camera` ([ADR-0012](./ADR/0012-camera-vision-camera.md)). Tous les
modules ciblent la **New Architecture** (Fabric + TurboModules + JSI), sans pont JSON
par frame.

### Config plugins

Un **config plugin** Expo par module natif applique automatiquement le setup au
`prebuild` : permissions (caméra, micro, photothèque), capabilities iOS, dépendances
Gradle/Pods, réglages New Arch. Objectif : **aucun `eject` manuel** — le SDK reste
*managed-compatible* tout en fonctionnant en bare workflow.

```js
// app.config.js (intégrateur)
export default {
  plugins: [
    ["@media-studio/camera", { microphonePermission: "Pour enregistrer l'audio." }],
    "@media-studio/renderer-export",
  ],
};
```

### Security Layer (package `security`, injecté)

Indépendant du Core, injecté par interface ([ADR-0013](./ADR/0013-security-layer-package.md)) :

| Fonction | Rôle |
|----------|------|
| **License Validation** | Vérification JWT, signature, expiration. → [07-LICENSE-SYSTEM](./07-LICENSE-SYSTEM.md). |
| **Plugin Signature** | Chaque plugin premium est signé avec une clé privée. |
| **Plugin Verification** | Vérifie la signature **avant** `onRegister`. → [06-PLUGIN-API](./06-PLUGIN-API.md). |
| **Tamper Detection** | Détecte une modification du bundle SDK. |
| **ResourcePack Signature** | Vérifie les packs marketplace avant installation. → [08-ASSET-MANAGER](./08-ASSET-MANAGER.md). |

## Interfaces (TS)

```ts
// Injecté dans le Core — jamais importé par lui.
interface SecurityLayer {
  verifyPlugin(plugin: MediaStudioPlugin): Promise<boolean>;
  verifyPack(pack: ResourcePack): Promise<boolean>;
  verifyLicense(jwt: string): Promise<boolean>;
  checkIntegrity(): Promise<boolean>;          // tamper detection
}

// Vérifications automatiques internes :
editor.registerPlugin(plugin);          // → SecurityLayer.verifyPlugin(plugin)
await resourcePackManager.install(pack); // → SecurityLayer.verifyPack(pack)
```

### Fallbacks d'export natifs

Quand FFmpeg n'est pas le backend retenu, l'export bascule sur le natif
([ADR-0002](./ADR/0002-export-ffmpeg-fork-native-fallback.md)) :

| Plateforme | Backend natif |
|-----------|---------------|
| iOS | AVFoundation (AVAssetExportSession / AVAssetWriter) |
| Android | MediaCodec + MediaMuxer |

## Configuration

- Chaque module natif expose ses options via son **config plugin** (permissions,
  textes de consentement, réglages de build).
- Le **Security Layer** est optionnel et injecté : un déploiement open-source sans
  plugins premium peut s'en passer ; il s'active dès qu'une licence ou un plugin signé
  est présent.
- New Architecture activable/désactivable au niveau app (le SDK la cible par défaut).

## Décisions liées

- [ADR-0006](./ADR/0006-native-expo-modules-new-arch.md) — Expo Modules API + New Arch.
- [ADR-0012](./ADR/0012-camera-vision-camera.md) — react-native-vision-camera.
- [ADR-0013](./ADR/0013-security-layer-package.md) — Security Layer en package séparé.
- [ADR-0002](./ADR/0002-export-ffmpeg-fork-native-fallback.md) — fallbacks d'export natifs.

## Cross-refs

- [11-MONOREPO](./11-MONOREPO.md) — build des packages natifs (expo-module).
- [06-PLUGIN-API](./06-PLUGIN-API.md) · [08-ASSET-MANAGER](./08-ASSET-MANAGER.md) — vérifications de signature.
- [16-CAMERA](./16-CAMERA.md) — module caméra natif.
- [09-EXPORT-ENGINE](./09-EXPORT-ENGINE.md) — fallbacks natifs d'export.
