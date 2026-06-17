# 04 — Renderer

> **Statut : ✅ stable.**

## Purpose

Produire l'image à partir du `Project`. Le Renderer est divisé en **deux
sous-modules indépendants, sans code de rendu partagé** : **Preview** (temps réel,
fluidité prioritaire) et **Export** (offline, qualité maximale). Ils ne partagent que
le modèle de données. → [ADR-0010](./ADR/0010-preview-export-pipeline-split.md).

## Concepts

### Le modèle de composition par calques

Un `Project` est une pile de calques ordonnés par **z-index** (l'ordre dans les
tracks + l'ordre des tracks). À un instant `t`, un objet est *actif* si
`startTime ≤ t < endTime`. Le rôle du Renderer est de composer, dans l'ordre, tous
les objets actifs à `t`.

```
z ▲   [filter]        ← FilterTrack (au-dessus)
  │   [text] [sticker]← TextTrack / StickerTrack
  │   [video clip]    ← VideoTrack (au-dessous)
  └──────────────────▶ t (clock)
```

### Deux natures de calques

| Nature | Rendu par | Exemples |
|--------|-----------|----------|
| **Statique** (par frame, déterministe) | **Skia Canvas** | image, texte, sticker, filtre, formes |
| **Flux vidéo** (décodé par le système) | **composant vidéo natif** | clips `VideoObject` |

Le hybride Skia + vidéo native est le cœur de la preview. → [ADR-0003](./ADR/0003-rendering-skia-vs-native-video.md).

## Preview Renderer

Rendu temps réel optimisé pour l'UX. Cible **30 fps constant**.

```ts
interface PreviewRenderer {
  attach(clock: SharedValue<number>): void;   // s'abonne à la clock du Runtime
  detach(): void;
  setProject(project: Project): void;          // (re)charge la scène
  invalidate(): void;                          // force un re-render (édition hors lecture)
}
```

### Pipeline preview

1. **`attach(clock)`** — le Renderer lit `clock.value` en worklet (UI thread).
2. **Calques statiques** — dessinés sur un **Skia Canvas** ; recomposés quand la
   clock change *ou* sur `invalidate()` (édition).
3. **Clips vidéo** — rendus par un **composant vidéo natif** (`AVPlayer` iOS /
   `ExoPlayer` Android) positionné dans la composition ; le Renderer **synchronise**
   sa position de lecture sur la clock (seek/play/pause suivent le Runtime).
4. **Composition** — calques empilés par z-index ; le composant vidéo s'insère à son
   z-index parmi les calques Skia.
5. **Filtres** — `ColorFilter` / `ImageFilter` Skia sur les calques statiques ;
   pour la vidéo, les filtres sont appliqués en preview avec rendu haute qualité.

### Caractéristiques

- Textures **compressées** pour la performance temps réel ; **multi-pass GPU supporté**
  pour les effets combinés.
- Rendu **haute qualité** : les filtres et effets sont rendu fidèlement en preview.
- `invalidate()` est appelé à chaque mutation pertinente (via `object:updated`) hors
  lecture ; pendant la lecture, la clock pilote déjà le re-render.
- Aucune écriture fichier : la preview est exclusivement à l'écran.

## Export Renderer

Rendu offline qualité maximale. Ignore la fluidité, vise le résultat final.

```ts
interface ExportRenderer {
  render(project: Project, config: ExportConfig): Promise<string>; // → URI
  cancel(): void;
  onProgress(cb: (pct: number) => void): void;
}
```

### Pipeline export

1. **Composition des tracks** (FFmpeg ou natif AVFoundation/MediaCodec).
2. **Filtres GPU frame-by-frame** (Metal / OpenGL ES), sans contrainte temps réel.
3. **Mixage audio** complet (toutes pistes, fades, volumes).
4. **Encodage final** (codec selon `ExportConfig`).
5. **Écriture FileSystem** → URI.
6. Émission `export:completed(uri)` (ou `export:failed`).

Formats : MP4, MOV, JPEG, PNG. Détail complet du moteur et des configs :
[09-EXPORT-ENGINE](./09-EXPORT-ENGINE.md). Choix moteur :
[ADR-0002](./ADR/0002-export-ffmpeg-fork-native-fallback.md).

## Pourquoi deux pipelines

Le Preview Renderer **priorise la fluidité** (30 fps, textures compressées, multi-pass GPU)
pour une expérience d'édition réactive. L'Export Renderer **ignore la fluidité** et produit
le résultat final à qualité maximale, frame-by-frame. Les deux **ne partagent pas de
code de rendu** : on fait évoluer l'un sans risquer l'autre.

### La parité visuelle

Les deux pipelines partagent une spécification déclarative des filtres et effets.
Une suite de **tests de parité** (preview vs export) garantit la cohérence visuelle
entre les deux rendus sur les filtres et le texte. → [14-TESTING](./14-TESTING.md).
Les catalogues de filtres/textes sont décrits de façon **déclarative** pour que
les deux pipelines partagent la *spécification*, pas l'*implémentation*.

## Configuration

- Le Preview est monté selon le `mode` (`photo` → calques statiques uniquement ;
  `video` → + composant vidéo + clock).
- Le mode **headless** expose la surface de preview comme composant attachable, sans
  l'UI par défaut. → [12-CONFIGURATION](./12-CONFIGURATION.md).
- `ExportConfig` (format, résolution, fps, bitrates, codec, quality) :
  [09-EXPORT-ENGINE](./09-EXPORT-ENGINE.md).
- Preview cible **30 fps** par défaut, configurable via `config.renderer.previewFps`.
- Export **H.264** inclus par défaut ; **H.265** et **4K** disponibles sur le plan Pro.
  → [07-LICENSE-SYSTEM](./07-LICENSE-SYSTEM.md), [12-CONFIGURATION](./12-CONFIGURATION.md).

## Décisions liées

- [ADR-0010](./ADR/0010-preview-export-pipeline-split.md) — séparation Preview/Export.
- [ADR-0003](./ADR/0003-rendering-skia-vs-native-video.md) — Skia + vidéo native (hybride).
- [ADR-0002](./ADR/0002-export-ffmpeg-fork-native-fallback.md) — moteur d'export.

## Cross-refs

- [03-RUNTIME](./03-RUNTIME.md) — clock consommée par la preview.
- [05-TIMELINE](./05-TIMELINE.md) — z-index et tracks.
- [21-FILTER-ENGINE](./21-FILTER-ENGINE.md) — filtres Skia (photo) vs shaders (vidéo).
- [09-EXPORT-ENGINE](./09-EXPORT-ENGINE.md) — pipeline d'export détaillé.
