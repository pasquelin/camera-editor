# 04 — Renderer

> **Statut : 🟡 planifié — Passe 2.** Périmètre figé ci-dessous.

## Purpose

Deux sous-modules **indépendants et sans code partagé** : Preview (temps réel) et
Export (offline qualité max). → [ADR-0010](./ADR/0010-preview-export-pipeline-split.md).

## Périmètre (à détailler)

### Preview Renderer
- Interface `PreviewRenderer` : `attach(clock) / detach / setProject / invalidate`.
- Skia Canvas pour calques statiques (image, texte, stickers, filtres).
- Composant vidéo natif (AVPlayer / ExoPlayer) pour les clips.
- Composition par z-index, cible **30 fps**, textures compressées, effets simplifiés.

### Export Renderer
- Interface `ExportRenderer` : `render(project, config) / cancel / onProgress`.
- Pipeline FFmpeg / AVFoundation / MediaCodec, frame-by-frame, qualité max.
- Filtres GPU (Metal / OpenGL ES), mixage audio complet.
- → détail du pipeline dans [09-EXPORT-ENGINE](./09-EXPORT-ENGINE.md).

## Cross-refs

- [03-RUNTIME](./03-RUNTIME.md) — clock consommée par la preview.
- [09-EXPORT-ENGINE](./09-EXPORT-ENGINE.md) · [ADR-0002](./ADR/0002-export-ffmpeg-fork-native-fallback.md).
