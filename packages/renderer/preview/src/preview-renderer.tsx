/**
 * PreviewRenderer temps réel (Skia) — compose les calques visuels du projet sur un
 * canvas Skia (parité preview/export assurée par le pipeline d'export distinct).
 * Couvre la composition photo : images de base + stickers (images) + overlays texte.
 * Les frames vidéo sont affichées par le lecteur natif (slot) ; les filtres GPU sont
 * une extension. Voir docs/04-RENDERER.md, docs/17, docs/20, ADR-0010.
 *
 * TODO(phase native) : appliquer `scale`/`rotation` via une matrice Skia (ici seules
 * position et opacité sont appliquées).
 */
import React, { useMemo } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { Canvas, Image, Text as SkiaText, matchFont, useImage } from "@shopify/react-native-skia";
import type { ImageObject, Project, StickerObject, TextObject } from "@media-studio/core";

/** Forme commune des calques rendus comme image (ImageObject, StickerObject). */
interface ImageLike {
  source: string;
  x: number;
  y: number;
  width: number;
  height: number;
  opacity: number;
}

function ImageLayer({ object }: { object: ImageLike }): React.JSX.Element | null {
  const image = useImage(object.source);
  if (!image) return null;
  return (
    <Image
      image={image}
      x={object.x}
      y={object.y}
      // width/height 0 (défaut) → taille intrinsèque de l'image.
      width={object.width || image.width()}
      height={object.height || image.height()}
      fit="cover"
      opacity={object.opacity}
    />
  );
}

function TextLayer({ object }: { object: TextObject }): React.JSX.Element {
  const font = useMemo(
    () => matchFont({ fontFamily: object.style.fontFamily, fontSize: object.style.fontSize }),
    [object.style.fontFamily, object.style.fontSize],
  );
  return (
    <SkiaText
      x={object.x}
      y={object.y + object.style.fontSize}
      text={object.content}
      font={font}
      color={object.style.color}
      opacity={object.opacity}
    />
  );
}

export interface PreviewRendererProps {
  project: Readonly<Project>;
  width: number;
  height: number;
  style?: StyleProp<ViewStyle>;
}

/** Compose le projet (images + stickers + texte) sur un canvas Skia. */
export function PreviewRenderer({
  project,
  width,
  height,
  style,
}: PreviewRendererProps): React.JSX.Element {
  const { video, sticker, text } = project.tracks;

  const images = useMemo(
    () => video.filter((o): o is ImageObject => o.type === "image" && o.visible),
    [video],
  );
  const stickers = useMemo(() => sticker.filter((o) => o.visible), [sticker]);
  const texts = useMemo(() => text.filter((o) => o.visible), [text]);

  return (
    <Canvas style={[{ width, height }, style]}>
      {images.map((object) => (
        <ImageLayer key={object.id} object={object} />
      ))}
      {stickers.map((object: StickerObject) => (
        <ImageLayer key={object.id} object={object} />
      ))}
      {texts.map((object) => (
        <TextLayer key={object.id} object={object} />
      ))}
    </Canvas>
  );
}
