/**
 * @media-studio/photo-editor — contrôleur headless d'édition photo. API typée
 * au-dessus des commandes `image.*` / `photo.*` du Core et des overlays
 * (texte/sticker/filtre). Toutes via CommandBus (undo/redo).
 *
 * Hors périmètre headless (couplés au PreviewRenderer Skia, fournis par la couche
 * native/UI) : le dessin libre (`photo.draw`/`clearDrawing`), le `resize` (export
 * uniquement) et l'`export`. Voir docs/17-PHOTO-EDITOR.md.
 */
import type {
  Core,
  FilterObject,
  ImageObject,
  StickerObject,
  TextObject,
} from "@media-studio/core";

export interface PhotoEditorController {
  // Image de base
  addImage(object?: Partial<ImageObject>, id?: string): void;
  update(objectId: string, patch: Partial<ImageObject>): void;
  remove(objectId: string): void;

  // Transformations géométriques
  crop(objectId: string, crop: ImageObject["crop"]): void;
  rotate(objectId: string, degrees: number): void;
  flipHorizontal(objectId: string): void;
  flipVertical(objectId: string): void;

  // Overlays (dispatché vers les moteurs respectifs)
  addText(object?: Partial<TextObject>, id?: string): void;
  addSticker(object?: Partial<StickerObject>, id?: string): void;
  addFilter(object?: Partial<FilterObject>, id?: string): void;

  // Undo / Redo
  undo(): void;
  redo(): void;
  canUndo(): boolean;
  canRedo(): boolean;
}

/** Crée un contrôleur d'édition photo lié à un Core. */
export function createPhotoEditor(core: Core): PhotoEditorController {
  return {
    addImage: (object, id) => core.execute("image.create", { id, object }),
    update: (objectId, patch) => core.execute("image.update", { objectId, patch }),
    remove: (objectId) => core.execute("image.delete", { objectId }),
    crop: (objectId, crop) => core.execute("image.crop", { objectId, crop }),
    rotate: (objectId, degrees) =>
      core.execute("image.update", { objectId, patch: { rotation: degrees } }),
    flipHorizontal: (objectId) => core.execute("photo.flipH", { objectId }),
    flipVertical: (objectId) => core.execute("photo.flipV", { objectId }),
    addText: (object, id) => core.execute("text.create", { id, object }),
    addSticker: (object, id) => core.execute("sticker.create", { id, object }),
    addFilter: (object, id) => core.execute("filter.create", { id, object }),
    undo: () => core.undo(),
    redo: () => core.redo(),
    canUndo: () => core.commands.canUndo(),
    canRedo: () => core.commands.canRedo(),
  };
}
