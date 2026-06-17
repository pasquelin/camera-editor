/**
 * <ExportProgress /> — vignette de progression globale, façon TikTok. Rendue par le
 * Provider racine, visible au-dessus de tous les écrans, sans bloquer l'interaction.
 * Affiche les jobs actifs (queued/running) avec leur pourcentage.
 * Voir docs/27-BACKGROUND-JOBS.md, docs/24-UI-COMPONENTS.md.
 */
import React from "react";
import { Text, View } from "react-native";
import { useMediaStudio } from "./provider";

export interface ExportProgressProps {
  /** Masque la vignette même s'il y a des jobs actifs. */
  hidden?: boolean;
}

export function ExportProgress({ hidden }: ExportProgressProps): React.JSX.Element | null {
  const { jobs } = useMediaStudio();
  const active = jobs.filter((j) => j.status === "queued" || j.status === "running");
  if (hidden || active.length === 0) return null;

  const job = active[0];
  if (!job) return null;
  const pct = Math.round(job.progress * 100);

  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        right: 16,
        bottom: 32,
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 16,
        borderCurve: "continuous",
        backgroundColor: "rgba(0,0,0,0.78)",
        boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
      }}
    >
      <View
        style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          borderCurve: "continuous",
          backgroundColor: "rgba(255,255,255,0.15)",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ color: "#fff", fontSize: 11, fontVariant: ["tabular-nums"] }}>{pct}%</Text>
      </View>
      <Text style={{ color: "#fff", fontSize: 13 }}>
        Export{active.length > 1 ? ` (${active.length})` : ""}…
      </Text>
    </View>
  );
}
