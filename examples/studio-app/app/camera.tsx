/**
 * Écran de capture caméra (expo-camera, compatible Expo Go). Chaque photo capturée
 * est intégrée au projet via la session caméra headless (`createCameraSession`), qui
 * dispatche `image.create` sur le CommandBus. En production, brancher
 * react-native-vision-camera + le module natif pour la vidéo segmentée et les
 * contrôles avancés. Voir docs/16-CAMERA.md.
 */
import { useMemo, useRef } from "react";
import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { CameraView, useCameraPermissions, type CameraView as CameraViewRef } from "expo-camera";
import { createCameraSession } from "@media-studio/sdk";
import { useMediaStudio } from "@media-studio/ui";

export default function CameraScreen() {
  const { studio } = useMediaStudio();
  const session = useMemo(
    () => createCameraSession(studio.core, { defaultRatio: "9:16" }),
    [studio],
  );
  const cameraRef = useRef<CameraViewRef>(null);
  const [permission, requestPermission] = useCameraPermissions();

  if (!permission) return null;

  if (!permission.granted) {
    return (
      <View
        style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 16, padding: 24 }}
      >
        <Text style={{ textAlign: "center", color: "#444" }}>
          L'accès à la caméra est nécessaire pour capturer des médias.
        </Text>
        <Pressable
          onPress={requestPermission}
          style={{
            backgroundColor: "#0a84ff",
            paddingHorizontal: 20,
            paddingVertical: 12,
            borderRadius: 12,
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "600" }}>Autoriser la caméra</Text>
        </Pressable>
      </View>
    );
  }

  const capture = async (): Promise<void> => {
    const photo = await cameraRef.current?.takePictureAsync();
    if (!photo) return;
    session.addPhoto({ uri: photo.uri, width: photo.width, height: photo.height });
    router.back();
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <CameraView ref={cameraRef} style={{ flex: 1 }} facing={session.facing} />
      <View
        style={{
          position: "absolute",
          bottom: 48,
          left: 0,
          right: 0,
          alignItems: "center",
          gap: 12,
        }}
      >
        <Pressable
          onPress={capture}
          style={{
            width: 74,
            height: 74,
            borderRadius: 37,
            backgroundColor: "#fff",
            borderWidth: 4,
            borderColor: "rgba(255,255,255,0.5)",
          }}
        />
        <Pressable onPress={() => session.switchCamera()}>
          <Text style={{ color: "#fff" }}>Changer de caméra</Text>
        </Pressable>
      </View>
    </View>
  );
}
