# 10 — Roadmap

> **Statut : ✅ stable.**

## Purpose

Donner l'**ordre de construction** du SDK : la séquence dans laquelle on bâtit les
modules pour livrer **une seule release V1 complète**. Ce sont des jalons de
construction (par quoi on commence), **pas** un découpage de fonctionnalités par
version — tout est livré en V1.

## Concepts

### Pourquoi un ordre

Chaque jalon s'appuie sur le précédent : le Core avant tout, le rendu avant l'édition,
le Runtime avant la vidéo. L'ordre minimise les dépendances non satisfaites et permet
de tester chaque couche dès qu'elle existe.

```
Core ─▶ Photo ─▶ Caméra ─▶ Vidéo ─▶ Distribution
(socle) (rendu  (capture)  (temps   (packaging,
        statique)          réel)     packs, docs)
```

## Jalons de construction

### Jalon 0 — Core
ProjectManager + SchemaRegistry · CommandBus + Undo/Redo · EventBus ·
ObjectRegistry (types built-in) · PluginManager · AssetManager.
→ [01-ARCHITECTURE](./01-ARCHITECTURE.md), [02-PROJECT-SCHEMA](./02-PROJECT-SCHEMA.md).

### Jalon 1 — Photo
PreviewRenderer (Skia, calques statiques) · Photo Editor (crop, rotate, flip, draw) ·
Text Engine + Font Manager · Sticker Engine · Filter Engine (photo) · ExportRenderer
(JPEG, PNG) **+ export en job d'arrière-plan / aperçu immédiat**
([27-BACKGROUND-JOBS](./27-BACKGROUND-JOBS.md)) · LicenseManager + interface de validation.
→ [04-RENDERER](./04-RENDERER.md), [17-PHOTO-EDITOR](./17-PHOTO-EDITOR.md),
[19-TEXT-ENGINE](./19-TEXT-ENGINE.md), [20-STICKER-ENGINE](./20-STICKER-ENGINE.md),
[21-FILTER-ENGINE](./21-FILTER-ENGINE.md), [07-LICENSE-SYSTEM](./07-LICENSE-SYSTEM.md).

### Jalon 2 — Caméra
Camera Module (photo + vidéo) · capture multi-clips.
→ [16-CAMERA](./16-CAMERA.md), [ADR-0012](./ADR/0012-camera-vision-camera.md).

### Jalon 3 — Vidéo
Runtime (play, pause, seek, clock) · Video Editor (trim, split, merge, speed, reverse) ·
Timeline (multi-tracks, drag, snap, seek) · PreviewRenderer vidéo (synchro clock) ·
Audio Engine · Transition Engine · ExportRenderer vidéo (MP4, MOV) · Security Layer.
→ [03-RUNTIME](./03-RUNTIME.md), [05-TIMELINE](./05-TIMELINE.md),
[18-VIDEO-EDITOR](./18-VIDEO-EDITOR.md), [22-AUDIO-ENGINE](./22-AUDIO-ENGINE.md),
[23-TRANSITION-ENGINE](./23-TRANSITION-ENGINE.md), [09-EXPORT-ENGINE](./09-EXPORT-ENGINE.md).

### Jalon 4 — Distribution
**Composant Studio orchestré** (machine à états interne capture→edit→preview, éditeur
unifié, vignette de progression — [26-STUDIO-FLOW](./26-STUDIO-FLOW.md)) ·
ResourcePack System · Music Library intégrée · UI theming complet · CLI `media-studio` ·
Documentation complète (Docusaurus) · Publication npm (`@media-studio/*`) ·
Exemples d'intégration.
→ [08-ASSET-MANAGER](./08-ASSET-MANAGER.md), [24-UI-COMPONENTS](./24-UI-COMPONENTS.md),
[25-DEVELOPER-DOCS](./25-DEVELOPER-DOCS.md), [11-MONOREPO](./11-MONOREPO.md).

## Configuration

L'ordre est un guide de construction, pas une contrainte de livraison : un intégrateur
reçoit l'ensemble du SDK et active ce dont il a besoin via les capability flags
([12-CONFIGURATION](./12-CONFIGURATION.md)).

## Décisions liées

- [ADR-0007](./ADR/0007-mutations-commandbus-undo.md) — le Core (Jalon 0) en premier.
- [ADR-0010](./ADR/0010-preview-export-pipeline-split.md) — rendu avant édition.

## Cross-refs

- [00-VISION](./00-VISION.md) · [11-MONOREPO](./11-MONOREPO.md) · [14-TESTING](./14-TESTING.md).
