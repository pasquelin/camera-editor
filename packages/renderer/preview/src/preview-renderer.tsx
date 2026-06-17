/**
 * PreviewRenderer temps réel (Skia) — compose les calques visuels du projet sur un
 * canvas Skia (parité preview/export assurée par le pipeline d'export distinct).
 * Couvre ici la composition photo : images de base + overlays texte. Les frames
 * vidéo sont affichées par le lecteur natif (slot), les filtres/stickers GPU sont
 * des extensions. Voir docs/04-RENDERER.md, docs/17, ADR-0010.
 */
import React from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { Canvas, Image, Text as SkiaText, matchFont, useImage } from "@shopify/react-native-skia";
import type { ImageObject, Project, TextObject } from "@media-studio/core";

function ImageLayer({ object }: { object: ImageObject }): React.JSX.Element | null {
  const image = useImage(object.source);
  if (!image) return null;
  return (
    <Image
      image={image}
      x={object.x}
      y={object.y}
      width={object.width || image.width()}
      height={object.height || image.height()}
      fit="cover"
      opacity={object.opacity}
    />
  );
}

function TextLayer({ object }: { object: TextObject }): React.JSX.Element {
  const font = matchFont({
    fontFamily: object.style.fontFamily,
    fontSize: object.style.fontSize,
  });
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

/** Compose le projet (images + texte) sur un canvas Skia. */
export function PreviewRenderer({
  project,
  width,
  height,
  style,
}: PreviewRendererProps): React.JSX.Element {
  const images = project.tracks.video.filter(
    (o): o is ImageObject => o.type === "image" && o.visible,
  );
  const texts = project.tracks.text.filter((o) => o.visible);

  return (
    <Canvas style={[{ width, height }, style]}>
      {images.map((object) => (
        <ImageLayer key={object.id} object={object} />
      ))}
      {texts.map((object) => (
        <TextLayer key={object.id} object={object} />
      ))}
    </Canvas>
  );
}
