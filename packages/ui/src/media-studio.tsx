/**
 * <MediaStudio /> — coquille d'éditeur headless-first, présentée en overlay par le
 * Provider quand `isOpen`. Pilote l'état via les commandes du Core (undo/redo) et
 * lance l'export. La capture (caméra) et la preview Skia haute-fidélité sont des
 * slots fournis par l'intégrateur / la couche native. Voir docs/26-STUDIO-FLOW.md.
 */
import React, { useReducer } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import type { ExportConfig } from "@media-studio/sdk";
import { useMediaStudio } from "./provider";

const DEFAULT_EXPORT: ExportConfig = {
  format: "mp4",
  resolution: "1080p",
  fps: 30,
  videoBitrate: 8000,
  audioBitrate: 128,
  codec: "h264",
  quality: 1,
};

export interface MediaStudioProps {
  /** Config d'export utilisée par le bouton « Exporter ». */
  exportConfig?: ExportConfig;
  /** Slot d'aperçu (preview Skia / vidéo native) rendu en haut de l'éditeur. */
  preview?: React.ReactNode;
}

function Button({ label, onPress }: { label: string; onPress: () => void }): React.JSX.Element {
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 12,
        borderCurve: "continuous",
        backgroundColor: "rgba(255,255,255,0.12)",
      }}
    >
      <Text style={{ color: "#fff", fontSize: 14 }}>{label}</Text>
    </Pressable>
  );
}

export function MediaStudio({ exportConfig, preview }: MediaStudioProps): React.JSX.Element | null {
  const { studio, isOpen, close, exportProject } = useMediaStudio();
  const [, forceRender] = useReducer((n: number) => n + 1, 0);
  const { core } = studio;

  if (!isOpen) return null;

  const run = (name: string, payload?: unknown): void => {
    core.execute(name, payload);
    forceRender();
  };
  const undo = (): void => {
    core.undo();
    forceRender();
  };
  const redo = (): void => {
    core.redo();
    forceRender();
  };
  const project = core.project.get();
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
          <Button
            label="+ Texte"
            onPress={() => run("text.create", { object: { content: "Texte" } })}
          />
          <Button
            label="+ Sticker"
            onPress={() => run("sticker.create", { object: { source: "star.png" } })}
          />
          <Button
            label="+ Filtre"
            onPress={() => run("filter.create", { object: { filterId: "cinema-drama" } })}
          />
          <Button label="Annuler" onPress={undo} />
          <Button label="Rétablir" onPress={redo} />
        </View>

        <Button label="Exporter" onPress={() => exportProject(exportConfig ?? DEFAULT_EXPORT)} />
      </ScrollView>
    </View>
  );
}
