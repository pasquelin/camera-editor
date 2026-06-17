/**
 * @media-studio/camera — module de capture (headless). État de session optique +
 * bornes + intégration projet via le CommandBus. Le flux/permissions/déclenchement
 * réels sont fournis par la couche native (react-native-vision-camera + module
 * Expo `CameraControlsModule`). Voir docs/16-CAMERA.md, ADR-0006.
 */
export {
  createCameraSession,
  clampExposure,
  clampZoom,
  clampPointOfInterest,
  type CameraSession,
} from "./session";
export type {
  FlashMode,
  CameraRatio,
  CameraFacing,
  PointOfInterest,
  PhotoCapture,
  VideoCapture,
  CameraConfig,
} from "./types";
