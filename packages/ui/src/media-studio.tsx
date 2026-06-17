/**
 * <MediaStudio /> — coquille d'éditeur headless-first, présentée en overlay par le
 * Provider quand `isOpen`. Pilote l'état via le contrôleur `createPhotoEditor`
 * (commandes → CommandBus → undo/redo) et se rafraîchit sur les événements du Core
 * (`stack:changed`, `timeline:changed`). La capture (caméra) et la preview Skia
 * haute-fidélité sont des slots fournis par l'intégrateur. Voir docs/26-STUDIO-FLOW.md.
 */
import React, { useEffect, useMemo, useReducer } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { DEFAULT_EXPORT_CONFIG, createPhotoEditor, type ExportConfig } from "@media-studio/sdk";
import { useMediaStudio } from "./provider";

export interface MediaStudioProps {
  /** Config d'export utilisée par le bouton « Exporter ». */
  exportConfig?: ExportConfig;
  /** Slot d'aperçu (preview Skia / vidéo native) rendu en haut de l'éditeur. */
  preview?: React.ReactNode;
}

function Button({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}): React.JSX.Element {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={{
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 12,
        borderCurve: "continuous",
        backgroundColor: "rgba(255,255,255,0.12)",
        opacity: disabled ? 0.4 : 1,
      }}
    >
      <Text style={{ color: "#fff", fontSize: 14 }}>{label}</Text>
    </Pressable>
  );
}

export function MediaStudio({ exportConfig, preview }: MediaStudioProps): React.JSX.Element | null {
  const { studio, isOpen, close, exportProject } = useMediaStudio();
  const [, forceRender] = useReducer((n: number) => n + 1, 0);
  const editor = useMemo(() => createPhotoEditor(studio.core), [studio.core]);

  // Réactivité pilotée par le Core (et non par des forceRender manuels).
  useEffect(() => {
    const unsubscribers = [
      studio.core.on("stack:changed", forceRender),
      studio.core.on("timeline:changed", forceRender),
    ];
    return () => unsubscribers.forEach((u) => u());
  }, [studio]);

  if (!isOpen) return null;

  const project = studio.core.project.get();
  const counts = {
    video: project.tracks.video.length,
    text: project.tracks.text.length,
    sticker: project.tracks.sticker.length,
    filter: project.tracks.filter.length,
    audio: project.tracks.audio.length,
  };

  return (
    <View style={{ position: "absolute", inset: 0, backgroundColor: "#0b0b0c" }}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16, paddingTop: 60 }}>
        <View
          style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}
        >
          <Text style={{ color: "#fff", fontSize: 22, fontWeight: "600" }}>Media Studio</Text>
          <Button label="Fermer" onPress={close} />
        </View>

        {preview ?? (
          <View
            style={{
              height: 200,
              borderRadius: 16,
              borderCurve: "continuous",
              backgroundColor: "#161618",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: "rgba(255,255,255,0.5)" }}>Aperçu (slot preview)</Text>
          </View>
        )}

        <Text selectable style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>
          {`Objets — vidéo:${counts.video} texte:${counts.text} sticker:${counts.sticker} filtre:${counts.filter} audio:${counts.audio}`}
        </Text>

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          <Button label="+ Texte" onPress={() => editor.addText({ content: "Texte" })} />
          <Button label="+ Sticker" onPress={() => editor.addSticker({ source: "star.png" })} />
          <Button label="+ Filtre" onPress={() => editor.addFilter({ filterId: "cinema-drama" })} />
          <Button label="Annuler" onPress={editor.undo} disabled={!editor.canUndo()} />
          <Button label="Rétablir" onPress={editor.redo} disabled={!editor.canRedo()} />
        </View>

        <Button
          label="Exporter"
          onPress={() => exportProject(exportConfig ?? DEFAULT_EXPORT_CONFIG)}
        />
      </ScrollView>
    </View>
  );
}
