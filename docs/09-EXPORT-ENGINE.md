# 09 — Export Engine

> **Statut : ✅ stable.**

## Purpose

Pipeline de rendu **offline qualité maximale**, distinct de la preview
([ADR-0010](./ADR/0010-preview-export-pipeline-split.md)). Moteur principal **FFmpeg**
(fork communautaire) avec **fallback natif** par plateforme (AVFoundation / MediaCodec)
([ADR-0002](./ADR/0002-export-ffmpeg-fork-native-fallback.md)). Produit l'asset final
et émet sa progression.

## Concepts

### Sélection du moteur

```
ExportRenderer.render(project, config)
        │
        ├─ moteur principal : FFmpeg (fork) ── composition, filtres, mux
        │
        └─ fallback natif :  AVFoundation (iOS) / MediaCodec (Android)
                             (codec matériel, binaire léger)
```

Le choix est **encapsulé** derrière l'interface `ExportRenderer` : l'appelant ne sait
pas quel backend produit le fichier.

### Pipeline d'export

1. **Composition des tracks** (FFmpeg ou natif).
2. **Filtres GPU frame-by-frame** (Metal / OpenGL ES), sans contrainte temps réel ;
   **multi-pass** supporté pour les effets combinés.
3. **Mixage audio** complet (toutes pistes, fades, volumes). → [22-AUDIO-ENGINE](./22-AUDIO-ENGINE.md).
4. **Encodage final** selon `ExportConfig`.
5. **Écriture FileSystem** → URI.
6. Émission `export:completed(uri)` (ou `export:failed(err)`).

## Interfaces (TS)

```ts
interface ExportRenderer {
  render(project: Project, config: ExportConfig): Promise<string>; // → URI
  cancel(): void;
  onProgress(cb: (pct: number) => void): void;
}

interface ExportConfig {
  format: "mp4" | "mov" | "jpeg" | "png";
  resolution: "720p" | "1080p" | "1440p" | "4k";
  fps: 24 | 30 | 60;
  videoBitrate: number;       // kbps
  audioBitrate: number;       // kbps
  codec: "h264" | "h265";
  quality: number;            // 0–1 (JPEG uniquement)
}
```

### Événements

```ts
editor.on("export:started",   () => {});
editor.on("export:progress",  (pct: number) => {});
editor.on("export:completed", (uri: string) => {});
editor.on("export:failed",    (err: Error) => {});
```

## Configuration

- **Formats** : MP4 (H.264/H.265 + AAC), MOV (iOS), JPEG, PNG (photo).
- **Résolutions** : 720p, 1080p, 1440p, 4K.
- **Codecs** : H.264 et H.265.
- **Annulation** : `cancel()` interrompt proprement un rendu en cours.
- **Tiers de licence** : l'export **4K** et le codec **H.265** sont rattachés au plan
  **Pro** ; une demande sans droit retombe en mode dégradé (1080p / H.264 + warning),
  jamais en crash. → [07-LICENSE-SYSTEM](./07-LICENSE-SYSTEM.md), [12-CONFIGURATION](./12-CONFIGURATION.md).
- Le composant `<ExportPanel />` ([24-UI-COMPONENTS](./24-UI-COMPONENTS.md)) pilote la
  config ; le mode headless expose les mêmes contrôles.

## Décisions liées

- [ADR-0010](./ADR/0010-preview-export-pipeline-split.md) — pipeline export distinct de la preview.
- [ADR-0002](./ADR/0002-export-ffmpeg-fork-native-fallback.md) — FFmpeg fork + fallback natif.

## Cross-refs

- [04-RENDERER](./04-RENDERER.md) — l'Export Renderer dans le Renderer.
- [22-AUDIO-ENGINE](./22-AUDIO-ENGINE.md) — mixage audio.
- [07-LICENSE-SYSTEM](./07-LICENSE-SYSTEM.md) — tiers 4K / H.265.
- [15-NATIVE-CONFIG-PLUGINS](./15-NATIVE-CONFIG-PLUGINS.md) — fallbacks natifs.
