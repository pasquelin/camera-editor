# 17 — Photo Editor

> **Statut : ✅ stable.**

## Purpose

Éditeur d'images basé sur le **PreviewRenderer Skia**. Il offre un ensemble de
transformations géométriques, un mode de dessin libre sur canvas, la composition
d'overlays (texte, stickers, filtres) et l'export vers JPEG ou PNG. Toutes les
mutations passent par le `CommandBus`, garantissant l'undo/redo et la cohérence
du schéma. Le Photo Editor est activable indépendamment du Video Editor ; les
deux peuvent coexister dans une même intégration.

## Concepts

### Canvas Skia comme source de vérité du rendu

Le Photo Editor s'appuie sur le **PreviewRenderer Skia** (même pipeline que pour
les calques statiques vidéo) pour afficher et composer l'image en temps réel.
→ [04-RENDERER](./04-RENDERER.md). Chaque couche (image de base, calques de
dessin, overlays) est un **layer Skia** indépendant, rendu dans l'ordre de pile
(`zIndex`). Cette architecture garantit que la preview est fidèle à l'export
(principe **Preview ≠ Export** géré par le pipeline d'export dédié).

### Transformations géométriques

Les transformations s'appliquent à l'`ImageObject` sous-jacent et sont non
destructives en preview : elles sont encodées comme attributs du schéma et
appliquées lors du rendu ou de l'export.

| Transformation | Description |
|----------------|-------------|
| **Crop** | Sélection libre ou contrainte à un ratio fixe (1:1, 4:3, 16:9, 9:16). Exprimé comme `CropRect { x, y, width, height }` normalisé sur `[0, 1]`. |
| **Rotate** | Rotation par pas de 90° ou libre (valeur en degrés). Appliquée autour du centre du crop. |
| **Flip H / V** | Miroir horizontal ou vertical. Composable avec une rotation. |
| **Resize** | Redimensionnement de la résolution de sortie ; n'affecte pas la preview (uniquement l'export). |

### Dessin libre

Le dessin libre opère sur un **calque raster dédié** (`DrawingLayer`) positionné
au-dessus de l'image de base mais sous les overlays texte/stickers. Chaque coup
de pinceau ou forme est encodé comme une `DrawCommand` dans la liste du
`DrawingLayer` — ce qui rend chaque trait undoable individuellement.

| Outil | Paramètres |
|-------|------------|
| **Pinceau** | `size` (px, 1–200), `color` (hex RGBA), `opacity` ([0, 1]) |
| **Gomme** | `size` (px), `mode: 'erase'` — efface les pixels du `DrawingLayer` |
| **Rectangle** | `strokeWidth`, `color`, `filled: boolean` |
| **Cercle** | `strokeWidth`, `color`, `filled: boolean` |
| **Ligne** | `strokeWidth`, `color`, point de départ / fin |

### Overlays

Les overlays sont des objets de la pile de calques Skia gérés par leurs moteurs
respectifs. Le Photo Editor est l'**orchestrateur** : il ouvre les panneaux
d'édition et dispatche les commandes vers le bon moteur.

| Overlay | Moteur | Ref |
|---------|--------|-----|
| Texte | Text Engine | [19-TEXT-ENGINE](./19-TEXT-ENGINE.md) |
| Stickers (PNG/SVG/GIF/Lottie) | Sticker Engine | [20-STICKER-ENGINE](./20-STICKER-ENGINE.md) |
| Filtres LUT / shaders GPU | Filter Engine | [21-FILTER-ENGINE](./21-FILTER-ENGINE.md) |

### Preview ≠ Export

La preview affiche l'image à la **résolution d'écran** (downsamplee si nécessaire)
pour garantir 60 fps. L'export déclenche un **pipeline offline distinct**
(→ [09-EXPORT-ENGINE](./09-EXPORT-ENGINE.md)) qui rend à la résolution native,
applique crop + transformations, fusionne tous les calques et encode en JPEG ou
PNG. Aucun code de rendu n'est partagé entre les deux pipelines.
→ [ADR-0010](./ADR/0010-preview-export-pipeline-split.md).

### Mode headless

Sans `<PhotoEditor />`, l'hôte compose lui-même l'UI via les hooks :

```ts
const photoEditor = usePhotoEditor(editor);
// Accès aux transformations, dessin, overlays, export
photoEditor.crop({ x: 0, y: 0, width: 0.8, height: 0.8 });
photoEditor.rotate(90);
await photoEditor.export({ format: 'jpeg', quality: 0.9 });
```

## Interfaces (TS)

```ts
// inféré (hors brief) — types de base du Photo Editor

type ImageFormat = 'jpeg' | 'png';
type AspectRatioPreset = '1:1' | '4:3' | '16:9' | '9:16' | 'free';

interface CropRect {
  x: number;      // [0, 1] normalisé
  y: number;      // [0, 1] normalisé
  width: number;  // [0, 1] normalisé
  height: number; // [0, 1] normalisé
}

interface DrawStyle {
  color: string;    // hex RGBA, ex. '#FF0000FF'
  size: number;     // px, [1, 200]
  opacity: number;  // [0, 1]
}

type DrawTool =
  | { type: 'brush'; style: DrawStyle }
  | { type: 'eraser'; size: number }
  | { type: 'rect'; style: DrawStyle; filled: boolean }
  | { type: 'circle'; style: DrawStyle; filled: boolean }
  | { type: 'line'; style: DrawStyle };

interface ExportPhotoOptions {
  format: ImageFormat;
  quality?: number;   // [0, 1], ignoré pour PNG (sans perte)
  width?: number;     // px — résolution de sortie ; défaut = résolution native
  height?: number;    // px
}

// inféré (hors brief) — interface headless principale
interface PhotoEditorController {
  // Transformations
  crop(rect: CropRect, preset?: AspectRatioPreset): void;
  rotate(degrees: number): void;          // multiples de 90° ou libre
  flipHorizontal(): void;
  flipVertical(): void;
  resize(width: number, height: number): void;

  // Dessin libre
  setDrawTool(tool: DrawTool): void;
  clearDrawing(): void;

  // Undo / Redo (délégué au CommandBus)
  undo(): void;
  redo(): void;
  canUndo: boolean;
  canRedo: boolean;

  // Export
  export(options: ExportPhotoOptions): Promise<string>; // → URI du fichier
}

// inféré (hors brief) — hook headless
function usePhotoEditor(editor: Editor): PhotoEditorController;
```

### Commandes CommandBus (namespaces photo)

```ts
// inféré (hors brief) — namespaces de commandes dispatché vers le CommandBus
type PhotoCommand =
  | { type: 'photo:crop';    payload: { objectId: string; rect: CropRect } }
  | { type: 'photo:rotate';  payload: { objectId: string; degrees: number } }
  | { type: 'photo:flipH';   payload: { objectId: string } }
  | { type: 'photo:flipV';   payload: { objectId: string } }
  | { type: 'photo:resize';  payload: { objectId: string; width: number; height: number } }
  | { type: 'photo:draw';    payload: { objectId: string; command: DrawCommand } }
  | { type: 'photo:clearDrawing'; payload: { objectId: string } };
```

> Toutes ces commandes sont undo-able via le mécanisme standard du CommandBus.
> → [ADR-0007](./ADR/0007-mutations-commandbus-undo.md).

## Configuration

| Paramètre | Type | Défaut | Description |
|-----------|------|--------|-------------|
| `enablePhotoEditor` | `boolean` | `false` | Active le module d'édition photo. |
| `photoEditor.allowFreeAspectCrop` | `boolean` | `true` | Autorise le crop en ratio libre. |
| `photoEditor.allowedAspectRatios` | `AspectRatioPreset[]` | `['free','1:1','4:3','16:9','9:16']` | Ratios proposés dans le sélecteur. |
| `photoEditor.maxDrawingSize` | `number` | `200` | Taille maximale du pinceau (px). |
| `photoEditor.defaultExportFormat` | `ImageFormat` | `'jpeg'` | Format d'export par défaut. |
| `photoEditor.defaultExportQuality` | `number` | `0.92` | Qualité JPEG par défaut ([0, 1]). |
| `photoEditor.enableDrawing` | `boolean` | `true` | Affiche / masque les outils de dessin. |
| `photoEditor.enableOverlays` | `boolean` | `true` | Affiche / masque le panneau overlays (texte, stickers, filtres). |
| `photoEditor.enableVectorDrawing` | `boolean` | `true` | Active le mode dessin vectoriel : les traits restent redimensionnables sans perte après tracé. |
| `photoEditor.enableStrokeSelection` | `boolean` | `true` | Active la sélection et le déplacement d'un trait individuel après tracé (manipulation vectorielle). |
| `photoEditor.enableBlendModes` | `boolean` | `true` | Active les modes de fusion (`blendMode`) et les dégradés pour le pinceau. |
| `photoEditor.enableAnimatedExport` | `boolean` | `true` | Active l'export multi-frames (GIF animé, série d'images). |
| `photoEditor.persistDrawingLayer` | `boolean` | `true` | Conserve le calque de dessin comme calque séparé ré-éditable après fermeture de l'éditeur. |

→ Paramétrage complet dans [12-CONFIGURATION](./12-CONFIGURATION.md) et
[ADR-0009](./ADR/0009-headless-first-config-layers.md).

### Slots et override UI

| Slot | Composant par défaut | Description |
|------|----------------------|-------------|
| `PhotoEditorToolbar` | Barre d'outils (crop, rotate, flip, draw, overlay) | Remplaçable pour intégrer une barre personnalisée. |
| `CropHandles` | Poignées de recadrage avec grille de tiers | UI de sélection de zone de crop. |
| `DrawingCanvas` | Canvas Skia transparent superposé | Capture les gestes de dessin. |
| `ExportButton` | Bouton « Exporter » avec options format/qualité | Point d'entrée pour l'export. |

→ [24-UI-COMPONENTS](./24-UI-COMPONENTS.md).

## Décisions liées

- [ADR-0003](./ADR/0003-rendering-skia-vs-native-video.md) — choix de Skia comme moteur de rendu des calques statiques (dont les photos).
- [ADR-0007](./ADR/0007-mutations-commandbus-undo.md) — toutes les mutations photo passent par le CommandBus.
- [ADR-0009](./ADR/0009-headless-first-config-layers.md) — flags `enablePhotoEditor`, slots, `usePhotoEditor`.
- [ADR-0010](./ADR/0010-preview-export-pipeline-split.md) — séparation stricte preview (Skia temps réel) / export (pipeline offline).

## Cross-refs

- [04-RENDERER](./04-RENDERER.md) — PreviewRenderer Skia, pipeline de rendu des calques.
- [09-EXPORT-ENGINE](./09-EXPORT-ENGINE.md) — pipeline d'export JPEG / PNG offline.
- [19-TEXT-ENGINE](./19-TEXT-ENGINE.md) — overlay texte dans le Photo Editor.
- [20-STICKER-ENGINE](./20-STICKER-ENGINE.md) — overlay stickers.
- [21-FILTER-ENGINE](./21-FILTER-ENGINE.md) — filtres LUT / shaders GPU.
- [02-PROJECT-SCHEMA](./02-PROJECT-SCHEMA.md) — `ImageObject` et ses attributs de transformation.
- [12-CONFIGURATION](./12-CONFIGURATION.md) — flags `enablePhotoEditor` et paramètres associés.
- [24-UI-COMPONENTS](./24-UI-COMPONENTS.md) — `<PhotoEditor />` et ses slots.
