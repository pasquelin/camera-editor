/**
 * Écran d'accueil : ouvre l'éditeur Media Studio et affiche un statut. L'éditeur et
 * la vignette d'export sont montés par le layout racine. La logique média (commandes,
 * undo/redo, export) est fournie par le SDK headless via `useMediaStudio()`.
 */
import { ScrollView, Text, View, Pressable } from "react-native";
import { Link } from "expo-router";
import { useMediaStudio } from "@media-studio/ui";

export default function Home() {
  const { open, jobs, studio } = useMediaStudio();
  const project = studio.core.project.get();
  const completed = jobs.filter((j) => j.status === "completed").length;

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: 20, gap: 16 }}
    >
      <Text style={{ fontSize: 15, color: "#444" }}>
        Démo d'intégration du SDK Media Studio. L'éditeur s'ouvre en overlay ; l'export part en
        arrière-plan (vignette globale).
      </Text>

      <Pressable
        onPress={open}
        style={{
          paddingVertical: 16,
          borderRadius: 14,
          borderCurve: "continuous",
          backgroundColor: "#0a84ff",
          alignItems: "center",
        }}
      >
        <Text style={{ color: "#fff", fontSize: 17, fontWeight: "600" }}>Ouvrir l'éditeur</Text>
      </Pressable>

      <Link href="/camera" asChild>
        <Pressable
          style={{
            paddingVertical: 16,
            borderRadius: 14,
            borderCurve: "continuous",
            backgroundColor: "#1c1c1e",
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#fff", fontSize: 17, fontWeight: "600" }}>Caméra</Text>
        </Pressable>
      </Link>

      <View style={{ gap: 4 }}>
        <Text selectable style={{ color: "#666" }}>
          {`Projet ${project.id} — ${project.aspectRatio}`}
        </Text>
        <Text selectable style={{ color: "#666", fontVariant: ["tabular-nums"] }}>
          {`Exports terminés : ${completed}`}
        </Text>
      </View>
    </ScrollView>
  );
}
