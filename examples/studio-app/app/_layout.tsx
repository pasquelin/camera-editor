/**
 * Layout racine : monte `MediaStudioProvider` à la racine (détient JobQueue +
 * licence + drafts), la pile de navigation, l'éditeur en overlay et la vignette
 * d'export globale visible sur tous les écrans. Voir docs/26, docs/27, ADR-0017.
 */
import { Stack } from "expo-router/stack";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ExportProgress, MediaStudio, MediaStudioProvider } from "@media-studio/ui";
import { createExportRenderer, createLicense } from "@media-studio/sdk";
import { demoEncoder } from "@/lib/demo-encoder";

const license = createLicense("pro");
const exportRenderer = createExportRenderer({ primary: demoEncoder, license });

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <MediaStudioProvider license={license} exportRenderer={exportRenderer}>
        <Stack screenOptions={{ headerLargeTitle: true }}>
          <Stack.Screen name="index" options={{ title: "Media Studio" }} />
          <Stack.Screen
            name="camera"
            options={{ title: "Caméra", presentation: "fullScreenModal" }}
          />
        </Stack>
        {/* Éditeur présenté en overlay quand useMediaStudio().open() est appelé */}
        <MediaStudio />
        {/* Vignette de progression globale (au-dessus de tous les écrans) */}
        <ExportProgress />
        <StatusBar style="light" />
      </MediaStudioProvider>
    </SafeAreaProvider>
  );
}
