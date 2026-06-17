# 09 — Export Engine

> **Statut : 🟡 planifié — Passe 3.** Périmètre figé ci-dessous.

## Purpose

Pipeline de rendu offline qualité maximale, distinct de la preview
([ADR-0010](./ADR/0010-preview-export-pipeline-split.md)). Moteur principal FFmpeg
(fork) + fallback natif par plateforme ([ADR-0002](./ADR/0002-export-ffmpeg-fork-native-fallback.md)).

## Périmètre (à détailler)

- Formats : MP4 (H.264 + AAC), MOV (iOS), JPEG, PNG.
- Résolutions : 720p, 1080p, 1440p, 4K (**4K = plan Pro**).
- `ExportConfig` : `format, resolution, fps (24|30|60), videoBitrate, audioBitrate,
  codec (h264|h265), quality`.
- **Pipeline** : composition des tracks → filtres GPU frame-by-frame → mixage audio →
  encodage final → écriture FileSystem → événement `export:completed(uri)`.
- Événements : `export:started / progress(pct) / completed(uri) / failed(err)`.

## Limites V1

- **H.264 uniquement** (H.265 = Pro) ; **4K = Pro** ; pas de multi-pass GPU.

## Cross-refs

- [04-RENDERER](./04-RENDERER.md) — l'Export Renderer.
- [07-LICENSE-SYSTEM](./07-LICENSE-SYSTEM.md) — gating 4K / H.265.
